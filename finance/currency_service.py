"""
Currency and Exchange Rate Service
"""
from datetime import datetime, timedelta
from django.db.models import Sum
from django.urls import reverse
import requests
from .models import School, Term, Payment
from .currency_models import Currency, ExchangeRate, SchoolCurrency, MultiCurrencyPayment


class CurrencyService:
    """Service for handling multi-currency operations"""
    
    # Exchange rate API endpoints
    EXCHANGE_RATE_APIs = {
        'FIXER': 'https://api.fixer.io/latest',  # Requires API key
        'OPEN_RATES': 'https://openexchangerates.org/api/latest',  # Requires API key
        'FREE_API': 'https://api.exchangerate-api.com/v4/latest'  # Free (no key needed)
    }
    
    DEFAULT_CURRENCY = 'KES'  # Kenyan Shilling
    
    @staticmethod
    def create_school_currency_config(school, primary_currency='KES', supported_currencies=None):
        """Create multi-currency configuration for a school"""
        
        if supported_currencies is None:
            supported_currencies = ['KES', 'USD', 'EUR', 'GBP']
        
        # Create primary currency
        primary, _ = Currency.objects.get_or_create(code=primary_currency)
        
        config = SchoolCurrency.objects.create(
            school=school,
            primary_currency=primary,
            allow_multi_currency=True,
            description=f"Multi-currency config for {school.name}"
        )
        
        # Add supported currencies
        for code in supported_currencies:
            currency, _ = Currency.objects.get_or_create(code=code)
            config.supported_currencies.add(currency)
        
        return config
    
    @staticmethod
    def fetch_exchange_rates(base_currency='KES', target_currencies=['USD', 'EUR', 'GBP']):
        """Fetch current exchange rates from API"""
        
        try:
            # Use free API (no API key needed)
            url = f"{CurrencyService.EXCHANGE_RATE_APIs['FREE_API']}/{base_currency}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                rates = {}
                
                for target in target_currencies:
                    if target in data.get('rates', {}):
                        rates[target] = data['rates'][target]
                
                # Store exchange rates in database
                for target, rate in rates.items():
                    ExchangeRate.objects.create(
                        from_currency_code=base_currency,
                        to_currency_code=target,
                        exchange_rate=rate,
                        rate_date=datetime.now().date()
                    )
                
                return rates
            else:
                print(f"Failed to fetch rates: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"Error fetching exchange rates: {str(e)}")
            return {}
    
    @staticmethod
    def get_exchange_rate(from_currency, to_currency, date=None):
        """Get exchange rate between two currencies"""
        
        if from_currency == to_currency:
            return 1.0
        
        if date is None:
            date = datetime.now().date()
        
        # Try to find rate in database
        rate = ExchangeRate.objects.filter(
            from_currency_code=from_currency,
            to_currency_code=to_currency,
            rate_date=date
        ).first()
        
        if rate:
            return rate.exchange_rate
        
        # If not found, try fetching from API
        rates = CurrencyService.fetch_exchange_rates(from_currency, [to_currency])
        return rates.get(to_currency, 1.0)
    
    @staticmethod
    def convert_amount(amount, from_currency, to_currency, date=None):
        """Convert amount from one currency to another"""
        
        rate = CurrencyService.get_exchange_rate(from_currency, to_currency, date)
        converted_amount = amount * rate
        
        return round(converted_amount, 2)
    
    @staticmethod
    def record_multi_currency_payment(payment, original_currency, original_amount):
        """Record payment made in a different currency"""
        
        # Convert to school's primary currency
        school_currency = SchoolCurrency.objects.filter(school=payment.school).first()
        primary_currency = school_currency.primary_currency.code if school_currency else 'KES'
        
        amount_in_primary = CurrencyService.convert_amount(
            original_amount,
            original_currency,
            primary_currency,
            payment.payment_date
        )
        
        # Create multi-currency record
        multi_currency = MultiCurrencyPayment.objects.create(
            payment=payment,
            original_currency_code=original_currency,
            original_amount=original_amount,
            primary_currency_code=primary_currency,
            converted_amount=amount_in_primary,
            exchange_rate=amount_in_primary / original_amount if original_amount > 0 else 1.0,
            conversion_date=payment.payment_date
        )
        
        # Update payment amount to primary currency
        payment.amount = amount_in_primary
        payment.save()
        
        return multi_currency
    
    @staticmethod
    def get_school_multi_currency_summary(school, term, days=30):
        """Get summary of multi-currency payments for a school"""
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        payments = Payment.objects.filter(
            school=school,
            term=term,
            payment_date__range=[start_date, end_date]
        )
        
        # Get associated multi-currency records
        multi_currency_records = MultiCurrencyPayment.objects.filter(
            payment__in=payments
        )
        
        summary = {
            'period': f"Last {days} days",
            'school': school.name,
            'total_payments': payments.count(),
            'multi_currency_payments': multi_currency_records.count(),
            'by_currency': {}
        }
        
        # Breakdown by original currency
        for record in multi_currency_records:
            currency = record.original_currency_code
            if currency not in summary['by_currency']:
                summary['by_currency'][currency] = {
                    'count': 0,
                    'original_amount': 0,
                    'converted_to_kes': 0,
                    'average_rate': 0
                }
            
            summary['by_currency'][currency]['count'] += 1
            summary['by_currency'][currency]['original_amount'] += record.original_amount
            summary['by_currency'][currency]['converted_to_kes'] += record.converted_amount
        
        # Calculate average rates
        for currency in summary['by_currency']:
            total_original = summary['by_currency'][currency]['original_amount']
            total_kes = summary['by_currency'][currency]['converted_to_kes']
            if total_original > 0:
                summary['by_currency'][currency]['average_rate'] = total_kes / total_original
        
        return summary
    
    @staticmethod
    def update_exchange_rates_daily():
        """Scheduled task to update exchange rates daily"""
        
        base_currencies = Currency.objects.values_list('code', flat=True).distinct()
        updated = 0
        
        for base in base_currencies:
            target_currencies = Currency.objects.exclude(
                code=base
            ).values_list('code', flat=True)
            
            rates = CurrencyService.fetch_exchange_rates(base, list(target_currencies))
            if rates:
                updated += len(rates)
        
        return updated
