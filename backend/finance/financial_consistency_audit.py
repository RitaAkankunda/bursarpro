"""D6D3: read-only, school-scoped consistency checks for recorded payments.

This is a diagnostic tool, NOT an accounting ledger, settlement check or
permission to enable reversal execution. No models are modified here.
"""
from decimal import Decimal
from django.db.models import Sum
from .models import Payment, PaymentReconciliation, School
from .refund_models import PaymentReversal
from .reversal_ledger import net_paid_total


def audit_school_finances(*, school_id, max_findings=100):
    if not isinstance(school_id, int) or isinstance(school_id, bool) or school_id <= 0:
        raise ValueError('A positive integer school_id is required.')
    if not 1 <= max_findings <= 1000:
        raise ValueError('max_findings must be between 1 and 1000.')
    if not School.objects.filter(pk=school_id).exists():
        raise ValueError('School not found.')
    findings = []
    issue_counts = {}
    def flag(code, entity, pk):
        issue_counts[code] = issue_counts.get(code, 0) + 1
        if len(findings) < max_findings:
            findings.append({'code': code, 'entity': entity, 'id': pk})

    payments = Payment.objects.filter(student__school_id=school_id).select_related('student', 'term')
    payment_count = 0
    for p in payments.iterator():
        payment_count += 1
        if p.term.school_id != school_id:
            flag('PAYMENT_FOREIGN_TERM', 'payment', p.pk)
        if p.amount is None or p.amount <= 0:
            flag('PAYMENT_INVALID_AMOUNT', 'payment', p.pk)

    reversals = (PaymentReversal.objects.filter(payment__student__school_id=school_id)
                 .select_related('payment'))
    reversal_count = 0
    for r in reversals.iterator():
        reversal_count += 1
        if r.original_amount != r.payment.amount or r.original_receipt != r.payment.receipt_number:
            flag('REVERSAL_SNAPSHOT_MISMATCH', 'reversal', r.pk)
        if r.status == 'REVERSED' and not r.reversed_at:
            flag('EXECUTION_TIMESTAMP_MISSING', 'reversal', r.pk)
        if r.status in {'APPROVED', 'REVERSED'} and not r.approved_by_id:
            flag('REVERSAL_APPROVER_MISSING', 'reversal', r.pk)

    rows = (PaymentReconciliation.objects.filter(bank_statement__school_id=school_id)
            .select_related('bank_statement', 'payment__student', 'payment__term'))
    row_count = 0
    for row in rows.iterator():
        row_count += 1
        if row.bank_statement.term.school_id != school_id:
            flag('BANK_STATEMENT_FOREIGN_TERM', 'bank_row', row.pk)
        if row.payment_id:
            p = row.payment
            if p.student.school_id != school_id or p.term.school_id != school_id or p.term_id != row.bank_statement.term_id:
                flag('RECONCILIATION_CROSS_SCOPE', 'bank_row', row.pk)
            if PaymentReversal.objects.filter(payment_id=p.pk).exists():
                flag('RECONCILIATION_REVERSAL_CONFLICT', 'bank_row', row.pk)
            if row.status not in {'MATCHED', 'MANUAL_MATCHED'}:
                flag('RECONCILIATION_LINK_STATUS_MISMATCH', 'bank_row', row.pk)
            if row.matched_amount != p.amount or row.bank_amount != p.amount:
                flag('RECONCILIATION_AMOUNT_MISMATCH', 'bank_row', row.pk)
        elif row.status in {'MATCHED', 'MANUAL_MATCHED'}:
            flag('RECONCILIATION_MISSING_PAYMENT', 'bank_row', row.pk)

    # Cross-check the same reversal-aware accounting rule used by payment posting.
    raw_total = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    net_total = net_paid_total(Payment.objects.filter(student__school_id=school_id))
    executed_total = (PaymentReversal.objects.filter(payment__student__school_id=school_id,
                                                      status='REVERSED')
                      .aggregate(total=Sum('payment__amount'))['total'] or Decimal('0.00'))
    if raw_total - executed_total != net_total:
        flag('NET_COLLECTION_MISMATCH', 'school', school_id)
    return {
        'school_id': school_id,
        'payment_count': payment_count,
        'reversal_count': reversal_count,
        'reconciliation_row_count': row_count,
        'raw_collections': str(raw_total),
        'executed_reversal_amount': str(executed_total),
        'net_collections': str(net_total),
        'issue_count': sum(issue_counts.values()),
        'issue_counts': issue_counts,
        'findings': findings,
        'findings_truncated': sum(issue_counts.values()) > len(findings),
        'read_only': True,
        'scope': 'Recorded finance data only; no external settlement verification',
    }
