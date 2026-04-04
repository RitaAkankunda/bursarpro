"""
Advanced search and filtering service for complex queries across models.
Supports multi-field search, date range filtering, and aggregations.
"""
from django.db.models import Q, Sum, Count, F
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone


class StudentSearchService:
    """Advanced search functionality for students."""
    
    def __init__(self, school, queryset=None):
        self.school = school
        from .models import Student
        self.queryset = queryset or Student.objects.filter(school=school)
    
    def search(self, query):
        """
        Multi-field search: name, admission number, class
        """
        if not query or len(query.strip()) == 0:
            return self.queryset
        
        q_obj = Q(first_name__icontains=query) | \
                Q(last_name__icontains=query) | \
                Q(admission_number__icontains=query) | \
                Q(email__icontains=query)
        
        return self.queryset.filter(q_obj)
    
    def filter_by_class(self, class_level_id):
        """Filter by class level"""
        if not class_level_id:
            return self.queryset
        return self.queryset.filter(class_level_id=class_level_id)
    
    def filter_by_status(self, status):
        """
        Filter by payment status
        'paid' - all fees paid, 'pending' - some fees pending, 'overdue' - overdue
        """
        from .models import Term, FeeStructure, Payment
        
        if status == 'paid':
            # Students with no outstanding fees
            current_term = Term.objects.filter(school=self.school, is_active=True).first()
            if not current_term:
                return self.queryset.none()
            
            unpaid_students = FeeStructure.objects.filter(
                term=current_term,
                student__school=self.school
            ).exclude(
                student__payment__status='PAID'
            ).values_list('student_id', flat=True).distinct()
            
            return self.queryset.exclude(id__in=unpaid_students)
        
        elif status == 'pending':
            # Students with pending fees
            current_term = Term.objects.filter(school=self.school, is_active=True).first()
            if not current_term:
                return self.queryset.none()
            
            pending_students = FeeStructure.objects.filter(
                term=current_term,
                student__school=self.school
            ).values_list('student_id', flat=True).distinct()
            
            return self.queryset.filter(id__in=pending_students)
        
        return self.queryset
    
    def filter_by_gender(self, gender):
        """Filter by gender (M/F)"""
        if not gender:
            return self.queryset
        return self.queryset.filter(gender__iexact=gender[0])
    
    def sort(self, sort_by):
        """
        Sort by field
        Options: name, admission_number, class, date_joined
        """
        sort_map = {
            'name': 'first_name',
            'admission_number': 'admission_number',
            'class': 'class_level__name',
        }
        
        field = sort_map.get(sort_by, 'first_name')
        return self.queryset.order_by(field)
    
    def get_summary_stats(self):
        """Get aggregated statistics for search results"""
        total = self.queryset.count()
        by_gender = self.queryset.values('gender').annotate(count=Count('id'))
        
        return {
            'total_students': total,
            'by_gender': list(by_gender),
        }


class PaymentSearchService:
    """Advanced search functionality for payments."""
    
    def __init__(self, school, queryset=None):
        self.school = school
        from .models import Payment
        self.queryset = queryset or Payment.objects.filter(school=school)
    
    def search(self, query):
        """
        Multi-field search: student name, reference number, payment method
        """
        if not query or len(query.strip()) == 0:
            return self.queryset
        
        q_obj = Q(student__first_name__icontains=query) | \
                Q(student__last_name__icontains=query) | \
                Q(reference_number__icontains=query) | \
                Q(payment_method__icontains=query)
        
        return self.queryset.filter(q_obj)
    
    def filter_by_status(self, status):
        """Filter by payment status"""
        if not status:
            return self.queryset
        return self.queryset.filter(status__iexact=status)
    
    def filter_by_method(self, method):
        """Filter by payment method"""
        if not method:
            return self.queryset
        return self.queryset.filter(payment_method__iexact=method)
    
    def filter_by_date_range(self, start_date, end_date):
        """Filter payments within date range"""
        if not start_date or not end_date:
            return self.queryset
        
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            end = end + timedelta(days=1)  # Include entire end date
            
            return self.queryset.filter(
                payment_date__date__gte=start,
                payment_date__date__lt=end
            )
        except:
            return self.queryset
    
    def filter_by_amount_range(self, min_amount, max_amount):
        """Filter payments within amount range"""
        queryset = self.queryset
        
        if min_amount:
            try:
                queryset = queryset.filter(amount_paid__gte=Decimal(str(min_amount)))
            except:
                pass
        
        if max_amount:
            try:
                queryset = queryset.filter(amount_paid__lte=Decimal(str(max_amount)))
            except:
                pass
        
        return queryset
    
    def filter_by_term(self, term_id):
        """Filter by term"""
        if not term_id:
            return self.queryset
        return self.queryset.filter(term_id=term_id)
    
    def filter_by_class(self, class_level_id):
        """Filter by student's class"""
        if not class_level_id:
            return self.queryset
        return self.queryset.filter(student__class_level_id=class_level_id)
    
    def sort(self, sort_by):
        """
        Sort by field
        Options: date, amount, student, status
        """
        sort_map = {
            'date': '-payment_date',
            'amount': '-amount_paid',
            'student': 'student__first_name',
            'status': 'status',
            'recent': '-payment_date',
        }
        
        field = sort_map.get(sort_by, '-payment_date')
        return self.queryset.order_by(field)
    
    def get_summary_stats(self, queryset=None):
        """Get aggregated statistics for search results"""
        qs = queryset or self.queryset
        
        total_amount = qs.filter(status='PAID').aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
        total_count = qs.count()
        paid_count = qs.filter(status='PAID').count()
        pending_count = qs.filter(status='PENDING').count()
        
        by_method = qs.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount_paid')
        ).order_by('-total')
        
        return {
            'total_payments': total_count,
            'total_amount': float(total_amount),
            'paid_count': paid_count,
            'pending_count': pending_count,
            'by_method': list(by_method),
        }


