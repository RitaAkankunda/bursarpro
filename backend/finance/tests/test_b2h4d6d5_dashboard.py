"""Tests for read-only, role-scoped D6D5 dashboard."""
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from finance.models import School, UserRole, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal


class RecordedDashboardTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name='D6D5 Demo School')
        self.other = School.objects.create(name='D6D5 Other School')
        self.term = Term.objects.create(school=self.school, name='Term One',
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.foreign_term = Term.objects.create(school=self.other, name='Term One',
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.cls = ClassLevel.objects.create(school=self.school, name='P1')
        self.student = Student.objects.create(school=self.school, class_level=self.cls,
            first_name='Demo', last_name='Child', student_id='D6D5-S001',
            parent_name='Demo Parent', parent_phone='0700000000')
        self.bursar = User.objects.create_user(username='d6d5-bursar', password='TestOnly-Pass-1234')
        UserRole.objects.create(user=self.bursar, school=self.school, role='BURSAR')
        self.payment = Payment.objects.create(student=self.student, term=self.term,
            amount=Decimal('150.00'), payment_method='CASH',
            receipt_number='D6D5-R001', recorded_by=self.bursar)
        self.url = reverse('recorded-collections-dashboard')
        self.client = APIClient()

    def login(self, user):
        self.client.force_authenticate(user=user)

    def test_authenticated_bursar_gets_scoped_aggregates_only(self):
        self.login(self.bursar)
        response = self.client.get(self.url, {'term_id': self.term.pk, 'school_id': self.other.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['school_id'], self.school.pk)
        self.assertEqual(Decimal(response.data['net_recorded']), Decimal('150.00'))
        self.assertTrue(response.data['read_only'])
        self.assertNotIn('rows', response.data)
        self.assertNotIn('receipt_number', response.data)

    def test_foreign_term_fails_closed(self):
        self.login(self.bursar)
        self.assertEqual(self.client.get(self.url, {'term_id': self.foreign_term.pk}).status_code, 400)

    def test_unauthorized_roles_and_anonymous_denied(self):
        self.assertIn(self.client.get(self.url, {'term_id': self.term.pk}).status_code, (401, 403))
        parent = User.objects.create_user(username='d6d5-parent')
        UserRole.objects.create(user=parent, school=self.school, role='PARENT')
        self.login(parent)
        self.assertEqual(self.client.get(self.url, {'term_id': self.term.pk}).status_code, 403)

    def test_executed_reversals_zero_net_and_do_not_write(self):
        PaymentReversal.objects.create(payment=self.payment, reason='Correction',
            description='Test executed', status='REVERSED', requested_by=self.bursar,
            approved_by=self.bursar, original_amount=self.payment.amount,
            original_receipt=self.payment.receipt_number, reversed_at=timezone.now())
        self.login(self.bursar)
        response = self.client.get(self.url, {'term_id': self.term.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['net_recorded']), Decimal('0.00'))
        self.assertEqual(Payment.objects.count(), 1)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.receipt_number, 'D6D5-R001')

    def test_audit_issue_blocks_dashboard_and_headmaster_allowed(self):
        headmaster = User.objects.create_user(username='d6d5-headmaster')
        UserRole.objects.create(user=headmaster, school=self.school, role='HEADMASTER')
        self.login(headmaster)
        self.assertEqual(self.client.get(self.url, {'term_id': self.term.pk}).status_code, 200)
        PaymentReversal.objects.create(payment=self.payment, reason='Correction',
            description='Mismatched snapshot', status='PENDING', requested_by=self.bursar,
            original_amount=Decimal('1.00'), original_receipt='WRONG')
        self.assertEqual(self.client.get(self.url, {'term_id': self.term.pk}).status_code, 400)
