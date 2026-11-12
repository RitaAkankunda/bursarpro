"""B2-H4-D1: controlled, idempotent, manually verified bulk receipts.

Only school BURSARs may post. This is not provider settlement verification.
CSV-like spreadsheets containing formulas, untrusted references or negative amounts
are rejected; every posting uses the same locked transaction boundary as normal
bursar payments. Partial success is explicit and safe to retry.
"""
from decimal import Decimal
import hashlib
import io
import json

import openpyxl
from django.db import transaction
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from .models import BulkImportReceipt, Payment, School, Student, Term, UserRole
from .payment_posting_service import post_bursar_payment, _parse_amount


class BulkPaymentError(Exception):
    pass


COLUMNS = ('student id', 'amount', 'receipt number', 'payment method')
MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 1000


def parse_workbook(excel_file):
    if not excel_file or not str(excel_file.name).lower().endswith('.xlsx'):
        raise BulkPaymentError('Only .xlsx files are supported for controlled imports.')
    if excel_file.size > MAX_BYTES:
        raise BulkPaymentError('Upload exceeds 2 MB limit.')
    excel_file.seek(0)
    try:
        book = openpyxl.load_workbook(excel_file, read_only=True, data_only=False)
        try:
            if len(book.sheetnames) != 1:
                raise BulkPaymentError('Workbook must contain exactly one worksheet.')
            sheet = book.active
            if sheet.max_row and sheet.max_row > MAX_ROWS + 1:
                raise BulkPaymentError('Maximum 1000 payment rows per import.')
            iterator = sheet.iter_rows(values_only=False)
            header_cells = next(iterator, None)
            if not header_cells:
                raise BulkPaymentError('Spreadsheet is empty.')
            headers = [str(c.value).strip().lower() if c.value is not None else '' for c in header_cells]
            if len(headers) != len(set(h for h in headers if h)):
                raise BulkPaymentError('Duplicate spreadsheet headers are not allowed.')
            if not all(col in headers for col in COLUMNS):
                raise BulkPaymentError('Required headers: Student ID, Amount, Receipt Number, Payment Method.')
            index = {h: i for i, h in enumerate(headers)}
            rows = []
            for row_num, cells in enumerate(iterator, start=2):
                if not any(c.value is not None for c in cells):
                    continue
                if row_num > MAX_ROWS + 1:
                    raise BulkPaymentError('Maximum 1000 payment rows per import.')
                selected = [cells[index[h]] if index[h] < len(cells) else None for h in COLUMNS]
                if any(c is None or c.data_type == 'f' for c in selected):
                    raise BulkPaymentError(f'Row {row_num}: Formula or missing cell not allowed.')
                vals = [c.value for c in selected]
                rows.append((row_num, *vals))
            if not rows:
                raise BulkPaymentError('Spreadsheet contains no payment rows.')
            return rows
        finally:
            book.close()
    except BulkPaymentError:
        raise
    except Exception as exc:
        raise BulkPaymentError('Could not safely read .xlsx workbook.') from exc


def _normalize(row):
    num, sid, raw_amount, ref, method = row
    sid = str(sid or '').strip()
    ref = str(ref or '').strip().upper()
    method = str(method or '').strip().upper()
    if not sid or len(sid) > 50:
        raise BulkPaymentError('Student ID must be between 1 and 50 characters.')
    if not ref or len(ref) > 100 or not all(ch.isascii() and (ch.isalnum() or ch in '-_/.') for ch in ref):
        raise BulkPaymentError('Receipt reference must use 1–100 letters, numbers, hyphens, slashes, dots or underscores.')
    if method not in {'CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'}:
        raise BulkPaymentError('Unsupported method. Use CASH, MOBILE_MONEY, or BANK_TRANSFER.')
    try:
        amount = _parse_amount(raw_amount)
    except ValidationError as exc:
        raise BulkPaymentError('Amount must be positive with at most 2 decimal places.') from exc
    return sid, amount, ref, method


class BulkPaymentProcessor:
    """Existing integration signature retained; each row posts independently."""

    def __init__(self, excel_file, term_id, user):
        self.excel_file = excel_file
        self.term_id = term_id
        self.user = user

    def process(self):
        role = UserRole.objects.filter(user=self.user, role='BURSAR').first()
        if not role or not role.school_id:
            raise PermissionDenied('Bursar school membership required.')
        school = School.objects.filter(pk=role.school_id).first()
        term = Term.objects.filter(pk=self.term_id, school=school).first()
        if not term:
            raise PermissionDenied('Academic term must belong to your school.')
        rows = parse_workbook(self.excel_file)
        results = dict(total_rows=len(rows), successful_payments=0, replayed_payments=0, failed_payments=0,
                       validation_errors=[], created_payments=[], total_amount='0.00')
        total = Decimal('0.00')
        for row in rows:
            row_num = row[0]
            try:
                sid, amount, ref, method = _normalize(row)
                result = self._post_row(school, term, sid, amount, ref, method)
                if result['replayed']:
                    results['replayed_payments'] += 1
                else:
                    results['successful_payments'] += 1
                    total += amount
                results['created_payments'].append(dict(row=row_num, student_id=sid,
                    receipt=result['receipt'], replayed=result['replayed'], payment_id=result['payment_id']))
            except (BulkPaymentError, ValidationError, PermissionDenied) as exc:
                msg = exc.detail if hasattr(exc, 'detail') else str(exc)
                results['failed_payments'] += 1
                results['validation_errors'].append(f'Row {row_num}: {msg}')
        results['total_amount'] = str(total)
        return results

    @transaction.atomic
    def _post_row(self, school, term, sid, amount, ref, method):
        # Acquire the exact same serialization lock as post_bursar_payment.
        School.objects.select_for_update().get(pk=school.pk)
        student = Student.objects.filter(student_id=sid, school=school).first()
        if not student:
            raise BulkPaymentError('Student not found in your school.')
        payload = json.dumps([student.pk, term.pk, str(amount), method], separators=(',', ':'))
        digest = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        record = BulkImportReceipt.objects.select_related('payment').filter(school=school, source_reference=ref).first()
        if record:
            if record.payload_digest != digest:
                raise BulkPaymentError('Receipt reference was previously imported with different details.')
            return dict(replayed=True, receipt=record.payment.receipt_number, payment_id=record.payment_id)
        payment = post_bursar_payment(user=self.user, student_id=student.pk, term_id=term.pk,
                                     amount=amount, payment_method=method)
        BulkImportReceipt.objects.create(school=school, source_reference=ref,
            payload_digest=digest, payment=payment, imported_by=self.user)
        return dict(replayed=False, receipt=payment.receipt_number, payment_id=payment.pk)
