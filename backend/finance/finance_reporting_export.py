"""B2-H4-D6D4 internal, read-only report of recorded payment history.

Does NOT claim tuition due, bank settlement, or reconciliation completion.
No API endpoint, write operations, or production reversal enablement.
"""
from decimal import Decimal
from django.db.models import Exists, OuterRef
from .models import School, Term, Payment
from .refund_models import PaymentReversal
from .financial_consistency_audit import audit_school_finances

def recorded_payment_report(*, school_id, term_id, max_rows=10000):
    if type(school_id) is not int or school_id < 1:
        raise ValueError('school_id must be a positive integer')
    if type(term_id) is not int or term_id < 1:
        raise ValueError('term_id must be a positive integer')
    if type(max_rows) is not int or not 1 <= max_rows <= 10000:
        raise ValueError('max_rows must be 1..10000')
    if not School.objects.filter(pk=school_id).exists():
        raise ValueError('School not found')
    if not Term.objects.filter(pk=term_id, school_id=school_id).exists():
        raise ValueError('Term not found in school')
    audit = audit_school_finances(school_id=school_id)
    # Fail closed on ANY known inconsistency; don't export potentially misleading finances.
    if audit['issue_count']:
        raise ValueError('Financial consistency audit found issues; export refused. Run audit_financial_consistency for this school.')
    qs = (Payment.objects.filter(student__school_id=school_id, term_id=term_id)
          .annotate(is_reversed=Exists(PaymentReversal.objects.filter(
                payment_id=OuterRef('pk'), status='REVERSED')))
          .order_by('pk').values('pk','student_id','term_id','receipt_number',
                                'amount','payment_method','is_reversed'))
    if qs.count() > max_rows:
        raise ValueError('Maximum report row limit exceeded; narrow the scope')
    rows = []
    gross = Decimal('0.00')
    reversed_amount = Decimal('0.00')
    for record in qs.iterator():
        amount = record['amount']
        reversed_flag = record['is_reversed']
        gross += amount
        if reversed_flag:
            reversed_amount += amount
        rows.append({
            'payment_id': record['pk'], 'student_id': record['student_id'],
            'term_id': record['term_id'],
            'receipt_number': record['receipt_number'],
            'amount': str(amount), 'payment_method': record['payment_method'],
            'status': 'REVERSED' if reversed_flag else 'ACTIVE',
            'net_amount': str(Decimal('0.00') if reversed_flag else amount),
        })
    return {
        'school_id': school_id, 'term_id': term_id,
        'payment_count': len(rows), 'gross_recorded': str(gross),
        'reversed_recorded': str(reversed_amount),
        'net_recorded': str(gross-reversed_amount),
        'rows': rows, 'read_only': True,
        'scope': 'Recorded payments only; not tuition balances or external settlement',
    }
