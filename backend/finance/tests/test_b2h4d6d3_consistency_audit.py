"""D6D3 read-only financial consistency regression tests."""
from datetime import date
from decimal import Decimal
from io import StringIO
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from finance.models import (School, UserRole, ClassLevel, Student, Term,
                            Payment, BankStatement, PaymentReconciliation)
from finance.refund_models import PaymentReversal
from finance.financial_consistency_audit import audit_school_finances

class FinancialConsistencyAuditTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='d6d3-audit-bursar')
        self.school = School.objects.create(name='D6D3 Audit School')
        UserRole.objects.create(user=self.user, school=self.school, role='BURSAR')
        self.cls = ClassLevel.objects.create(school=self.school, name='Level One')
        self.term = Term.objects.create(school=self.school, name='Term One',
            start_date=date(2026,1,1), end_date=date(2026,4,1))
        self.student = Student.objects.create(school=self.school, class_level=self.cls,
            first_name='Test', last_name='Student', student_id='D6D3-001',
            parent_name='Parent', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=self.student, term=self.term,
            amount=Decimal('100.00'), payment_method='BANK_TRANSFER',
            receipt_number='D6D3-ONE', recorded_by=self.user)

    def check(self):
        return audit_school_finances(school_id=self.school.pk)

    def test_normal_record_does_not_report_problem_or_write(self):
        before = Payment.objects.count()
        result = self.check()
        self.assertEqual(result['issue_count'], 0)
        self.assertEqual(Decimal(result['net_collections']), Decimal('100'))
        self.assertEqual(Payment.objects.count(), before)
        self.assertTrue(result['read_only'])

    def test_reversal_snapshot_mismatch_is_detected(self):
        PaymentReversal.objects.create(payment=self.payment, reason='Correction',
            description='Testing mismatch', status='PENDING', requested_by=self.user,
            original_amount=Decimal('90.00'), original_receipt='OLD')
        result = self.check()
        self.assertEqual(result['issue_counts']['REVERSAL_SNAPSHOT_MISMATCH'], 1)
        self.assertEqual(Decimal(result['net_collections']), Decimal('100'))

    def test_executed_reversal_excluded_from_net(self):
        PaymentReversal.objects.create(payment=self.payment, reason='Correction',
            description='Executed', status='REVERSED', requested_by=self.user,
            approved_by=self.user, original_amount=self.payment.amount,
            original_receipt=self.payment.receipt_number,
            reversed_at=timezone.now())
        result = self.check()
        self.assertEqual(Decimal(result['raw_collections']), Decimal('100'))
        self.assertEqual(Decimal(result['executed_reversal_amount']), Decimal('100'))
        self.assertEqual(Decimal(result['net_collections']), Decimal('0'))
        self.assertEqual(result['issue_count'], 0)

    def test_reconciliation_conflict_is_detected_without_modification(self):
        PaymentReversal.objects.create(payment=self.payment, reason='Correction',
            description='Pending', status='PENDING', requested_by=self.user,
            original_amount=self.payment.amount,
            original_receipt=self.payment.receipt_number)
        statement = BankStatement.objects.create(school=self.school, term=self.term,
            statement_date=date(2026,2,1), file_name='audit.xlsx',
            file_path='bank_statements/d6d3.xlsx', total_amount=Decimal('100'),
            transaction_count=1, uploaded_by=self.user)
        row = PaymentReconciliation.objects.create(bank_statement=statement,
            bank_transaction_id='D6D3-BANK', bank_amount=Decimal('100'),
            bank_date=date(2026,2,1), payment=self.payment,
            matched_amount=Decimal('100'), status='MANUAL_MATCHED')
        result = self.check()
        self.assertEqual(result['issue_counts']['RECONCILIATION_REVERSAL_CONFLICT'], 1)
        row.refresh_from_db()
        self.assertEqual(row.status, 'MANUAL_MATCHED')

    def test_school_scope_and_cli(self):
        foreign = School.objects.create(name='D6D3 Foreign')
        term = Term.objects.create(school=foreign, name='Foreign',
            start_date=date(2026,1,1), end_date=date(2026,4,1))
        self.payment.term = term
        self.payment.save(update_fields=['term'])
        result = self.check()
        self.assertEqual(result['issue_counts']['PAYMENT_FOREIGN_TERM'], 1)
        output = StringIO()
        call_command('audit_financial_consistency', school_id=self.school.pk, stdout=output)
        self.assertIn('PAYMENT_FOREIGN_TERM', output.getvalue())
        self.assertEqual(result['school_id'], self.school.pk)
