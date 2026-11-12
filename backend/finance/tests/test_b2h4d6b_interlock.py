from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from finance.models import (School, UserRole, ClassLevel, Student, Term, Payment,
                            BankStatement, PaymentReconciliation)
from finance.refund_models import PaymentReversal, AuditLog
from finance.reversal_approval_service import request_reversal, approve_reversal, execute_reversal


class ReconciliationInterlockTests(TestCase):
    def setUp(self):
        self.users = [User.objects.create_user(username=f'd6b_{i}') for i in range(3)]
        self.school = School.objects.create(name='D6B Example', created_by=self.users[0])
        for u in self.users:
            UserRole.objects.create(user=u, school=self.school, role='BURSAR')
        self.level = ClassLevel.objects.create(name='S1', school=self.school)
        self.term = Term.objects.create(name='T1', school=self.school,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level,
            first_name='Test', last_name='Student', student_id='D6B-1',
            parent_name='Guardian', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=self.student, term=self.term,
            amount=Decimal('100.00'), payment_method='BANK_TRANSFER',
            receipt_number='D6B-REC', recorded_by=self.users[0])
        self.statement = BankStatement.objects.create(school=self.school,
            term=self.term, statement_date=date(2026, 2, 1),
            file_name='example.xlsx', file_path='bank_statements/example.xlsx',
            total_amount=Decimal('100.00'), transaction_count=1, uploaded_by=self.users[0])

    def link(self, status='UNMATCHED'):
        return PaymentReconciliation.objects.create(
            bank_statement=self.statement, bank_transaction_id='D6B-BANK-1',
            bank_amount=Decimal('100.00'), bank_date=date(2026, 2, 1),
            payment=self.payment, status=status)

    def approved(self):
        r = request_reversal(self.users[0], self.payment.pk, 'Documented correction required')
        approve_reversal(self.users[1], r.pk)
        return r

    def test_request_blocked_when_bank_row_linked_even_if_unmatched(self):
        self.link()
        with self.assertRaisesRegex(ValueError, 'bank reconciliation'):
            request_reversal(self.users[0], self.payment.pk, 'Documented correction required')
        self.assertFalse(PaymentReversal.objects.exists())

    def test_approval_blocked_if_bank_row_linked_after_request(self):
        r = request_reversal(self.users[0], self.payment.pk, 'Documented correction required')
        self.link()
        with self.assertRaisesRegex(ValueError, 'bank reconciliation'):
            approve_reversal(self.users[1], r.pk)
        r.refresh_from_db()
        self.assertEqual(r.status, 'PENDING')
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL', entity_id=r.pk).count(), 1)

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_execution_blocked_if_bank_row_linked_after_approval(self):
        r = self.approved()
        self.link()
        with self.assertRaisesRegex(ValueError, 'reconciliation'):
            execute_reversal(self.users[2], r.pk)
        r.refresh_from_db()
        self.assertEqual(r.status, 'APPROVED')
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL', entity_id=r.pk).count(), 2)

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_execution_denied_if_payment_term_moves_to_another_school(self):
        r = self.approved()
        other = School.objects.create(name='D6B Other', created_by=self.users[0])
        term = Term.objects.create(name='Other term', school=other,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.payment.term = term
        self.payment.save(update_fields=['term'])
        with self.assertRaisesRegex(ValueError, 'school or term'):
            execute_reversal(self.users[2], r.pk)
        r.refresh_from_db()
        self.assertEqual(r.status, 'APPROVED')

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_unlinked_approved_payment_still_executes_with_explicit_opt_in(self):
        r = self.approved()
        execute_reversal(self.users[2], r.pk)
        r.refresh_from_db()
        self.assertEqual(r.status, 'REVERSED')
