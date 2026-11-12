from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from finance.models import School, UserRole, ClassLevel, Student, Term, Payment
from finance.refund_models import PaymentReversal, AuditLog
from finance.reversal_approval_service import request_reversal, approve_reversal, execute_reversal
from finance.reversal_ledger import net_paid_total


class GuardedReversalExecutionTests(TestCase):
    def setUp(self):
        self.people = [User.objects.create_user(username=f'd6a_{i}') for i in range(4)]
        self.school = School.objects.create(name='D6A School', created_by=self.people[0])
        self.foreign = School.objects.create(name='D6A Foreign', created_by=self.people[3])
        for user in self.people[:3]:
            UserRole.objects.create(user=user, school=self.school, role='BURSAR')
        UserRole.objects.create(user=self.people[3], school=self.foreign, role='BURSAR')
        cls = ClassLevel.objects.create(name='Senior 1', school=self.school)
        term = Term.objects.create(name='Term 1', school=self.school, start_date=date(2026,1,1), end_date=date(2026,4,1))
        st = Student.objects.create(school=self.school, class_level=cls, first_name='Demo', last_name='User', student_id='D6A-1', parent_name='Example', parent_phone='0700000000')
        self.payment = Payment.objects.create(student=st,term=term, amount=Decimal('100.00'), payment_method='CASH', receipt_number='D6A-REC', recorded_by=self.people[0])
        self.rev = request_reversal(self.people[0], self.payment.pk, 'Recorded against wrong receipt')
        approve_reversal(self.people[1], self.rev.pk)

    def test_off_by_default_and_api_blocked(self):
        with self.assertRaises(ValueError): execute_reversal(self.people[2], self.rev.pk)
        client = APIClient(); client.force_authenticate(self.people[2])
        self.assertEqual(client.post(f'/api/v1/payment-reversals/{self.rev.pk}/execute/').status_code,403)
        self.rev.refresh_from_db(); self.assertEqual(self.rev.status,'APPROVED')

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_preserves_payment_and_updates_net(self):
        before = net_paid_total(Payment.objects.filter(pk=self.payment.pk))
        self.assertEqual(before,Decimal('100.00'))
        execute_reversal(self.people[2], self.rev.pk)
        self.rev.refresh_from_db()
        self.assertEqual(self.rev.status,'REVERSED')
        self.assertTrue(Payment.objects.filter(pk=self.payment.pk).exists())
        self.assertEqual(net_paid_total(Payment.objects.filter(pk=self.payment.pk)),Decimal('0'))
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL',entity_id=self.rev.pk).count(),3)

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_same_requester_or_approver_cannot_execute(self):
        for user in self.people[:2]:
            with self.assertRaises(ValueError): execute_reversal(user,self.rev.pk)
        self.rev.refresh_from_db(); self.assertEqual(self.rev.status,'APPROVED')

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_other_school_cannot_execute(self):
        with self.assertRaises(ValueError): execute_reversal(self.people[3],self.rev.pk)
        self.rev.refresh_from_db(); self.assertEqual(self.rev.status,'APPROVED')

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_double_execution_fails_without_duplicate_audit(self):
        execute_reversal(self.people[2],self.rev.pk)
        with self.assertRaises(ValueError): execute_reversal(self.people[2],self.rev.pk)
        self.assertEqual(AuditLog.objects.filter(entity_type='REVERSAL',entity_id=self.rev.pk,action='COMPLETE').count(),1)

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_snapshot_mutation_blocks_execution(self):
        self.payment.amount = Decimal('99.00'); self.payment.save(update_fields=['amount'])
        with self.assertRaises(ValueError): execute_reversal(self.people[2],self.rev.pk)
        self.rev.refresh_from_db(); self.assertEqual(self.rev.status,'APPROVED')

    @override_settings(BURSARPRO_ENABLE_REVERSAL_EXECUTION=True)
    def test_api_can_execute_when_explicitly_enabled(self):
        client = APIClient(); client.force_authenticate(self.people[2])
        response = client.post(f'/api/v1/payment-reversals/{self.rev.pk}/execute/')
        self.assertEqual(response.status_code,200, str(getattr(response,'data',response.content)))
        self.rev.refresh_from_db(); self.assertEqual(self.rev.status,'REVERSED')
