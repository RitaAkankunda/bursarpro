"""B2-H4-D3 reversal-aware read model, no deletes, no ledger state writes.

An APPROVED or PENDING reversal does not change net collections. Only the
REVERSED state compensates the original payment. Never hide raw receipts.
"""
from decimal import Decimal
from django.db.models import Sum


def effective_payments(queryset):
    """Exclude fully executed reversals only, preserving full raw history."""
    return queryset.exclude(reversal__status='REVERSED')


def net_paid_total(queryset):
    return effective_payments(queryset).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')


def reversal_preview(payment):
    """Non-mutating preview of the financial effect of a full reversal."""
    from .models import Payment, FeeStructure
    previous = net_paid_total(Payment.objects.filter(student=payment.student, term=payment.term))
    active = not Payment.objects.filter(pk=payment.pk, reversal__status='REVERSED').exists()
    projected = previous - payment.amount if active else previous
    fee = FeeStructure.objects.filter(term=payment.term, class_level=payment.student.class_level).first()
    return {
        'payment_id': payment.pk,
        'receipt_number': payment.receipt_number,
        'current_net_collected': previous,
        'projected_net_collected': projected,
        'current_outstanding': (fee.amount - previous) if fee else None,
        'projected_outstanding': (fee.amount - projected) if fee else None,
        'original_payment_preserved': True,
        'execution_enabled': False,
    }
