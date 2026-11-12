from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from finance.models import School, UserRole, ClassLevel, Term, Student, FeeStructure, Payment
from finance.refund_models import PaymentReversal
from finance.views import DashboardViewSet, HeadmasterDashboardViewSet


class NetReportingSafetyTests(TestCase):
    def setUp(self):
        self.bursar = User.objects.create_user(username='d4-bursar', password='test-only')
        self.school = School.objects.create(name='D4 School', created_by=self.bursar)
        UserRole.objects.create(user=self.bursar, role='BURSAR', school=self.school)
        self.level = ClassLevel.objects.create(school=self.school, name='Form 1')
        self.term = Term.objects.create(school=self.school, name='Term 1', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level, student_id='D4-001', first_name='D4', last_name='Student', parent_name='Guardian', parent_phone='0700000000')
        FeeStructure.objects.create(term=self.term, class_level=self.level, amount=Decimal('1000.00'))
        self.reversed = Payment.objects.create(student=self.student, term=self.term, amount=Decimal('400'), receipt_number='D4-REV', payment_method='CASH', recorded_by=self.bursar)
        PaymentReversal.objects.create(payment=self.reversed, reason='Correct mistake', description='Testing', status='REVERSED', requested_by=self.bursar, original_amount=self.reversed.amount, original_receipt=self.reversed.receipt_number)
        self.factory = APIRequestFactory()

    def summary(self, user=None, term=None, query=''):
        request = self.factory.get(f'/api/v1/dashboard/?term_id={term or self.term.pk}{query}')
        force_authenticate(request, user=user or self.bursar)
        return DashboardViewSet.as_view({'get': 'list'})(request)

    def test_executed_reversal_not_counted_in_summary(self):
        response = self.summary()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data['total_collected'])), Decimal('0.00'))
        self.assertEqual(Decimal(str(response.data['total_outstanding'])), Decimal('1000.00'))
        self.assertEqual(response.data['students_paid'], 0)
        self.assertTrue(Payment.objects.filter(pk=self.reversed.pk).exists())

    def test_active_payment_counts_after_reversal(self):
        Payment.objects.create(student=self.student, term=self.term, amount=Decimal('150'), receipt_number='D4-ACT', payment_method='CASH', recorded_by=self.bursar)
        response = self.summary()
        self.assertEqual(Decimal(str(response.data['total_collected'])), Decimal('150.00'))
        self.assertEqual(Decimal(str(response.data['total_outstanding'])), Decimal('850.00'))
        self.assertEqual(response.data['students_paid'], 1)

    def test_cross_school_term_and_client_school_id_cannot_expand_summary(self):
        other = User.objects.create_user(username='d4-other',password='test-only')
        school = School.objects.create(name='Foreign',created_by=other)
        term = Term.objects.create(school=school,name='Other',start_date=date(2026, 1, 1),end_date=date(2026, 4, 1))
        response = self.summary(term=term.pk)
        self.assertEqual(response.status_code, 404)
        response = self.summary(query=f'&school_id={school.pk}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['school_name'], self.school.name)

    def test_headmaster_summary_uses_net(self):
        head = User.objects.create_user(username='d4-head',password='test-only')
        UserRole.objects.create(user=head, role='HEADMASTER', school=self.school)
        request = self.factory.get(f'/api/v1/headmaster/?term_id={self.term.pk}')
        force_authenticate(request,user=head)
        response = HeadmasterDashboardViewSet.as_view({'get': 'list'})(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data['total_collected'])),Decimal('0.00'))
        self.assertEqual(response.data['students_paid'],0)

    def test_alerts_cannot_target_foreign_school(self):
        other = User.objects.create_user(username='d4-foreign',password='test-only')
        foreign = School.objects.create(name='Other School',created_by=other)
        term = Term.objects.create(school=foreign,name='Other Term',start_date=date(2026,1,1),end_date=date(2026,4,1))
        request = self.factory.post('/api/v1/dashboard/send_outstanding_alerts/', data={'term_id':term.pk},format='json')
        force_authenticate(request,user=self.bursar)
        response = DashboardViewSet.as_view({'post':'send_outstanding_alerts'})(request)
        self.assertEqual(response.status_code,404)

    def test_unprivileged_user_cannot_send_financial_alerts(self):
        user = User.objects.create_user(username='d4-teacher',password='test-only')
        UserRole.objects.create(user=user,role='TEACHER',school=self.school)
        request = self.factory.post('/api/v1/dashboard/send_outstanding_alerts/',data={'term_id':self.term.pk},format='json')
        force_authenticate(request,user=user)
        response = DashboardViewSet.as_view({'post':'send_outstanding_alerts'})(request)
        self.assertEqual(response.status_code,403)
