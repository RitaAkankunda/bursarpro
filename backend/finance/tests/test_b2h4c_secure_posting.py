"""Tests for B2-H4-C single-payment transaction boundary."""
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from finance.models import School, ClassLevel, Student, Term, FeeStructure, Payment, UserRole
from finance.payment_posting_service import post_bursar_payment
from finance.views import PaymentViewSet


class SecurePostingTests(TestCase):
    def setUp(self):
        self.bursar = User.objects.create_user(username='posting-bursar', password='local-test')
        self.school = School.objects.create(name='Posting school', created_by=self.bursar)
        UserRole.objects.create(user=self.bursar, school=self.school, role='BURSAR')
        self.level = ClassLevel.objects.create(school=self.school, name='S1')
        self.term = Term.objects.create(school=self.school, name='T1', start_date=date(2026,1,1), end_date=date(2026,4,1))
        self.student = Student.objects.create(school=self.school, class_level=self.level, first_name='A', last_name='B', student_id='B2H4C-001', parent_name='Guardian', parent_phone='0700000000')
        self.fee = FeeStructure.objects.create(term=self.term, class_level=self.level, amount=Decimal('100.00'))

    def post(self, **overrides):
        opts=dict(user=self.bursar, student_id=self.student.pk, term_id=self.term.pk, amount='40.00', payment_method='CASH')
        opts.update(overrides)
        return post_bursar_payment(**opts)

    def test_posts_and_generates_unique_receipts(self):
        a=self.post()
        b=self.post(amount='60.00')
        self.assertNotEqual(a.receipt_number,b.receipt_number)
        self.assertEqual(a.recorded_by_id,self.bursar.pk)
        self.assertEqual(Payment.objects.count(),2)

    def test_rejects_overpayment_without_partial_record(self):
        self.post(amount='90.00')
        with self.assertRaises(ValidationError):self.post(amount='11.00')
        self.assertEqual(Payment.objects.count(),1)

    def test_invalid_amounts_and_methods(self):
        for raw in ('0','-1','nan','1.001','inf','9999999999'):
            with self.subTest(raw=raw), self.assertRaises(ValidationError): self.post(amount=raw)
        with self.assertRaises(ValidationError):self.post(payment_method='UNKNOWN')
        self.assertFalse(Payment.objects.exists())

    def test_other_school_student_and_term_denied(self):
        outsider=School.objects.create(name='Other')
        level=ClassLevel.objects.create(school=outsider,name='Other S1')
        child=Student.objects.create(school=outsider,class_level=level,first_name='X',last_name='Y',student_id='B2H4C-002',parent_name='P',parent_phone='0700000001')
        term=Term.objects.create(school=outsider,name='T2',start_date=date(2026,1,1),end_date=date(2026,4,1))
        with self.assertRaises(PermissionDenied): self.post(student_id=child.pk)
        with self.assertRaises(PermissionDenied): self.post(term_id=term.pk)

    def test_non_bursar_denied(self):
        other=User.objects.create_user(username='posting-no-role',password='local-test')
        with self.assertRaises(PermissionDenied):self.post(user=other)

    def test_duplicate_fee_structures_fail_closed(self):
        FeeStructure.objects.create(term=self.term,class_level=self.level,amount=Decimal('100.00'))
        with self.assertRaises(ValidationError):self.post()

    def test_api_ignores_client_receipt_and_recorder(self):
        api=APIRequestFactory()
        req=api.post('/api/v1/payments/',{
            'student':self.student.pk,'term':self.term.pk,'amount':'40.00',
            'payment_method':'CASH','receipt_number':'FORGED-RECEIPT',
            'recorded_by':999999,
        },format='json')
        force_authenticate(req,user=self.bursar)
        with patch('finance.views.SMSService.send_payment_confirmation'):
            result=PaymentViewSet.as_view({'post':'create'})(req)
        self.assertEqual(result.status_code,201, result.data)
        payment=Payment.objects.get()
        self.assertNotEqual(payment.receipt_number,'FORGED-RECEIPT')
        self.assertEqual(payment.recorded_by_id,self.bursar.pk)
        self.assertEqual(result.data['receipt_number'],payment.receipt_number)

    def test_api_cannot_mutate_payment(self):
        payment=self.post()
        req=APIRequestFactory().delete(f'/api/v1/payments/{payment.pk}/')
        force_authenticate(req,user=self.bursar)
        response=PaymentViewSet.as_view({'delete':'destroy'})(req,pk=payment.pk)
        self.assertEqual(response.status_code,405)
        self.assertTrue(Payment.objects.filter(pk=payment.pk).exists())
