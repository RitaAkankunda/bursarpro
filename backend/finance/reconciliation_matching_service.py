"""B2-H4-D2 — explicit, atomic, school-scoped reconciliation of existing records.

A bank row must already exist from a trusted ingestion workflow; this service
never invents bank transactions or posts a payment. Its assertions do not
constitute external settlement verification.
"""
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from .models import Payment, PaymentReconciliation, School, UserRole


@transaction.atomic
def match_existing_payment(*, user, reconciliation_id, payment_id, notes=''):
    if not user or not user.is_authenticated:
        raise PermissionDenied('Authentication is required.')
    role = UserRole.objects.filter(user=user, role='BURSAR', school__isnull=False).first()
    if not role:
        raise PermissionDenied('School bursar access required.')
    # Lock the school first to use the same ordering as the posting engine.
    School.objects.select_for_update().get(pk=role.school_id)
    # Inspect the bank row without locking it yet. The global order is
    # school -> payment -> bank row, shared with reversal requests/execution.
    row = (PaymentReconciliation.objects
           .select_related('bank_statement')
           .filter(pk=reconciliation_id, bank_statement__school_id=role.school_id)
           .first())
    if row is None:
        raise NotFound('Bank reconciliation record not found.')
    if row.bank_statement.term.school_id != role.school_id:
        raise ValidationError({'bank_statement': 'Statement term is not in your school.'})
    try:
        payment_pk = int(payment_id)
    except (ValueError, TypeError):
        raise ValidationError({'payment_id': 'A valid payment ID is required.'})
    payment = (Payment.objects.select_for_update()
               .filter(pk=payment_pk, student__school_id=role.school_id,
                       term__school_id=role.school_id,
                       term_id=row.bank_statement.term_id)
               .first())
    if payment is None:
        raise ValidationError({'payment_id': 'Payment not found in this school and term.'})
    # Re-read and lock the bank row after acquiring the payment lock, so an
    # independent row update cannot invalidate a pre-lock snapshot.
    row = (PaymentReconciliation.objects.select_for_update()
           .select_related('bank_statement')
           .filter(pk=reconciliation_id, bank_statement__school_id=role.school_id,
                   bank_statement__term__school_id=role.school_id)
           .first())
    if row is None or row.bank_statement.term_id != payment.term_id:
        raise ValidationError({'bank_statement': 'Bank row or school term changed.'})
    from .refund_models import PaymentReversal
    if PaymentReversal.objects.filter(payment=payment).exists():
        raise ValidationError({'payment_id': 'A payment with a reversal record cannot be reconciled.'})
    if row.status in {'MATCHED', 'MANUAL_MATCHED'}:
        if row.payment_id == payment.pk:
            return row  # idempotent same-match retry; do not rewrite audit fields
        raise ValidationError({'payment_id': 'This bank row is already matched.'})
    if row.status != 'UNMATCHED' or row.payment_id is not None:
        raise ValidationError({'status': 'Only unmatched bank rows may be matched.'})
    if payment.payment_method not in {'BANK_TRANSFER', 'MOBILE_MONEY'}:
        raise ValidationError({'payment_id': 'Cash receipts cannot be bank-statement matched.'})
    if row.bank_amount <= Decimal('0') or row.bank_amount != payment.amount:
        raise ValidationError({'bank_amount': 'Amounts must be positive and match exactly.'})
    if PaymentReconciliation.objects.filter(payment_id=payment.pk).exclude(pk=row.pk).exists():
        raise ValidationError({'payment_id': 'This payment is matched to another bank transaction.'})
    if not isinstance(notes, str) or len(notes)>500:
        raise ValidationError({'notes': 'Notes must be text of at most 500 characters.'})
    from django.utils import timezone
    row.payment = payment
    row.matched_amount = payment.amount
    row.amount_difference = Decimal('0.00')
    row.status = 'MANUAL_MATCHED'
    row.confidence_score = 100
    row.matched_by = user
    row.matched_at = timezone.now()
    row.notes = notes
    row.save(update_fields=['payment','matched_amount','amount_difference','status',
                            'confidence_score','matched_by','matched_at','notes','updated_at'])
    return row
