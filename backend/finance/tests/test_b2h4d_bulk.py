"""B2-H4-D1 regression tests — run on Django's isolated test database."""
from datetime import date
from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

import openpyxl
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from finance.models import (BulkImportReceipt, ClassLevel, FeeStructure, Payment,
                            School, Student, Term, UserRole)
from finance.views import BulkPaymentViewSet


def upload_xlsx(rows):
    book = openpyxl.Workbook()
    sheet = book.active
    sheet.append(['Student ID', 'Amount', 'Receipt Number', 'Payment Method'])
    for row in rows:
        sheet.append(list(row))
    buff = BytesIO()
    book.save(buff)
    book.close()
    return SimpleUploadedFile('verified-receipts.xlsx', buff.getvalue(),
                              content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


class ControlledBulkTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='d1-bursar', password='test-password')
        self.school = School.objects.create(name='D1 School', created_by=self.user)
        UserRole.objects.create(user=self.user, role='BURSAR', school=self.school)
        self.level = ClassLevel.objects.create(school=self.school, name='S1')
        self.term = Term.objects.create(school=self.school, name='Term 1',
                                        start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        self.student = Student.objects.create(school=self.school, class_level=self.level,
            first_name='Demo', last_name='Student', student_id='D1-STUDENT-1',
            parent_name='Guardian', parent_phone='0700000000')
        FeeStructure.objects.create(term=self.term, class_level=self.level, amount=Decimal('100.00'))

    def request(self, rows, *, user=None, term=None, confirmed='true'):
        file = upload_xlsx(rows)
        req = self.factory.post('/api/v1/bulk-payments/upload/',
            {'file': file, 'term_id': str((term or self.term).pk),
             'confirmed_received': confirmed}, format='multipart')
        force_authenticate(req, user=user or self.user)
        return BulkPaymentViewSet.as_view({'post': 'upload'})(req)

    def test_import_and_safe_replay(self):
        rows=[('D1-STUDENT-1', '40.00', 'BANK-REF-1', 'BANK_TRANSFER')]
        first=self.request(rows)
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data['successful_payments'], 1)
        payment=Payment.objects.get()
        self.assertTrue(payment.receipt_number.startswith('BP-'))
        self.assertNotEqual(payment.receipt_number, 'BANK-REF-1')
        self.assertEqual(BulkImportReceipt.objects.count(), 1)
        again=self.request(rows)
        self.assertEqual(again.status_code, 200, again.data)
        self.assertEqual(again.data['replayed_payments'], 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_reference_conflict_and_overpayment_do_not_post(self):
        self.request([('D1-STUDENT-1', '90.00', 'REF-2', 'CASH')])
        conflicting=self.request([('D1-STUDENT-1', '5.00', 'REF-2', 'CASH')])
        self.assertEqual(conflicting.data['failed_payments'], 1)
        excessive=self.request([('D1-STUDENT-1', '11.00', 'REF-3', 'CASH')])
        self.assertEqual(excessive.data['failed_payments'], 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_partial_success_and_retry(self):
        rows=[('D1-STUDENT-1', '20.00', 'REF-A', 'CASH'),
              ('UNKNOWN', '20.00', 'REF-B', 'CASH')]
        result=self.request(rows)
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(result.data['successful_payments'], 1)
        self.assertEqual(result.data['failed_payments'], 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_no_confirmation_no_posting(self):
        response=self.request([('D1-STUDENT-1', '10.00', 'REF-Z', 'CASH')], confirmed='false')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Payment.objects.exists())

    def test_other_school_term_cannot_post(self):
        other=School.objects.create(name='Other School')
        term=Term.objects.create(school=other, name='Other Term',
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        response=self.request([('D1-STUDENT-1', '10.00', 'REF-C', 'CASH')], term=term)
        self.assertEqual(response.status_code, 403, response.data)
        self.assertFalse(Payment.objects.exists())

    def test_parent_cannot_post(self):
        parent=User.objects.create_user(username='d1-parent', password='test-password')
        UserRole.objects.create(user=parent, school=self.school, role='PARENT', student=self.student)
        response=self.request([('D1-STUDENT-1', '10.00', 'REF-D', 'CASH')], user=parent)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Payment.objects.exists())

    def test_invalid_amount_and_formula_denied(self):
        invalid=self.request([('D1-STUDENT-1', '-10', 'REF-X', 'CASH')])
        self.assertEqual(invalid.data['failed_payments'], 1)
        self.assertFalse(Payment.objects.exists())
        formula=self.request([('D1-STUDENT-1', '=1+1', 'REF-Y', 'CASH')])
        self.assertEqual(formula.status_code, 400)
        self.assertFalse(Payment.objects.exists())
