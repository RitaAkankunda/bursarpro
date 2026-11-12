"""B2-H4-D2 reconciliation guard tests; use Django's isolated test database."""
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from finance.models import (BankStatement, ClassLevel, Payment, PaymentReconciliation,
                            School, Student, Term, UserRole)
from finance.views import BankStatementViewSet, PaymentReconciliationViewSet, ReconciliationDiscrepancyViewSet


class ReconciliationGuardTests(TestCase):
    def setUp(self):
        self.factory=APIRequestFactory()
        self.school=School.objects.create(name='D2 School')
        self.other=School.objects.create(name='D2 Other School')
        self.user=User.objects.create_user(username='d2-bursar',password='dev-only')
        UserRole.objects.create(user=self.user,school=self.school,role='BURSAR')
        self.outsider=User.objects.create_user(username='d2-other-bursar',password='dev-only')
        UserRole.objects.create(user=self.outsider,school=self.other,role='BURSAR')
        self.parent=User.objects.create_user(username='d2-parent',password='dev-only')
        UserRole.objects.create(user=self.parent,school=self.school,role='PARENT')
        self.term=Term.objects.create(school=self.school,name='Term 1',start_date=date(2026,1,1),end_date=date(2026,4,1))
        self.other_term=Term.objects.create(school=self.other,name='Term 1',start_date=date(2026,1,1),end_date=date(2026,4,1))
        self.level=ClassLevel.objects.create(school=self.school,name='S1')
        other_level=ClassLevel.objects.create(school=self.other,name='S1')
        self.student=Student.objects.create(school=self.school,class_level=self.level,first_name='Demo',last_name='Student',student_id='D2-A',parent_name='Guardian',parent_phone='0700000000')
        other_student=Student.objects.create(school=self.other,class_level=other_level,first_name='Other',last_name='Student',student_id='D2-B',parent_name='Guardian',parent_phone='0700000001')
        self.payment=Payment.objects.create(student=self.student,term=self.term,amount=Decimal('50.00'),payment_method='BANK_TRANSFER',receipt_number='BP-D2-1',recorded_by=self.user)
        self.other_payment=Payment.objects.create(student=other_student,term=self.other_term,amount=Decimal('50.00'),payment_method='BANK_TRANSFER',receipt_number='BP-D2-2',recorded_by=self.outsider)
        self.statement=BankStatement.objects.create(school=self.school,term=self.term,statement_date=date(2026,2,1),file_name='test.xlsx',file_path='bank_statements/test.xlsx',total_amount=Decimal('50.00'),transaction_count=1,uploaded_by=self.user)
        self.other_statement=BankStatement.objects.create(school=self.other,term=self.other_term,statement_date=date(2026,2,1),file_name='other.xlsx',file_path='bank_statements/other.xlsx',total_amount=Decimal('50.00'),transaction_count=1,uploaded_by=self.outsider)
        self.row=PaymentReconciliation.objects.create(bank_statement=self.statement,bank_transaction_id='D2-BANK-1',bank_amount=Decimal('50.00'),bank_date=date(2026,2,1))
        self.other_row=PaymentReconciliation.objects.create(bank_statement=self.other_statement,bank_transaction_id='D2-BANK-2',bank_amount=Decimal('50.00'),bank_date=date(2026,2,1))

    def request(self,user=None,payment=None,row=None,notes='verified against statement'):
        req=self.factory.post('/api/v1/payment-reconciliations/1/match_payment/',{'payment_id': (payment or self.payment).pk,'notes':notes},format='json')
        force_authenticate(req,user=user or self.user)
        return PaymentReconciliationViewSet.as_view({'post':'match_payment'})(req,pk=(row or self.row).pk)

    def test_exact_match_and_safe_replay(self):
        response=self.request()
        self.assertEqual(response.status_code,200,response.data)
        self.row.refresh_from_db()
        self.assertEqual(self.row.payment_id,self.payment.pk)
        self.assertEqual(self.row.matched_amount,Decimal('50.00'))
        self.assertEqual(self.row.amount_difference,Decimal('0.00'))
        previous=self.row.matched_at
        again=self.request()
        self.assertEqual(again.status_code,200,again.data)
        self.row.refresh_from_db()
        self.assertEqual(self.row.matched_at,previous)

    def test_cannot_match_other_school_payment(self):
        response=self.request(payment=self.other_payment)
        self.assertEqual(response.status_code,400,response.data)
        self.row.refresh_from_db()
        self.assertIsNone(self.row.payment_id)

    def test_cannot_match_other_school_bank_row(self):
        response=self.request(row=self.other_row)
        self.assertEqual(response.status_code,404,response.data)

    def test_parent_cannot_match(self):
        response=self.request(user=self.parent)
        self.assertEqual(response.status_code,403,response.data)

    def test_amount_mismatch_and_cash_denied(self):
        self.row.bank_amount=Decimal('49.00')
        self.row.save()
        response=self.request()
        self.assertEqual(response.status_code,400,response.data)
        self.row.bank_amount=Decimal('50.00')
        self.row.save()
        self.payment.payment_method='CASH'
        self.payment.save()
        self.assertEqual(self.request().status_code,400)

    def test_reconciliation_cannot_be_created_or_changed_directly(self):
        req=self.factory.post('/api/v1/payment-reconciliations/',{'bank_statement':self.statement.pk,'bank_transaction_id':'FAKE','bank_amount':'50.00'},format='json')
        force_authenticate(req,user=self.user)
        response=PaymentReconciliationViewSet.as_view({'post':'create'})(req) if hasattr(PaymentReconciliationViewSet,'create') else None
        self.assertIsNone(response)  # no writable create action in viewset
        req=self.factory.patch('/api/v1/payment-reconciliations/1/',{'status':'MATCHED'},format='json')
        force_authenticate(req,user=self.user)
        self.assertFalse(hasattr(PaymentReconciliationViewSet,'partial_update'))
        self.assertFalse(hasattr(ReconciliationDiscrepancyViewSet,'create'))

    def test_bank_process_does_not_fake_completion(self):
        req=self.factory.post('/api/v1/bank-statements/1/process/',{},format='json')
        force_authenticate(req,user=self.user)
        response=BankStatementViewSet.as_view({'post':'process'})(req,pk=self.statement.pk)
        self.assertEqual(response.status_code,503,response.data)
        self.statement.refresh_from_db()
        self.assertEqual(self.statement.status,'PENDING')
