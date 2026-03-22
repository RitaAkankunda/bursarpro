"""
Analytics Service - Payment trends, forecasting, and business intelligence
"""
from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Q
from .models import Payment, Student, FeeStructure
from .analytics_models import PaymentAnalytic, PaymentForecast, PaymentMethodTrend


class AnalyticsService:
    """Service for computing and storing analytics data"""
    
    @staticmethod
    def generate_daily_analytics(school, term, date=None):
        """Generate daily analytics snapshot"""
        if date is None:
            date = datetime.now().date()
        
        # Get payments for this day
        daily_payments = Payment.objects.filter(
            student__school=school,
            term=term,
            payment_date__date=date
        )
        
        daily_total = daily_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        daily_count = daily_payments.count()
        daily_avg = (daily_total / daily_count) if daily_count > 0 else Decimal('0')
        
        # Get all students in school
        total_students = Student.objects.filter(school=school).count()
        
        # Get expected vs collected cumulative
        total_expected = Decimal('0')
        for fee in FeeStructure.objects.filter(term=term):
            count = Student.objects.filter(school=school, class_level=fee.class_level).count()
            total_expected += fee.amount * count
        
        # Get total collected up to this date
        total_collected = Payment.objects.filter(
            student__school=school,
            term=term,
            payment_date__date__lte=date
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        total_outstanding = total_expected - total_collected
        collection_rate = (total_collected / total_expected * 100) if total_expected > 0 else 0
        
        # Break down by payment method
        payment_methods = daily_payments.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        cash_collected = Decimal('0')
        bank_transfer = Decimal('0')
        cheque = Decimal('0')
        mobile_money = Decimal('0')
        
        for method in payment_methods:
            if method['payment_method'] == 'CASH':
                cash_collected = method['total'] or Decimal('0')
            elif method['payment_method'] == 'BANK_TRANSFER':
                bank_transfer = method['total'] or Decimal('0')
            elif method['payment_method'] == 'CHEQUE':
                cheque = method['total'] or Decimal('0')
            elif method['payment_method'] == 'MOBILE_MONEY':
                mobile_money = method['total'] or Decimal('0')
        
        # Count students by payment status up to this date
        students_paid = Payment.objects.filter(
            student__school=school,
            term=term,
            payment_date__date__lte=date
        ).values('student').distinct().count()
        
        students_partial = 0
        students_unpaid = total_students - students_paid
        
        # For partial, we'd need to check if they paid less than expected
        for student in Student.objects.filter(school=school):
            expected = Decimal('0')
            for fee in FeeStructure.objects.filter(term=term, class_level=student.class_level):
                expected += fee.amount
            
            paid = Payment.objects.filter(
                student=student,
                term=term,
                payment_date__date__lte=date
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            if paid > 0 and paid < expected:
                students_partial += 1
            elif paid >= expected:
                students_unpaid -= 1
        
        # Create or update analytics record
        analytic, created = PaymentAnalytic.objects.update_or_create(
            school=school,
            term=term,
            date=date,
            defaults={
                'total_payments_day': daily_total,
                'payment_count_day': daily_count,
                'average_payment_day': daily_avg,
                'total_expected': total_expected,
                'total_collected': total_collected,
                'total_outstanding': total_outstanding,
                'collection_rate': float(collection_rate),
                'cash_collected': cash_collected,
                'bank_transfer_collected': bank_transfer,
                'cheque_collected': cheque,
                'mobile_money_collected': mobile_money,
                'students_paid': students_paid,
                'students_partial': students_partial,
                'students_unpaid': students_unpaid,
            }
        )
        
        return analytic
    
    @staticmethod
    def forecast_payment_trend(school, term, days_ahead=30):
        """Generate payment forecast for next N days"""
        from datetime import datetime, timedelta
        
        # Get last 14 days of actual data
        today = datetime.now().date()
        start_date = today - timedelta(days=14)
        
        historical_analytics = PaymentAnalytic.objects.filter(
            school=school,
            term=term,
            date__gte=start_date,
            date__lt=today
        ).order_by('-date')
        
        if not historical_analytics.exists():
            return None
        
        # Calculate average daily collection
        total_historical = sum(a.total_payments_day for a in historical_analytics)
        avg_daily_collection = total_historical / len(list(historical_analytics))
        
        # Generate forecasts
        current_total = PaymentAnalytic.objects.filter(
            school=school,
            term=term,
            date__lt=today
        ).aggregate(total=Sum('total_collected'))['total'] or Decimal('0')
        
        forecasts = []
        confidence = 85  # Start with 85% confidence
        
        for day_offset in range(1, days_ahead + 1):
            forecast_date = today + timedelta(days=day_offset)
            predicted_daily = avg_daily_collection * Decimal(0.95 if day_offset > 7 else 1.0)  # Decline over time
            predicted_cumulative = current_total + (avg_daily_collection * day_offset)
            
            # Adjust confidence over time (higher uncertainty further out)
            confidence_adjusted = max(50, confidence - (day_offset // 7) * 5)
            
            forecast = PaymentForecast.objects.create(
                school=school,
                term=term,
                forecast_date=forecast_date,
                predicted_daily_collection=predicted_daily,
                predicted_cumulative=predicted_cumulative,
                confidence_level=confidence_adjusted,
                based_on_days=14
            )
            forecasts.append(forecast)
        
        return forecasts
    
    @staticmethod
    def track_payment_methods(school, term, date=None):
        """Track payment method trends"""
        if date is None:
            date = datetime.now().date()
        
        daily_payments = Payment.objects.filter(
            student__school=school,
            term=term,
            payment_date__date=date
        )
        
        total_today = daily_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        if total_today == 0:
            return []
        
        payment_methods = daily_payments.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        trends = []
        for method in payment_methods:
            percentage = (method['total'] / total_today * 100) if total_today > 0 else 0
            
            trend = PaymentMethodTrend.objects.create(
                school=school,
                term=term,
                date=date,
                payment_method=method['payment_method'],
                amount_collected=method['total'],
                transaction_count=method['count'],
                percentage_of_total=float(percentage)
            )
            trends.append(trend)
        
        return trends
