"""
Analytics Models - Payment trends, forecasting, and business intelligence
"""
from django.db import models
from .models import School, Term, Student, Payment


class PaymentAnalytic(models.Model):
    """Aggregated payment analytics for dashboard"""
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    
    # Daily aggregates
    date = models.DateField()
    total_payments_day = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_count_day = models.IntegerField(default=0)
    average_payment_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Cumulative term data
    total_expected = models.DecimalField(max_digits=12, decimal_places=2)
    total_collected = models.DecimalField(max_digits=12, decimal_places=2)
    total_outstanding = models.DecimalField(max_digits=12, decimal_places=2)
    collection_rate = models.FloatField(default=0)  # percentage
    
    # Payment method breakdown
    cash_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bank_transfer_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cheque_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mobile_money_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Student metrics
    students_paid = models.IntegerField(default=0)
    students_partial = models.IntegerField(default=0)
    students_unpaid = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('school', 'term', 'date')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.school.name} - {self.term.name} - {self.date}"


class PaymentForecast(models.Model):
    """Predicted payment trends"""
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    
    # Forecast data
    forecast_date = models.DateField()
    predicted_daily_collection = models.DecimalField(max_digits=10, decimal_places=2)
    predicted_cumulative = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_level = models.FloatField()  # 0-100 percentage
    
    # Based on
    based_on_days = models.IntegerField(help_text="Number of historical days used for forecast")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-forecast_date']
    
    def __str__(self):
        return f"Forecast {self.term.name} - {self.forecast_date}"


class PaymentMethodTrend(models.Model):
    """Track payment method preferences over time"""
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('MOBILE_MONEY', 'Mobile Money'),
    ]
    
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount_collected = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = models.IntegerField()
    percentage_of_total = models.FloatField()
    
    class Meta:
        unique_together = ('school', 'term', 'date', 'payment_method')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.school.name} - {self.payment_method} - {self.date}"
