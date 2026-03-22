"""
Reporting and Scheduling Service
"""
import io
import csv
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Payment, School, Term, Student
from .reporting_models import ReportTemplate, ScheduledReport, ReportExecution, ReportCustomization
from .notification_service import EmailService


class ReportingService:
    """Service for generating and scheduling reports"""
    
    REPORT_TYPES = {
        'PAYMENT_SUMMARY': 'payment_summary_report',
        'OUTSTANDING_FEES': 'outstanding_fees_report',
        'PAYMENT_BY_METHOD': 'payment_by_method_report',
        'STUDENT_STATEMENT': 'student_statement_report',
        'CLASS_SUMMARY': 'class_summary_report'
    }
    
    @staticmethod
    def generate_payment_summary_report(school, term, start_date=None, end_date=None):
        """Generate payment summary report"""
        
        if end_date is None:
            end_date = datetime.now().date()
        if start_date is None:
            start_date = term.start_date if term else (end_date - timedelta(days=30))
        
        # Get payment data
        payments = Payment.objects.filter(
            school=school,
            term=term,
            payment_date__range=[start_date, end_date]
        )
        
        # Calculate summary
        summary = {
            'period': f"{start_date} to {end_date}",
            'school': school.name,
            'total_students': Student.objects.filter(school=school, current_term=term).count(),
            'total_payments': payments.count(),
            'total_amount': payments.aggregate(Sum('amount'))['amount__sum'] or 0,
            'average_payment': payments.aggregate(Sum('amount'))['amount__sum'] / max(payments.count(), 1) or 0,
            'payments_by_method': {}
        }
        
        # Breakdown by payment method
        for method in ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MPESA', 'CARD']:
            count = payments.filter(payment_method=method).count()
            amount = payments.filter(payment_method=method).aggregate(Sum('amount'))['amount__sum'] or 0
            summary['payments_by_method'][method] = {'count': count, 'amount': amount}
        
        return summary
    
    @staticmethod
    def generate_outstanding_fees_report(school, term):
        """Generate outstanding fees report"""
        
        # Get all students in term
        students = Student.objects.filter(
            school=school,
            current_term=term
        )
        
        outstanding_list = []
        total_outstanding = 0
        
        for student in students:
            # Calculate fees for student
            fee_structure = student.fee_group.fee_structure if student.fee_group else None
            if not fee_structure:
                continue
            
            # Get amount paid
            amount_paid = Payment.objects.filter(
                student=student,
                term=term,
                payment_status='CONFIRMED'
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            total_fees = fee_structure.total_amount
            outstanding = max(0, total_fees - amount_paid)
            
            if outstanding > 0:
                outstanding_list.append({
                    'student_id': student.student_id,
                    'student_name': f"{student.first_name} {student.last_name}",
                    'class': student.stream.name if student.stream else 'N/A',
                    'total_fees': total_fees,
                    'amount_paid': amount_paid,
                    'outstanding': outstanding,
                    'percentage_paid': (amount_paid / total_fees * 100) if total_fees > 0 else 0
                })
                total_outstanding += outstanding
        
        return {
            'school': school.name,
            'term': term.name,
            'students_with_outstanding': len(outstanding_list),
            'total_outstanding': total_outstanding,
            'outstanding_list': sorted(outstanding_list, key=lambda x: x['outstanding'], reverse=True)
        }
    
    @staticmethod
    def generate_payment_by_method_report(school, term, days=30):
        """Generate payment breakdown by method"""
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        payments = Payment.objects.filter(
            school=school,
            term=term,
            payment_date__range=[start_date, end_date]
        )
        
        report = {
            'period': f"Last {days} days",
            'school': school.name,
            'total_amount': payments.aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_transactions': payments.count(),
            'methods': {}
        }
        
        methods = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MPESA', 'CARD', 'SMS']
        
        for method in methods:
            method_payments = payments.filter(payment_method=method)
            amount = method_payments.aggregate(Sum('amount'))['amount__sum'] or 0
            count = method_payments.count()
            total = report['total_amount']
            
            report['methods'][method] = {
                'count': count,
                'amount': amount,
                'percentage': (amount / total * 100) if total > 0 else 0
            }
        
        return report
    
    @staticmethod
    def export_report_to_csv(report_data):
        """Convert report to CSV format"""
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['BursarPro Report Export'])
        writer.writerow([f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        writer.writerow([])
        
        # Write report data
        if isinstance(report_data, dict):
            for key, value in report_data.items():
                if isinstance(value, (list, dict)):
                    continue
                writer.writerow([str(key).replace('_', ' ').title(), value])
        
        return output.getvalue()
    
    @staticmethod
    def schedule_report(school, report_type, recipients, frequency='WEEKLY', enabled=True):
        """Schedule a report to be generated and sent"""
        
        template = ReportTemplate.objects.create(
            school=school,
            report_type=report_type,
            recipients=','.join(recipients),
            frequency=frequency,
            enabled=enabled
        )
        
        return template
    
    @staticmethod
    def process_scheduled_reports():
        """Process all scheduled reports that are due"""
        
        today = datetime.now().date()
        processed = 0
        
        for template in ReportTemplate.objects.filter(enabled=True):
            # Determine if report should run today
            should_run = False
            
            if template.frequency == 'DAILY':
                should_run = True
            elif template.frequency == 'WEEKLY':
                should_run = today.weekday() == 0  # Monday
            elif template.frequency == 'MONTHLY':
                should_run = today.day == 1  # First day of month
            elif template.frequency == 'QUARTERLY':
                should_run = today.month in [1, 4, 7, 10] and today.day == 1
            
            if should_run:
                # Generate report
                report_data = ReportingService._generate_report_by_type(
                    template.school,
                    template.report_type
                )
                
                # Create execution record
                execution = ReportExecution.objects.create(
                    template=template,
                    generated_at=datetime.now(),
                    file_path=f"reports/{template.school.id}/{template.id}/{today}.csv",
                    status='GENERATED'
                )
                
                # Send to recipients
                recipients = template.recipients.split(',')
                for recipient in recipients:
                    try:
                        ReportingService._send_report_email(
                            recipient.strip(),
                            template.report_type,
                            report_data
                        )
                        execution.status = 'SENT'
                    except Exception as e:
                        print(f"Failed to send report to {recipient}: {str(e)}")
                
                execution.save()
                processed += 1
        
        return processed
    
    @staticmethod
    def _generate_report_by_type(school, report_type):
        """Generate report based on type"""
        
        term = Term.objects.filter(school=school, is_current=True).first()
        
        if report_type == 'PAYMENT_SUMMARY':
            return ReportingService.generate_payment_summary_report(school, term)
        elif report_type == 'OUTSTANDING_FEES':
            return ReportingService.generate_outstanding_fees_report(school, term)
        elif report_type == 'PAYMENT_BY_METHOD':
            return ReportingService.generate_payment_by_method_report(school, term)
        else:
            return {}
    
    @staticmethod
    def _send_report_email(recipient, report_type, report_data):
        """Send report via email"""
        
        csv_data = ReportingService.export_report_to_csv(report_data)
        
        EmailService.send_email(
            to_email=recipient,
            subject=f"BursarPro {report_type} Report",
            body=f"Please find attached your {report_type} report.",
            attachment_data=csv_data,
            attachment_filename=f"{report_type}_{datetime.now().strftime('%Y%m%d')}.csv"
        )


class EmailService:
    """Basic email service"""
    
    @staticmethod
    def send_email(to_email, subject, body, attachment_data=None, attachment_filename=None):
        """Send email (implement with Django email backend)"""
        # This would typically use Django's send_mail or a service like SendGrid
        print(f"Email sent to {to_email}: {subject}")
