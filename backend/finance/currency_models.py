"""
Multi-currency Support Models
"""
from django.db import models
from .models import School, Term, Payment


class Currency(models.Model):
    """Supported currencies in the system"""
    code = models.CharField(max_length=3, unique=True)  # e.g., KES, USD, EUR
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=5)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Currencies"
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class ExchangeRate(models.Model):
    """Daily exchange rates"""
    from_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='rates_from')
    to_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='rates_to')
    
    rate = models.DecimalField(max_digits=10, decimal_places=6)
    date = models.DateField()
    source = models.CharField(max_length=100, blank=True)  # e.g., "Central Bank", "XE.com"
    
    class Meta:
        unique_together = ('from_currency', 'to_currency', 'date')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.from_currency.code}/{self.to_currency.code} - {self.date}: {self.rate}"


class SchoolCurrency(models.Model):
    """School's primary currency and supported currencies"""
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='currency_config')
    primary_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='primary_for_schools')
    supported_currencies = models.ManyToManyField(Currency, help_text="Currencies accepted by this school")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.school.name} - {self.primary_currency.code}"


class MultiCurrencyPayment(models.Model):
    """Track payments in their original currency"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='multi_currency')
    
    original_currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    converted_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='converted_payments')
    converted_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    exchange_rate_used = models.DecimalField(max_digits=10, decimal_places=6)
    exchange_rate_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.original_amount} {self.original_currency.code} -> {self.converted_amount} {self.converted_currency.code}"
