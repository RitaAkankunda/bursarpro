from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from finance.models import School, UserRole, ClassLevel, Term, Student, FeeStructure, Payment
from finance.refund_models import PaymentReversal
from finance.reversal_ledger import net_paid_total, effective_payments, reversal_preview


class ReversalReadModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='d3-test-bursar', password='local-testing')
        self.school = School.objects.create(name='D3 school', created_by=self.user)
        UserRole.objects.create(user=self.user, role='BURSAR', school=self.school)
        self.level = ClassLevel.objects.create(school=self.school, name='D3 Form')
        self.term = Term.objects.create(school=self.school, name='D3 Term', start_date=date(2026,1,1), end_date=date(2026,4,1))
        self.student = Student.objects.create(school=self.school, class_level=self.level, first_name='D3', last_name='Student', student_id='D3-01', parent_name='Parent', parent_phone='0700000000')
        FeeStructure.objects.create(term=self.term, class_level=self.level, amount=Decimal('1000.00'))
        self.payment = Payment.objects.create(student=self.student, term=self.term, amount=Decimal('400.00'), payment_method='CASH', receipt_number='D3-R01', recorded_by=self.user)

    def add_reversal(self, status):
        return PaymentReversal.objects.create(payment=self.payment, reason='Correction', description='Test', status=status, requested_by=self.user, original_amount=self.payment.amount, original_receipt=self.payment.receipt_number)

    def test_pending_reversal_does_not_change_net(self):
        self.add_reversal('PENDING')
        self.assertEqual(net_paid_total(Payment.objects.filter(student=self.student)), Decimal('400.00'))

    def test_approved_reversal_does_not_change_net(self):
        self.add_reversal('APPROVED')
        self.assertEqual(net_paid_total(Payment.objects.filter(student=self.student)), Decimal('400.00'))

    def test_reversed_payment_is_preserved_and_excluded_from_net(self):
        self.add_reversal('REVERSED')
        self.assertEqual(Payment.objects.filter(pk=self.payment.pk).count(), 1)
        self.assertEqual(net_paid_total(Payment.objects.filter(student=self.student)), Decimal('0.00'))
        self.assertEqual(effective_payments(Payment.objects.all()).count(), 0)

    def test_preview_no_writes(self):
        result = reversal_preview(self.payment)
        self.assertEqual(result['projected_net_collected'], Decimal('0.00'))
        self.assertEqual(result['projected_outstanding'], Decimal('1000.00'))
        self.assertFalse(result['execution_enabled'])
        self.assertEqual(PaymentReversal.objects.count(), 0)

    def test_preview_for_existing_reversal_is_idempotent(self):
        self.add_reversal('REVERSED')
        result = reversal_preview(self.payment)
        self.assertEqual(result['current_net_collected'], Decimal('0.00'))
        self.assertEqual(result['projected_net_collected'], Decimal('0.00'))
