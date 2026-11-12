"""B2-H4-D5 staged reversal approvals. Execution intentionally disabled.

This is an application service, not a replacement for accounting settlement.
"""
from django.db import transaction
from django.utils import timezone
from .models import Payment, UserRole, School, PaymentReconciliation
from .refund_models import PaymentReversal, AuditLog


def _bursar_school(user):
    if not user or not user.is_authenticated:
        raise ValueError('Authenticated school bursar required.')
    schools = list(UserRole.objects.filter(user=user, role='BURSAR', school_id__isnull=False)
                   .values_list('school_id', flat=True).distinct()[:2])
    if len(schools) != 1:
        raise ValueError('Exactly one assigned school bursar role is required.')
    return schools[0]


@transaction.atomic
def request_reversal(user, payment_id, reason):
    school_id = _bursar_school(user)
    if not isinstance(reason, str) or not (10 <= len(reason.strip()) <= 2000):
        raise ValueError('Reversal reason must be 10 to 2000 characters.')
    try:
        payment_id = int(payment_id)
    except (TypeError, ValueError):
        raise ValueError('A valid payment_id is required.')
    # Lock the school to serialize operations within the same school on PostgreSQL.
    School.objects.select_for_update().get(pk=school_id)
    payment = (Payment.objects.select_for_update().select_related('student')
               .filter(pk=payment_id, student__school_id=school_id, term__school_id=school_id).first())
    if not payment:
        raise ValueError('Payment not found in your school.')
    if PaymentReconciliation.objects.filter(payment_id=payment.pk).exists():
        raise ValueError('Payment is linked to bank reconciliation; specialist review is required.')
    if PaymentReversal.objects.filter(payment=payment).exists():
        raise ValueError('A reversal already exists for this payment.')
    reversal = PaymentReversal.objects.create(
        payment=payment, reason=reason.strip(), description='Reversal approval requested',
        status='PENDING', requested_by=user, original_amount=payment.amount,
        original_receipt=payment.receipt_number,
    )
    AuditLog.objects.create(
        action='CREATE', entity_type='REVERSAL', entity_id=reversal.pk,
        performed_by=user, new_values={'payment_id': payment.pk, 'status': 'PENDING'},
        description='Reversal requested; original payment preserved.',
    )
    return reversal


@transaction.atomic
def approve_reversal(user, reversal_id):
    school_id = _bursar_school(user)
    try:
        reversal_id = int(reversal_id)
    except (ValueError, TypeError):
        raise ValueError('A valid reversal ID is required.')
    School.objects.select_for_update().get(pk=school_id)
    reversal = (PaymentReversal.objects.select_for_update().select_related('payment', 'requested_by')
                .filter(pk=reversal_id, payment__student__school_id=school_id).first())
    if reversal is None:
        raise ValueError('Reversal not found in your school.')
    payment = Payment.objects.select_for_update().filter(
        pk=reversal.payment_id, student__school_id=school_id, term__school_id=school_id
    ).first()
    if payment is None:
        raise ValueError('Payment school or term has changed; approval is blocked.')
    if reversal.status != 'PENDING':
        raise ValueError('Only pending reversals can be approved.')
    if PaymentReconciliation.objects.filter(payment_id=reversal.payment_id).exists():
        raise ValueError('Payment became linked to bank reconciliation; approval is blocked.')
    if reversal.requested_by_id == user.pk:
        raise ValueError('Requester cannot approve their own reversal.')
    if reversal.original_amount != payment.amount or reversal.original_receipt != payment.receipt_number:
        raise ValueError('Original payment snapshot differs; manual financial review is required.')
    reversal.status = 'APPROVED'
    reversal.approved_by = user
    reversal.approved_at = timezone.now()
    reversal.save(update_fields=['status', 'approved_by', 'approved_at'])
    AuditLog.objects.create(
        action='APPROVE', entity_type='REVERSAL', entity_id=reversal.pk,
        performed_by=user, old_values={'status': 'PENDING'}, new_values={'status': 'APPROVED'},
        description='Reversal approved for future execution; no financial effect yet.',
    )
    return reversal


@transaction.atomic
def execute_reversal(user, reversal_id):
    """Post an approved full reversal without deleting the original payment.

    Explicit opt-in is intentionally off by default. Do not activate on a
    production deployment without separate PostgreSQL, reporting, and audit gates.
    """
    from django.conf import settings
    if not getattr(settings, 'BURSARPRO_ENABLE_REVERSAL_EXECUTION', False):
        raise ValueError('Reversal execution is disabled pending the financial release gate.')
    school_id = _bursar_school(user)
    try:
        reversal_id = int(reversal_id)
    except (TypeError, ValueError):
        raise ValueError('A valid reversal ID is required.')

    # All posting paths use the school-level lock to serialize on PostgreSQL.
    School.objects.select_for_update().get(pk=school_id)
    reversal = (PaymentReversal.objects.select_for_update()
                .select_related('payment', 'requested_by', 'approved_by')
                .filter(pk=reversal_id, payment__student__school_id=school_id).first())
    if reversal is None:
        raise ValueError('Reversal not found in your school.')
    # Lock the original payment too, so all three records use a stable snapshot.
    payment = Payment.objects.select_for_update().filter(
        pk=reversal.payment_id, student__school_id=school_id, term__school_id=school_id
    ).first()
    if payment is None:
        raise ValueError('Payment school or term has changed; execution is blocked.')
    if reversal.status != 'APPROVED' or not reversal.approved_by_id or not reversal.approved_at:
        raise ValueError('Only explicitly approved reversals can be executed.')
    if user.pk in (reversal.requested_by_id, reversal.approved_by_id):
        raise ValueError('Execution must be performed by a third authorized bursar.')
    if (reversal.original_amount != payment.amount
            or reversal.original_receipt != payment.receipt_number):
        raise ValueError('Payment differs from the approved reversal snapshot.')
    # A linked bank row is a financial dependency even when its status is not MATCHED.
    # Do not reverse until a separately reviewed unlink/remediation workflow exists.
    if PaymentReconciliation.objects.filter(payment_id=reversal.payment_id).exists():
        raise ValueError('Bank-linked payments require reconciliation review before reversal.')

    reversal.status = 'REVERSED'
    reversal.reversed_at = timezone.now()
    reversal.save(update_fields=['status', 'reversed_at'])
    AuditLog.objects.create(
        action='COMPLETE', entity_type='REVERSAL', entity_id=reversal.pk,
        performed_by=user, old_values={'status':'APPROVED'},
        new_values={'status':'REVERSED','payment_id':reversal.payment_id},
        description='Approved full reversal executed; original payment retained.',
    )
    return reversal
