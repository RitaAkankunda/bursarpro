from decimal import Decimal
from datetime import date
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import PermissionDenied, ValidationError
from finance.models import School, UserRole, ClassLevel, Term, FeeStructure, Student, Payment
from finance.serializers import PaymentSerializer


class PaymentCreationGuardTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='b2h4f-bursar', password='local-test-only')
        self.school = School.objects.create(name='Test school F1', created_by=self.user)
        UserRole.objects.create(user=self.user, school=self.school, role='BURSAR')
        self.level = ClassLevel.objects.create(school=self.school, name='Senior 1')
        self.term = Term.objects.create(school=self.school, name='Term Test', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level, first_name='Test', last_name='Learner', student_id='F1-STU-001', parent_name='Test Parent', parent_phone='0700000000')
        FeeStructure.objects.create(term=self.term, class_level=self.level, amount=Decimal('1900000.00'))
        self.req = APIRequestFactory().post('/api/v1/payments/', {})
        force_authenticate(self.req, user=self.user)
        self.req.user = self.user

    def serialize(self, amount='500000.00', student=None, term=None):
        data = {'student': (student or self.student).pk, 'term': (term or self.term).pk,
                'amount': amount, 'payment_date': '2026-11-07', 'payment_method': 'CASH',
                'receipt_number': 'F1-TEST-RECEIPT'}
        return PaymentSerializer(data=data, context={'request': self.req})

    def test_valid_school_payment_passes_validation(self):
        self.assertTrue(self.serialize().is_valid(), 'valid same-school payment should pass')

    def test_cross_school_student_denied(self):
        other = School.objects.create(name='Other school')
        cls = ClassLevel.objects.create(school=other, name='S1')
        student = Student.objects.create(school=other, class_level=cls, first_name='Other', last_name='Kid', student_id='F1-STU-002', parent_name='Parent', parent_phone='0700000001')
        with self.assertRaises(PermissionDenied):
            self.serialize(student=student).is_valid(raise_exception=True)

    def test_cross_school_term_denied(self):
        other = School.objects.create(name='Other school')
        term = Term.objects.create(school=other, name='Other term', start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        with self.assertRaises(PermissionDenied):
            self.serialize(term=term).is_valid(raise_exception=True)

    def test_zero_and_excess_amount_denied(self):
        for amount in ('0', '-1', '1900000.01'):
            with self.subTest(amount=amount):
                self.assertFalse(self.serialize(amount=amount).is_valid())
