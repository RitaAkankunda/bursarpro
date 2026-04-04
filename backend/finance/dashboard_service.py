"""
Dashboard services for computing role-specific statistics and data.
"""
from django.db.models import Sum, Count, Q, F, DecimalField
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from .models import (
    School, Student, Payment, Term, FeeStructure, UserRole, 
    PaymentAlert, SMSReminderConfiguration, BankStatement, PaymentReconciliation
)


class BursarDashboardService:
    """Compute dashboard statistics for Bursars."""
    
    def __init__(self, school):
        self.school = school
    
    def get_payment_summary(self):
        """Get overall payment statistics."""
        current_term = Term.objects.filter(school=self.school, is_active=True).first()
        
        if not current_term:
            return {
                'total_fees': Decimal('0'),
                'total_paid': Decimal('0'),
                'total_outstanding': Decimal('0'),
                'collection_rate': 0,
                'total_students': 0,
                'paid_students': 0,
                'outstanding_students': 0,
            }
        
        # Total fees for all students
        total_fees = FeeStructure.objects.filter(
            term=current_term
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        
        # Total amount paid
        total_paid = Payment.objects.filter(
            school=self.school,
            term=current_term,
            status='PAID'
        ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
        
        total_outstanding = total_fees - total_paid
        
        # Student counts
        total_students = Student.objects.filter(school=self.school).count()
        paid_students = Payment.objects.filter(
            school=self.school,
            term=current_term,
            status='PAID'
        ).values('student').distinct().count()
        
        collection_rate = round((total_paid / total_fees * 100) if total_fees > 0 else 0, 2)
        
        return {
            'total_fees': float(total_fees),
            'total_paid': float(total_paid),
            'total_outstanding': float(total_outstanding),
            'collection_rate': collection_rate,
            'total_students': total_students,
            'paid_students': paid_students,
            'outstanding_students': total_students - paid_students,
        }
    
    def get_top_outstanding_students(self, limit=5):
        """Get top students with most outstanding fees."""
        current_term = Term.objects.filter(school=self.school, is_active=True).first()
        
        if not current_term:
            return []
        
        students = []
        for student in Student.objects.filter(school=self.school)[:limit * 2]:
            paid = Payment.objects.filter(
                student=student,
                term=current_term,
                status='PAID'
            ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
            
            fees = FeeStructure.objects.filter(
                student=student,
                term=current_term
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            
            outstanding = fees - paid
            if outstanding > 0:
                students.append({
                    'id': student.id,
                    'name': student.first_name,
                    'class': student.class_level.name if student.class_level else 'N/A',
                    'outstanding_amount': float(outstanding),
                })
        
        return sorted(students, key=lambda x: x['outstanding_amount'], reverse=True)[:limit]
    
    def get_recent_payments(self, limit=10):
        """Get recent payment records."""
        payments = Payment.objects.filter(
            school=self.school,
            status='PAID'
        ).select_related('student', 'term').order_by('-payment_date')[:limit]
        
        return [
            {
                'id': p.id,
                'student_name': p.student.first_name,
                'amount': float(p.amount_paid),
                'payment_method': p.payment_method,
                'date': p.payment_date.isoformat(),
                'reference': p.reference_number,
            }
            for p in payments
        ]
    
    def get_sms_stats(self):
        """Get SMS reminder statistics."""
        try:
            config = SMSReminderConfiguration.objects.get(school=self.school)
            this_month = timezone.now().date().replace(day=1)
            
            return {
                'is_enabled': config.is_enabled,
                'monthly_budget': float(config.monthly_budget),
                'sms_cost_per_unit': float(config.sms_cost_per_unit),
                'trigger_type': config.get_trigger_type_display(),
            }
        except:
            return None
    
    def get_reconciliation_stats(self):
        """Get payment reconciliation statistics."""
        unmatched = PaymentReconciliation.objects.filter(
            bank_statement__school=self.school,
            status='UNMATCHED'
        ).count()
        
        disputed = PaymentReconciliation.objects.filter(
            bank_statement__school=self.school,
            status='DISPUTED'
        ).count()
        
        matched = PaymentReconciliation.objects.filter(
            bank_statement__school=self.school,
            status='MATCHED'
        ).count()
        
        return {
            'unmatched': unmatched,
            'disputed': disputed,
            'matched': matched,
            'total': unmatched + disputed + matched,
        }
    
    def get_payment_methods_breakdown(self):
        """Get breakdown of payments by method."""
        current_term = Term.objects.filter(school=self.school, is_active=True).first()
        
        if not current_term:
            return {}
        
        methods = Payment.objects.filter(
            school=self.school,
            term=current_term,
            status='PAID'
        ).values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount_paid')
        ).order_by('-total')
        
        return [
            {
                'method': m['payment_method'],
                'count': m['count'],
                'total': float(m['total']),
            }
            for m in methods
        ]


class HeadmasterDashboardService:
    """Compute dashboard statistics for Headmasters."""
    
    def __init__(self, school):
        self.school = school
    
    def get_school_overview(self):
        """Get overall school statistic."""
        return {
            'school_name': self.school.name,
            'total_students': Student.objects.filter(school=self.school).count(),
            'total_teachers': UserRole.objects.filter(
                school=self.school,
                role='TEACHER'
            ).count(),
            'active_term': Term.objects.filter(
                school=self.school,
                is_active=True
            ).first().name if Term.objects.filter(school=self.school, is_active=True).exists() else 'None',
            'class_count': self.school.classes.count(),
        }
    
    def get_class_performance(self):
        """Get class-wise statistics."""
        classes = []
        for cls in self.school.classes.all():
            students = Student.objects.filter(class_level=cls).count()
            classes.append({
                'name': cls.name,
                'student_count': students,
            })
        return classes
    
    def get_payment_trends(self):
        """Get payment trends over last 6 months."""
        months_data = []
        today = timezone.now().date()
        
        for i in range(6):
            month_date = today - timedelta(days=30 * (5 - i))
            month_str = month_date.strftime('%B %Y')
            
            month_start = month_date.replace(day=1)
            if month_date.month == 12:
                month_end = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
            
            paid = Payment.objects.filter(
                school=self.school,
                payment_date__date__gte=month_start,
                payment_date__date__lte=month_end,
                status='PAID'
            ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
            
            months_data.append({
                'month': month_str,
                'amount': float(paid),
            })
        
        return months_data
    
    def get_teacher_insights(self):
        """Get insights for teachers (class-wise student count)."""
        teachers = UserRole.objects.filter(
            school=self.school,
            role='TEACHER'
        ).select_related('user', 'student')
        
        return [
            {
                'teacher_name': t.user.username,
                'classes': 'Multiple' if t.student else 'Assigned',
            }
            for t in teachers
        ]
    
    def get_alerts_summary(self):
        """Get active alerts for headmaster."""
        from .models import DashboardAlert
        
        alerts = DashboardAlert.objects.filter(
            school=self.school,
            is_dismissed=False,
            target_role='HEADMASTER'
        ).order_by('-severity', '-created_at')[:5]
        
        return [
            {
                'id': a.id,
                'title': a.title,
                'severity': a.get_severity_display(),
                'created_at': a.created_at.isoformat(),
            }
            for a in alerts
        ]


class TeacherDashboardService:
    """Compute dashboard statistics for Teachers."""
    
    def __init__(self, user):
        self.user = user
        try:
            self.role = UserRole.objects.get(user=user)
            self.school = self.role.school
            self.student = self.role.student
        except:
            self.school = None
            self.student = None
    
    def get_class_overview(self):
        """Get overview of teacher's class."""
        if not self.school or not self.student:
            return None
        
        # If teacher is assigned to a specific student (recorded as teacher's related student)
        # Get all students in same class
        class_students = Student.objects.filter(
            school=self.school,
            class_level=self.student.class_level
        ).count()
        
        return {
            'class_name': self.student.class_level.name if self.student.class_level else 'N/A',
            'student_count': class_students,
            'school_name': self.school.name,
        }
    
    def get_student_fee_status(self):
        """Get fee payment status for all students in class."""
        if not self.school or not self.student:
            return []
        
        current_term = Term.objects.filter(school=self.school, is_active=True).first()
        if not current_term:
            return []
        
        students = Student.objects.filter(
            school=self.school,
            class_level=self.student.class_level
        )
        
        status_list = []
        for s in students:
            fees = FeeStructure.objects.filter(
                student=s,
                term=current_term
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            
            paid = Payment.objects.filter(
                student=s,
                term=current_term,
                status='PAID'
            ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
            
            outstanding = fees - paid
            
            status_list.append({
                'student_name': s.first_name,
                'total_fees': float(fees),
                'amount_paid': float(paid),
                'outstanding': float(outstanding),
                'payment_status': 'PAID' if outstanding == 0 else 'PENDING',
            })
        
        return status_list


class ParentDashboardService:
    """Compute dashboard statistics for Parents."""
    
    def __init__(self, user):
        self.user = user
        try:
            self.role = UserRole.objects.get(user=user)
            self.student = self.role.student
            self.school = self.role.school
        except:
            self.student = None
            self.school = None
    
    def get_student_summary(self):
        """Get student fee and payment summary."""
        if not self.student or not self.school:
            return None
        
        current_term = Term.objects.filter(school=self.school, is_active=True).first()
        
        if not current_term:
            return {
                'student_name': self.student.first_name,
                'class': self.student.class_level.name if self.student.class_level else 'N/A',
                'total_fees': 0,
                'amount_paid': 0,
                'outstanding': 0,
                'payment_status': 'PENDING',
            }
        
        fees = FeeStructure.objects.filter(
            student=self.student,
            term=current_term
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        
        paid = Payment.objects.filter(
            student=self.student,
            term=current_term,
            status='PAID'
        ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
        
        outstanding = fees - paid
        
        return {
            'student_name': self.student.first_name,
            'class': self.student.class_level.name if self.student.class_level else 'N/A',
            'total_fees': float(fees),
            'amount_paid': float(paid),
            'outstanding': float(outstanding),
            'payment_status': 'PAID' if outstanding == 0 else 'PENDING',
        }
    
    def get_payment_history(self, limit=5):
        """Get payment history for student."""
        if not self.student:
            return []
        
        payments = Payment.objects.filter(
            student=self.student,
            status='PAID'
        ).order_by('-payment_date')[:limit]
        
        return [
            {
                'amount': float(p.amount_paid),
                'date': p.payment_date.isoformat(),
                'reference': p.reference_number,
            }
            for p in payments
        ]
