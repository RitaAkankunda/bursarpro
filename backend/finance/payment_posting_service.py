"""B2-H4-C: audited bursar payment posting boundary.

All normal payment POSTs pass through this transaction. There is deliberately no
provider settlement support; legacy online checkout and bulk import remain gated.
"""
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import ClassLevel, FeeStructure, Payment, School, Student, Term, UserRole
from .reversal_ledger import net_paid_total


def _parse_amount(raw):
    try:
        amount = Decimal(str(raw))
    except (TypeError, ValueError, InvalidOperation):
        raise ValidationError({'amount': 'Invalid payment amount.'})
    if not amount.is_finite() or amount <= 0 or amount.as_tuple().exponent < -2 or amount > Decimal('99999999.99'):
        raise ValidationError({'amount': 'Payment must be positive and have at most two decimal places.'})
    return amount


@transaction.atomic
def post_bursar_payment(*, user, student_id, term_id, amount, payment_method):
    """Post a manually verified receipt under a per-school transaction lock.

    Locking the school serializes fee balance reads/writes for requests going
    through this service on PostgreSQL/MySQL. SQLite is not a production
    concurrency proof. Never call this for unverified provider payments.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied('Authentication required.')
    role = UserRole.objects.filter(user=user, role='BURSAR').first()
    if not role or not role.school_id:
        raise PermissionDenied('School bursar access required.')
    school = School.objects.select_for_update().get(pk=role.school_id)
    student = Student.objects.select_related('class_level').filter(pk=student_id, school=school).first()
    term = Term.objects.filter(pk=term_id, school=school).first()
    if student is None or term is None:
        raise PermissionDenied('Student and term must belong to your school.')
    if not student.class_level_id or student.class_level.school_id != school.pk:
        raise ValidationError({'student': 'Student must have a class in your school.'})
    if payment_method not in {'CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'}:
        raise ValidationError({'payment_method': 'Unsupported payment method.'})
    amount = _parse_amount(amount)
    fee_rows = list(FeeStructure.objects.filter(term=term, class_level=student.class_level))
    if len(fee_rows) != 1:
        raise ValidationError({'term': 'Exactly one applicable fee structure is required.'})
    fee = fee_rows[0]
    if fee.amount is None or fee.amount <= 0:
        raise ValidationError({'term': 'Fee structure must have a positive amount.'})
    already_paid = net_paid_total(Payment.objects.filter(student=student, term=term))
    if already_paid + amount > fee.amount:
        raise ValidationError({'amount': 'Amount exceeds remaining fee balance.'})
    # Never rely on a client-supplied receipt number. Unique index is final collision guard.
    receipt = 'BP-' + uuid4().hex.upper()
    payment = Payment.objects.create(
        student=student, term=term, amount=amount,
        payment_method=payment_method, receipt_number=receipt,
        recorded_by=user,
    )
    return payment
