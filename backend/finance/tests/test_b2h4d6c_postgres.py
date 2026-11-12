"""Real PostgreSQL concurrency checks for staged reversal operations.

These tests are NOT evidence of production readiness on SQLite. They use
TransactionTestCase and separate thread-local DB connections.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal
from threading import Barrier
from django.contrib.auth.models import User
from django.db import connections, close_old_connections
from django.test import TransactionTestCase, override_settings
from finance.models import School, UserRole, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal, AuditLog
from finance.reversal_approval_service import request_reversal, approve_reversal, execute_reversal


def _race_worker(barrier, action):
    close_old_connections()
    try:
        barrier.wait(timeout=12)
        try:
            return ('ok', action())
        except Exception as error:
            return ('error', type(error).__name__, str(error))
    finally:
        connections.close_all()


class PostgresReversalConcurrencyTests(TransactionTestCase):
    """TransactionTestCase is required; TestCase obscures concurrent commits."""
    databases = {'default'}

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if connections['default'].vendor != 'postgresql':
            from unittest import SkipTest
            raise SkipTest('Requires actual PostgreSQL; SQLite cannot prove row-lock behavior.')

    def setUp(self):
        self.users = [User.objects.create_user(username=f'd6c_worker_{n}') for n in range(3)]
        self.school = School.objects.create(name='D6C PostgreSQL fixture', created_by=self.users[0])
        for u in self.users:
            UserRole.objects.create(user=u, school=self.school, role='BURSAR')
        self.level = ClassLevel.objects.create(name='S1', school=self.school)
        self.term = Term.objects.create(name='T1', school=self.school,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level,
            first_name='Concurrent', last_name='Student', student_id='D6C-1',
            parent_name='Guardian', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=self.student, term=self.term,
            amount=Decimal('100.00'), payment_method='BANK_TRANSFER',
            receipt_number='D6C-REC', recorded_by=self.users[0])

    def _race(self, action):
        barrier = Barrier(2)
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(_race_worker, barrier, action) for _ in range(2)]
            return [f.result(timeout=35) for f in futures]

    def test_two_simultaneous_requests_create_one_reversal(self):
        results = self._race(lambda: request_reversal(
            self.users[0], self.payment.pk, 'Correction evidenced by written bank note'))
        self.assertEqual(sum(r[0] == 'ok' for r in results), 1, results)
        self.assertEqual(sum(r[0] == 'error' for r in results), 1, results)
        self.assertEqual(PaymentReversal.objects.filter(payment=self.payment).count(), 1)
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL').count(), 1)
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_two_simultaneous_executions_complete_once(self):
        reversal = request_reversal(self.users[0], self.payment.pk,
            'Correction evidenced by written bank note')
        approve_reversal(self.users[1], reversal.pk)
        results = self._race(lambda: execute_reversal(self.users[2], reversal.pk))
        self.assertEqual(sum(r[0] == 'ok' for r in results), 1, results)
        self.assertEqual(sum(r[0] == 'error' for r in results), 1, results)
        reversal.refresh_from_db()
        self.assertEqual(reversal.status, 'REVERSED')
        self.assertEqual(AuditLog.objects.filter(
            entity_type='REVERSAL', entity_id=reversal.pk, action='COMPLETE').count(), 1)
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())
