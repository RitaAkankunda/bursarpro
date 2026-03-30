"""
Bulk Payment Upload Service
Handles Excel file parsing, validation, and batch payment creation
"""
import openpyxl
from decimal import Decimal
from django.db import transaction
from .models import Student, Term, Payment
from .utils import send_payment_sms
import re


class BulkPaymentError(Exception):
    """Custom exception for bulk payment operations"""
    pass


class ExcelPayloadValidator:
    """Validates Excel file format and data"""
    
    REQUIRED_COLUMNS = ['Student ID', 'Amount', 'Receipt Number', 'Payment Method']
    VALID_PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY']
    
    @staticmethod
    def validate_headers(headers):
        """Validate that Excel has required columns"""
        headers_lower = [h.lower() if h else '' for h in headers]
        required_lower = [col.lower() for col in ExcelPayloadValidator.REQUIRED_COLUMNS]
        
        for req_col in required_lower:
            if req_col not in headers_lower:
                raise BulkPaymentError(f"Missing required column: {req_col}")
        
        return {h.lower(): i for i, h in enumerate(headers) if h}
    
    @staticmethod
    def validate_row(row, row_num, column_map, term_id=None):
        """Validate a single row of payment data"""
        errors = []
        
        # Get values by column name
        student_id = row[column_map.get('student id', 0)]
        amount = row[column_map.get('amount', 1)]
        receipt_num = row[column_map.get('receipt number', 2)]
        payment_method = row[column_map.get('payment method', 3)]
        
        # Validate Student ID
        if not student_id or str(student_id).strip() == '':
            errors.append(f"Row {row_num}: Student ID is empty")
        
        # Validate Amount
        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                errors.append(f"Row {row_num}: Amount must be greater than 0")
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: Invalid amount format: {amount}")
        
        # Validate Receipt Number
        if not receipt_num or str(receipt_num).strip() == '':
            errors.append(f"Row {row_num}: Receipt number is empty")
        
        # Validate Payment Method
        if payment_method and str(payment_method).strip().upper() not in ExcelPayloadValidator.VALID_PAYMENT_METHODS:
            errors.append(f"Row {row_num}: Invalid payment method: {payment_method}")
        
        return errors


class BulkPaymentProcessor:
    """Processes bulk payment uploads"""
    
    def __init__(self, excel_file, term_id, user):
        """
        Initialize processor
        
        Args:
            excel_file: Uploaded Excel file object
            term_id: ID of the term for payments
            user: User performing the upload (bursar)
        """
        self.excel_file = excel_file
        self.term_id = term_id
        self.user = user
        self.results = {
            'total_rows': 0,
            'successful_payments': 0,
            'failed_payments': 0,
            'validation_errors': [],
            'created_payments': [],
            'total_amount': Decimal('0.00')
        }
    
    def process(self):
        """Main processing method"""
        try:
            # Load workbook
            workbook = openpyxl.load_workbook(self.excel_file)
            worksheet = workbook.active
            
            # Get headers
            headers = []
            for cell in worksheet[1]:
                headers.append(cell.value)
            
            # Validate headers
            try:
                column_map = ExcelPayloadValidator.validate_headers(headers)
            except BulkPaymentError as e:
                self.results['validation_errors'].append(str(e))
                return self.results
            
            # Get term
            try:
                term = Term.objects.get(id=self.term_id)
            except Term.DoesNotExist:
                self.results['validation_errors'].append(f"Term with ID {self.term_id} not found")
                return self.results
            
            # Process rows
            row_num = 2  # Start from row 2 (skip header)
            for row in worksheet.iter_rows(min_row=2, values_only=True):
                if not any(row):  # Skip empty rows
                    continue
                
                self.results['total_rows'] += 1
                
                # Validate row
                row_errors = ExcelPayloadValidator.validate_row(row, row_num, column_map, term_id=self.term_id)
                
                if row_errors:
                    self.results['validation_errors'].extend(row_errors)
                    self.results['failed_payments'] += 1
                    row_num += 1
                    continue
                
                # Extract data
                student_id_val = str(row[column_map['student id']]).strip()
                amount_val = Decimal(str(row[column_map['amount']]))
                receipt_num = str(row[column_map['receipt number']]).strip()
                payment_method = str(row[column_map['payment method']]).strip().upper() if row[column_map.get('payment method')] else 'CASH'
                
                # Create payment
                try:
                    payment = self._create_payment(
                        student_id_val, 
                        amount_val, 
                        receipt_num, 
                        payment_method, 
                        term
                    )
                    
                    self.results['created_payments'].append({
                        'student_id': student_id_val,
                        'amount': str(amount_val),
                        'receipt': receipt_num,
                        'payment_id': payment.id
                    })
                    self.results['successful_payments'] += 1
                    self.results['total_amount'] += amount_val
                    
                except Exception as e:
                    error_msg = f"Row {row_num}: Failed to create payment - {str(e)}"
                    self.results['validation_errors'].append(error_msg)
                    self.results['failed_payments'] += 1
                
                row_num += 1
            
            return self.results
            
        except Exception as e:
            self.results['validation_errors'].append(f"File processing error: {str(e)}")
            return self.results
    
    @transaction.atomic
    def _create_payment(self, student_id, amount, receipt_num, payment_method, term):
        """Create a payment record"""
        # Find student - use term's school
        try:
            student = Student.objects.get(student_id=student_id, school=term.school)
        except Student.DoesNotExist:
            raise BulkPaymentError(f"Student '{student_id}' not found in {term.school.name}")
        except:
            raise BulkPaymentError(f"Error finding student '{student_id}'")
        
        # Check if receipt number already exists
        if Payment.objects.filter(receipt_number=receipt_num).exists():
            raise BulkPaymentError(f"Receipt '{receipt_num}' already exists")
        
        # Create payment
        payment = Payment.objects.create(
            student=student,
            term=term,
            amount=amount,
            receipt_number=receipt_num,
            payment_method=payment_method,
            recorded_by=self.user
        )
        
        # Send SMS notification
        try:
            send_payment_sms(payment)
        except Exception as e:
            # Log but don't fail payment creation if SMS fails
            print(f"Warning: Failed to send SMS for payment {payment.id}: {str(e)}")
        
        return payment
