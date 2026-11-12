from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from django.db import IntegrityError, transaction
from finance.models import School, UserRole, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal, AuditLog
from finance.reversal_approval_service import request_reversal, approve_reversal


class PaymentLockGuardTests(TestCase):
    def setUp(self):
        self.requester = User.objects.create_user(username='d6d_requester')
        self.approver = User.objects.create_user(username='d6d_approver')
        self.school = School.objects.create(name='D6D School', created_by=self.requester)
        for user in (self.requester, self.approver):
            UserRole.objects.create(user=user, school=self.school, role='BURSAR')
        level = ClassLevel.objects.create(name='S1', school=self.school)
        self.term = Term.objects.create(name='Term 1', school=self.school,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        student = Student.objects.create(school=self.school, class_level=level,
            first_name='D6D', last_name='Student', student_id='D6D-S1',
            parent_name='Guardian', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=student, term=self.term,
            amount=Decimal('100.00'), payment_method='CASH',
            receipt_number='D6D-RECEIPT', recorded_by=self.requester)

    def test_request_rejects_payment_with_foreign_term(self):
        foreign = School.objects.create(name='D6D Foreign', created_by=self.requester)
        foreign_term = Term.objects.create(name='Foreign term', school=foreign,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.payment.term = foreign_term
        self.payment.save(update_fields=['term'])
        with self.assertRaisesRegex(ValueError, 'Payment not found'):
            request_reversal(self.requester, self.payment.pk, 'Correct a documented entry')
        self.assertFalse(PaymentReversal.objects.exists())

    def test_approval_rejects_payment_term_changed_after_request(self):
        reversal = request_reversal(self.requester, self.payment.pk, 'Correct a documented entry')
        foreign = School.objects.create(name='D6D Foreign', created_by=self.requester)
        foreign_term = Term.objects.create(name='Foreign term', school=foreign,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.payment.term = foreign_term
        self.payment.save(update_fields=['term'])
        with self.assertRaisesRegex(ValueError, 'school or term'):
            approve_reversal(self.approver, reversal.pk)
        reversal.refresh_from_db()
        self.assertEqual(reversal.status, 'PENDING')
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL', entity_id=reversal.pk).count(), 1)

    def test_normal_request_and_approval_still_succeed(self):
        reversal = request_reversal(self.requester, self.payment.pk, 'Correct a documented entry')
        approve_reversal(self.approver, reversal.pk)
        reversal.refresh_from_db()
        self.assertEqual(reversal.status, 'APPROVED')
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())

    def test_duplicate_bursar_assignment_rejected_by_database(self):
        # UserRole.user is unique in the actual schema; a second role is
        # impossible, so demonstrate the database invariant rather than
        # constructing an invalid actor state for the service.
        foreign = School.objects.create(name='D6D Foreign', created_by=self.requester)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                UserRole.objects.create(user=self.requester, school=foreign, role='BURSAR')
        self.assertEqual(UserRole.objects.filter(user=self.requester).count(), 1)
        self.assertFalse(PaymentReversal.objects.exists())
        reversal = request_reversal(self.requester, self.payment.pk, 'Correct a documented entry')
        self.assertEqual(reversal.status, 'PENDING')
