"""Focused regression tests for the B2-H4-B emergency safety gate."""
from datetime import date
from decimal import Decimal
from unittest.mock import Mock

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from finance.models import ClassLevel, Payment, School, Student, Term, UserRole
from finance.views import BulkPaymentViewSet, StudentBalanceViewSet
from finance.phase8_viewsets import PaymentReversalViewSet, RefundViewSet
from finance.refund_models import PaymentReversal, Refund
from finance.refund_service import RefundService


class FinancialSafetyGateTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.bursar = User.objects.create_user(username='gate-bursar', password='test-only')
        self.parent = User.objects.create_user(username='gate-parent', password='test-only')
        self.school = School.objects.create(name='Gate School', created_by=self.bursar)
        self.level = ClassLevel.objects.create(school=self.school, name='Senior 1')
        self.term = Term.objects.create(school=self.school, name='Term 1', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level, student_id='GATE-01', first_name='One', last_name='Student', parent_name='Guardian', parent_phone='0700000000')
        UserRole.objects.create(user=self.bursar, school=self.school, role='BURSAR')
        UserRole.objects.create(user=self.parent, school=self.school, student=self.student, role='PARENT')

    def test_simulated_online_checkout_does_not_post_payment(self):
        request = self.factory.post('/api/v1/student-balance/pay_online/', {'amount': '2000.00'}, format='json')
        force_authenticate(request, user=self.parent)
        response = StudentBalanceViewSet.as_view({'post': 'pay_online'})(request)
        self.assertEqual(response.status_code, 503)
        self.assertFalse(Payment.objects.filter(student=self.student).exists())

    def test_bulk_upload_does_not_post_payment(self):
        request = self.factory.post('/api/v1/bulk-payments/upload/', {'term_id': str(self.term.id)}, format='multipart')
        force_authenticate(request, user=self.bursar)
        response = BulkPaymentViewSet.as_view({'post': 'upload'})(request)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Payment.objects.filter(student=self.student).exists())

    def test_reversal_service_refuses_to_delete_original(self):
        payment = Payment.objects.create(student=self.student, term=self.term, amount=Decimal('1000.00'), receipt_number='GATE-REC-1', recorded_by=self.bursar)
        reversal = PaymentReversal.objects.create(payment=payment, reason='error', description='test', status='APPROVED', original_amount=payment.amount, original_receipt=payment.receipt_number, requested_by=self.bursar)
        with self.assertRaisesMessage(ValueError, 'Legacy reversal execution disabled'):
            RefundService.execute_reversal(reversal, self.bursar)
        self.assertTrue(Payment.objects.filter(pk=payment.pk).exists())
        reversal.refresh_from_db()
        self.assertEqual(reversal.status, 'APPROVED')

    def test_cross_school_reversals_not_visible(self):
        outsider = User.objects.create_user(username='gate-outsider', password='test-only')
        other_school = School.objects.create(name='Other school', created_by=outsider)
        UserRole.objects.create(user=outsider, school=other_school, role='BURSAR')
        payment = Payment.objects.create(student=self.student, term=self.term, amount=Decimal('1000.00'), receipt_number='GATE-REC-2', recorded_by=self.bursar)
        PaymentReversal.objects.create(payment=payment, reason='test', description='test', original_amount=payment.amount, original_receipt=payment.receipt_number, requested_by=self.bursar)
        request = self.factory.get('/api/v1/payment-reversals/')
        force_authenticate(request, user=outsider)
        response = PaymentReversalViewSet.as_view({'get': 'list'})(request)
        self.assertEqual(response.status_code, 200)
        data = response.data
        results = data.get('results', []) if isinstance(data, dict) else data
        self.assertEqual(len(results), 0)
