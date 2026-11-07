from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from finance.models import School, UserRole, Term, ClassLevel, Student, FeeStructure, Payment


class DashboardSchoolScopeTests(APITestCase):
    def setUp(self):
        self.a = School.objects.create(name='School A')
        self.b = School.objects.create(name='School B')
        self.user = User.objects.create_user(username='bursar_a', password='development-only-test')
        UserRole.objects.create(user=self.user, school=self.a, role='BURSAR')
        self.term_a = Term.objects.create(school=self.a, name='Term 1', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.term_b = Term.objects.create(school=self.b, name='Term 1', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        level_a = ClassLevel.objects.create(school=self.a, name='S1')
        level_b = ClassLevel.objects.create(school=self.b, name='S1')
        FeeStructure.objects.create(term=self.term_a, class_level=level_a, amount=Decimal('100000.00'))
        FeeStructure.objects.create(term=self.term_b, class_level=level_b, amount=Decimal('900000.00'))
        Student.objects.create(school=self.a, class_level=level_a, first_name='A', last_name='Student', student_id='H3-A', parent_name='Parent', parent_phone='000')
        Student.objects.create(school=self.b, class_level=level_b, first_name='B', last_name='Student', student_id='H3-B', parent_name='Parent', parent_phone='000')
        self.client.force_authenticate(user=self.user)

    def test_school_dashboard_is_scoped_without_client_school_id(self):
        result = self.client.get('/api/v1/dashboard/', {'term_id': self.term_a.id})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data['total_students'], 1)
        self.assertEqual(Decimal(str(result.data['total_expected'])), Decimal('100000.00'))
        self.assertEqual(result.data['students_paid'], 0)
        self.assertEqual(result.data['students_unpaid'], 1)

    def test_other_school_term_is_rejected(self):
        result = self.client.get('/api/v1/dashboard/', {'term_id': self.term_b.id})
        self.assertEqual(result.status_code, 404)

    def test_client_school_id_cannot_change_scope(self):
        result = self.client.get('/api/v1/dashboard/', {'term_id': self.term_a.id, 'school_id': self.b.id})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data['total_students'], 1)

    def test_unassigned_user_is_denied(self):
        user = User.objects.create_user(username='outsider', password='development-only-test')
        self.client.force_authenticate(user=user)
        result = self.client.get('/api/v1/dashboard/', {'term_id': self.term_a.id})
        self.assertEqual(result.status_code, 403)
