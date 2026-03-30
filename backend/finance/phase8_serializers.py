"""
Serializers for Phase 8 Models (Reporting, Analytics, Currency, Refunds)
"""
from rest_framework import serializers
from .reporting_models import ReportTemplate, ScheduledReport, ReportExecution, ReportCustomization
from .analytics_models import PaymentAnalytic, PaymentForecast, PaymentMethodTrend
from .currency_models import Currency, ExchangeRate, SchoolCurrency, MultiCurrencyPayment
from .refund_models import Refund, PaymentReversal, RefundNotification, AuditLog


# ==================== REPORTING SERIALIZERS ====================

class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Report Templates"""
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'school', 'report_type', 'recipients', 'frequency',
            'enabled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ScheduledReportSerializer(serializers.ModelSerializer):
    """Serializer for Scheduled Reports"""
    template_name = serializers.CharField(source='template.report_type', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = [
            'id', 'template', 'template_name', 'school', 'term',
            'frequency', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReportExecutionSerializer(serializers.ModelSerializer):
    """Serializer for Report Executions"""
    template_type = serializers.CharField(source='template.report_type', read_only=True)
    
    class Meta:
        model = ReportExecution
        fields = [
            'id', 'template', 'template_type', 'generated_at',
            'sent_at', 'file_path', 'status', 'notes'
        ]
        read_only_fields = ['id', 'generated_at']


class ReportCustomizationSerializer(serializers.ModelSerializer):
    """Serializer for Custom Reports"""
    class Meta:
        model = ReportCustomization
        fields = [
            'id', 'school', 'name', 'description', 'report_type',
            'selected_fields', 'filters', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


# ==================== ANALYTICS SERIALIZERS ====================

class PaymentAnalyticSerializer(serializers.ModelSerializer):
    """Serializer for Payment Analytics"""
    class Meta:
        model = PaymentAnalytic
        fields = [
            'id', 'school', 'term', 'date', 'total_payments',
            'total_amount', 'average_payment', 'cash_payments',
            'bank_payments', 'cheque_payments', 'mobile_payments'
        ]
        read_only_fields = ['id']


class PaymentForecastSerializer(serializers.ModelSerializer):
    """Serializer for Payment Forecasts"""
    class Meta:
        model = PaymentForecast
        fields = [
            'id', 'school', 'term', 'forecast_date', 'forecast_start_date',
            'forecast_end_date', 'predicted_payments', 'predicted_total',
            'confidence_level', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PaymentMethodTrendSerializer(serializers.ModelSerializer):
    """Serializer for Payment Method Trends"""
    class Meta:
        model = PaymentMethodTrend
        fields = [
            'id', 'school', 'term', 'date', 'cash_percentage',
            'bank_percentage', 'cheque_percentage', 'mobile_percentage',
            'dominant_method'
        ]
        read_only_fields = ['id']


# ==================== CURRENCY SERIALIZERS ====================

class CurrencySerializer(serializers.ModelSerializer):
    """Serializer for Currencies"""
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'is_active']


class ExchangeRateSerializer(serializers.ModelSerializer):
    """Serializer for Exchange Rates"""
    from_currency_code = serializers.CharField(source='from_currency.code', read_only=True)
    to_currency_code = serializers.CharField(source='to_currency.code', read_only=True)
    
    class Meta:
        model = ExchangeRate
        fields = [
            'id', 'from_currency', 'from_currency_code', 'to_currency',
            'to_currency_code', 'rate', 'date', 'source'
        ]
        read_only_fields = ['id']


class SchoolCurrencySerializer(serializers.ModelSerializer):
    """Serializer for School Currency Configuration"""
    primary_currency_code = serializers.CharField(source='primary_currency.code', read_only=True)
    supported_currencies = CurrencySerializer(many=True, read_only=True)
    
    class Meta:
        model = SchoolCurrency
        fields = [
            'id', 'school', 'primary_currency', 'primary_currency_code',
            'supported_currencies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MultiCurrencyPaymentSerializer(serializers.ModelSerializer):
    """Serializer for Multi-Currency Payments"""
    original_currency_code = serializers.CharField(source='original_currency.code', read_only=True)
    converted_currency_code = serializers.CharField(source='converted_currency.code', read_only=True)
    
    class Meta:
        model = MultiCurrencyPayment
        fields = [
            'id', 'payment', 'original_currency', 'original_currency_code',
            'original_amount', 'converted_currency', 'converted_currency_code',
            'converted_amount', 'exchange_rate_used', 'exchange_rate_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ==================== REFUND SERIALIZERS ====================

class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refunds"""
    student_name = serializers.CharField(source='payment.student.full_name', read_only=True)
    payment_amount = serializers.DecimalField(source='payment.amount', read_only=True, max_digits=12, decimal_places=2)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'payment', 'student_name', 'payment_amount', 'amount',
            'reason', 'description', 'refund_method', 'status',
            'requested_by', 'requested_at', 'approved_by', 'approved_at',
            'completed_at', 'notes'
        ]
        read_only_fields = ['id', 'requested_at', 'approved_at', 'completed_at']


class PaymentReversalSerializer(serializers.ModelSerializer):
    """Serializer for Payment Reversals"""
    payment_receipt = serializers.CharField(source='payment.receipt_number', read_only=True)
    
    class Meta:
        model = PaymentReversal
        fields = [
            'id', 'payment', 'payment_receipt', 'reason', 'description',
            'status', 'requested_by', 'requested_at', 'approved_by',
            'approved_at', 'reversed_at', 'original_amount', 'original_receipt'
        ]
        read_only_fields = ['id', 'requested_at', 'approved_at', 'reversed_at']


class RefundNotificationSerializer(serializers.ModelSerializer):
    """Serializer for Refund Notifications"""
    class Meta:
        model = RefundNotification
        fields = [
            'id', 'refund', 'recipient_phone', 'recipient_email',
            'notification_type', 'status', 'sent_at', 'attempts'
        ]
        read_only_fields = ['id', 'sent_at']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for Audit Logs"""
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'entity_type', 'entity_id', 'performed_by',
            'performed_by_username', 'old_values', 'new_values',
            'description', 'timestamp'
        ]
        read_only_fields = [
            'id', 'timestamp', 'performed_by_username'
        ]
