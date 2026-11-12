"""D6D2: prevent a bank reconciliation from racing a reversal workflow."""
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from finance.models import (School, UserRole, ClassLevel, Student, Term,
                            Payment, BankStatement, PaymentReconciliation)
from finance.refund_models import PaymentReversal
from finance.reversal_approval_service import request_reversal, approve_reversal
from finance.reconciliation_matching_service import match_existing_payment


class ReconciliationReversalLockTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name='D6D2 School')
        self.bursar = User.objects.create_user(username='d6d2-bursar')
        self.approver = User.objects.create_user(username='d6d2-approver')
        UserRole.objects.create(user=self.bursar, school=self.school, role='BURSAR')
        UserRole.objects.create(user=self.approver, school=self.school, role='BURSAR')
        self.term = Term.objects.create(school=self.school, name='Term One',
                                        start_date=date(2026,1,1), end_date=date(2026,4,1))
        cls = ClassLevel.objects.create(school=self.school, name='Senior 1')
        student = Student.objects.create(school=self.school, class_level=cls,
            first_name='Test', last_name='Student', student_id='D6D2-1',
            parent_name='Guardian', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=student, term=self.term,
            amount=Decimal('100.00'), payment_method='BANK_TRANSFER',
            receipt_number='D6D2-REC', recorded_by=self.bursar)
        statement = BankStatement.objects.create(school=self.school, term=self.term,
            statement_date=date(2026,2,1), file_name='sample.xlsx',
            file_path='bank_statements/test_d6d2.xlsx',
            total_amount=Decimal('100.00'), transaction_count=1,
            uploaded_by=self.bursar)
        self.row = PaymentReconciliation.objects.create(bank_statement=statement,
            bank_transaction_id='D6D2-BANK', bank_amount=Decimal('100.00'),
            bank_date=date(2026,2,1))

    def match(self):
        return match_existing_payment(user=self.bursar,
            reconciliation_id=self.row.pk, payment_id=self.payment.pk)

    def test_pending_reversal_prevents_bank_match(self):
        reversal = request_reversal(self.bursar, self.payment.pk,
                                    'Documented bank receipt correction')
        with self.assertRaises(ValidationError):
            self.match()
        self.row.refresh_from_db()
        reversal.refresh_from_db()
        self.assertIsNone(self.row.payment_id)
        self.assertEqual(reversal.status, 'PENDING')

    def test_approved_reversal_prevents_bank_match(self):
        reversal = request_reversal(self.bursar, self.payment.pk,
                                    'Documented bank receipt correction')
        approve_reversal(self.approver, reversal.pk)
        with self.assertRaises(ValidationError):
            self.match()
        self.row.refresh_from_db()
        self.assertIsNone(self.row.payment_id)
        self.assertEqual(PaymentReversal.objects.get(pk=reversal.pk).status, 'APPROVED')

    def test_normal_bank_match_and_idempotent_replay(self):
        first = self.match()
        previous_time = first.matched_at
        second = self.match()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(second.matched_at, previous_time)
        self.row.refresh_from_db()
        self.assertEqual(self.row.payment_id, self.payment.pk)
        self.assertEqual(self.row.status, 'MANUAL_MATCHED')

    def test_foreign_school_payment_term_is_rejected(self):
        foreign = School.objects.create(name='D6D2 Other')
        new_term = Term.objects.create(school=foreign, name='Foreign',
            start_date=date(2026,1,1), end_date=date(2026,4,1))
        self.payment.term = new_term
        self.payment.save(update_fields=['term'])
        with self.assertRaises(ValidationError):
            self.match()
        self.row.refresh_from_db()
        self.assertIsNone(self.row.payment_id)
