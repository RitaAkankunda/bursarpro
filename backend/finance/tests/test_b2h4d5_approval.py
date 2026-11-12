from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from finance.models import School, UserRole, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal, AuditLog
from finance.reversal_approval_service import request_reversal, approve_reversal
from finance.reversal_ledger import net_paid_total

class ReversalApprovalTests(TestCase):
    def setUp(self):
        self.a = User.objects.create_user(username='d5a')
        self.b = User.objects.create_user(username='d5b')
        self.c = User.objects.create_user(username='d5c')
        self.school = School.objects.create(name='D5 school', created_by=self.a)
        self.foreign = School.objects.create(name='D5 foreign', created_by=self.c)
        UserRole.objects.create(user=self.a, school=self.school, role='BURSAR')
        UserRole.objects.create(user=self.b, school=self.school, role='BURSAR')
        UserRole.objects.create(user=self.c, school=self.foreign, role='BURSAR')
        level = ClassLevel.objects.create(school=self.school, name='Form 1')
        term = Term.objects.create(school=self.school, name='Term 1', start_date=date(2026,1,1), end_date=date(2026,4,1))
        student = Student.objects.create(school=self.school, class_level=level, first_name='Test',last_name='Student',student_id='D5-1',parent_name='Guardian',parent_phone='0700000000')
        self.payment = Payment.objects.create(student=student,term=term,amount=Decimal('100.00'),payment_method='CASH',receipt_number='D5-REC',recorded_by=self.a)
    def test_request_and_separate_approval_preserve_accounting(self):
        rev=request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        self.assertEqual(rev.status,'PENDING')
        approved=approve_reversal(self.b,rev.pk)
        self.assertEqual(approved.status,'APPROVED')
        self.assertEqual(net_paid_total(Payment.objects.filter(pk=self.payment.pk)), Decimal('100.00'))
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL',entity_id=rev.pk).count(),2)
    def test_same_user_cannot_approve(self):
        rev=request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        with self.assertRaises(ValueError): approve_reversal(self.a,rev.pk)
        rev.refresh_from_db(); self.assertEqual(rev.status,'PENDING')
    def test_foreign_school_denied(self):
        with self.assertRaises(ValueError): request_reversal(self.c,self.payment.pk,'Documented posting mistake')
        rev=request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        with self.assertRaises(ValueError): approve_reversal(self.c,rev.pk)
    def test_duplicate_and_invalid_reason_denied(self):
        with self.assertRaises(ValueError): request_reversal(self.a,self.payment.pk,'short')
        request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        with self.assertRaises(ValueError): request_reversal(self.a,self.payment.pk,'Another documented posting mistake')
        self.assertEqual(PaymentReversal.objects.count(),1)
    def test_approval_cannot_replay(self):
        rev=request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        approve_reversal(self.b,rev.pk)
        with self.assertRaises(ValueError): approve_reversal(self.b,rev.pk)
    def test_execution_endpoint_still_blocked(self):
        rev=request_reversal(self.a,self.payment.pk,'Documented posting mistake')
        approve_reversal(self.b,rev.pk)
        client=APIClient(); client.force_authenticate(self.b)
        response=client.post('/api/v1/payment-reversals/%s/execute/' % rev.pk)
        self.assertIn(response.status_code,(403,405))
        self.assertEqual(PaymentReversal.objects.get(pk=rev.pk).status,'APPROVED')
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())
