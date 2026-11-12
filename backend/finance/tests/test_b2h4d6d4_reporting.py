"""D6D4 read-only report and safe CSV regression checks."""
from datetime import date
from decimal import Decimal
from io import StringIO
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from finance.models import School, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal
from finance.finance_reporting_export import recorded_payment_report

class RecordedReportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='d6d4-bursar')
        self.school = School.objects.create(name='D6D4 School')
        self.level = ClassLevel.objects.create(school=self.school,name='D6D4 Class')
        self.term = Term.objects.create(school=self.school,name='D6D4 Term',
            start_date=date(2026,1,1),end_date=date(2026,4,1))
        self.student = Student.objects.create(school=self.school,class_level=self.level,
            first_name='Test',last_name='Student',student_id='D6D4-001',
            parent_name='Guardian',parent_phone='0700000000')
        self.payment = Payment.objects.create(student=self.student,term=self.term,
            amount=Decimal('100.00'),payment_method='CASH',
            receipt_number='D6D4-ONE',recorded_by=self.user)

    def report(self):
        return recorded_payment_report(school_id=self.school.pk,term_id=self.term.pk)

    def test_active_payment_read_only(self):
        original = Payment.objects.count()
        result = self.report()
        self.assertEqual(result['net_recorded'],'100.00')
        self.assertEqual(result['gross_recorded'],'100.00')
        self.assertEqual(result['rows'][0]['status'],'ACTIVE')
        self.assertEqual(Payment.objects.count(),original)

    def test_executed_reversal_nets_zero_without_deleting_receipt(self):
        PaymentReversal.objects.create(payment=self.payment,reason='Correction',
            description='Example',status='REVERSED',requested_by=self.user,
            approved_by=self.user,original_amount=self.payment.amount,
            original_receipt=self.payment.receipt_number,reversed_at=timezone.now())
        result=self.report()
        self.assertEqual(result['reversed_recorded'],'100.00')
        self.assertEqual(result['net_recorded'],'0.00')
        self.assertEqual(result['rows'][0]['receipt_number'],'D6D4-ONE')
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())

    def test_foreign_term_denied(self):
        foreign = School.objects.create(name='D6D4 Foreign')
        term = Term.objects.create(school=foreign,name='Foreign Term',
            start_date=date(2026,1,1),end_date=date(2026,4,1))
        with self.assertRaises(ValueError):
            recorded_payment_report(school_id=self.school.pk,term_id=term.pk)

    def test_audit_issue_blocks_export(self):
        self.payment.amount=Decimal('-3.00')
        self.payment.save(update_fields=['amount'])
        with self.assertRaisesRegex(ValueError,'audit found issues'):
            self.report()

    def test_csv_escapes_formula_and_emits_columns(self):
        self.payment.receipt_number='=2+2'
        self.payment.save(update_fields=['receipt_number'])
        output=StringIO()
        call_command('report_recorded_payments',school_id=self.school.pk,
            term_id=self.term.pk,format='csv',stdout=output)
        content=output.getvalue()
        self.assertIn('payment_id,student_id,term_id,receipt_number',content)
        self.assertIn("'=2+2",content)
        self.assertNotIn(',=2+2,',content)