class FeeStructureSearchService:
    """Advanced search functionality for fee structures."""
    
    def __init__(self, school, queryset=None):
        self.school = school
        from .models import FeeStructure
        self.queryset = queryset or FeeStructure.objects.filter(school=school)
    
    def search(self, query):
        """
        Multi-field search: student name, fee name
        """
        if not query or len(query.strip()) == 0:
            return self.queryset
        
        q_obj = Q(student__first_name__icontains=query) | \
                Q(student__last_name__icontains=query) | \
                Q(fee_name__icontains=query) | \
                Q(description__icontains=query)
        
        return self.queryset.filter(q_obj)
    
    def filter_by_term(self, term_id):
        """Filter by term"""
        if not term_id:
            return self.queryset
        return self.queryset.filter(term_id=term_id)
    
    def filter_by_class(self, class_level_id):
        """Filter by student's class"""
        if not class_level_id:
            return self.queryset
        return self.queryset.filter(student__class_level_id=class_level_id)
    
    def filter_by_amount_range(self, min_amount, max_amount):
        """Filter fees within amount range"""
        queryset = self.queryset
        
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=Decimal(str(min_amount)))
            except:
                pass
        
        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=Decimal(str(max_amount)))
            except:
                pass
        
        return queryset
    
    def sort(self, sort_by):
        """
        Sort by field
        Options: student, amount, term, date
        """
        sort_map = {
            'student': 'student__first_name',
            'amount': '-amount',
            'term': 'term__name',
            'date': '-created_at',
        }
        
        field = sort_map.get(sort_by, '-created_at')
        return self.queryset.order_by(field)
    
    def get_summary_stats(self, queryset=None):
        """Get aggregated statistics for search results"""
        qs = queryset or self.queryset
        
        total_amount = qs.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        total_count = qs.count()
        
        by_term = qs.values('term__name').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        by_class = qs.values('student__class_level__name').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        return {
            'total_fees': total_count,
            'total_amount': float(total_amount),
            'by_term': list(by_term),
            'by_class': list(by_class),
        }


class GlobalSearchService:
    """Global search across all models."""
    
    def __init__(self, school):
        self.school = school
    
    def search_all(self, query, limit=5):
        """
        Execute global search across students, payments, fees
        Returns results grouped by model
        """
        from .models import Student, Payment, FeeStructure
        
        if not query or len(query.strip()) < 2:
            return {'students': [], 'payments': [], 'fees': []}
        
        # Search students
        students = Student.objects.filter(school=self.school).filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(admission_number__icontains=query)
        )[:limit]
        
        # Search payments
        payments = Payment.objects.filter(school=self.school).filter(
            Q(student__first_name__icontains=query) |
            Q(student__last_name__icontains=query) |
            Q(reference_number__icontains=query)
        )[:limit]
        
        # Search fees
        fees = FeeStructure.objects.filter(school=self.school).filter(
            Q(student__first_name__icontains=query) |
            Q(student__last_name__icontains=query) |
            Q(fee_name__icontains=query)
        )[:limit]
        
        return {
            'students': [
                {
                    'id': s.id,
                    'name': s.first_name,
                    'type': 'student',
                    'class': s.class_level.name if s.class_level else 'N/A',
                    'admission_number': s.admission_number,
                }
                for s in students
            ],
            'payments': [
                {
                    'id': p.id,
                    'name': f"{p.student.first_name} - UGX {p.amount_paid}",
                    'type': 'payment',
                    'reference': p.reference_number,
                    'date': p.payment_date.isoformat(),
                }
                for p in payments
            ],
            'fees': [
                {
                    'id': f.id,
                    'name': f"{f.student.first_name} - {f.fee_name}",
                    'type': 'fee',
                    'amount': float(f.amount),
                }
                for f in fees
            ],
        }
