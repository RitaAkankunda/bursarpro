"""
ViewSets for Phase 8 Models (Reporting, Analytics, Currency, Refunds)
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .reporting_models import ReportTemplate, ScheduledReport, ReportExecution, ReportCustomization
from .analytics_models import PaymentAnalytic, PaymentForecast, PaymentMethodTrend
from .currency_models import Currency, ExchangeRate, SchoolCurrency, MultiCurrencyPayment
from .refund_models import Refund, PaymentReversal, RefundNotification, AuditLog
from .phase8_serializers import (
    ReportTemplateSerializer, ScheduledReportSerializer, ReportExecutionSerializer,
    ReportCustomizationSerializer, PaymentAnalyticSerializer, PaymentForecastSerializer,
    PaymentMethodTrendSerializer, CurrencySerializer, ExchangeRateSerializer,
    SchoolCurrencySerializer, MultiCurrencyPaymentSerializer, RefundSerializer,
    PaymentReversalSerializer, RefundNotificationSerializer, AuditLogSerializer
)
from .reporting_service import ReportingService
from .refund_service import RefundService
from .currency_service import CurrencyService


# ==================== REPORTING VIEWSETS ====================

class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report templates"""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school', 'report_type', 'enabled']
    search_fields = ['recipients']
    
    def get_queryset(self):
        """Filter templates by user's school"""
        user = self.request.user
        if hasattr(user, 'role') and user.role.school:
            return ReportTemplate.objects.filter(school=user.role.school)
        return ReportTemplate.objects.none()
    
    @action(detail=True, methods=['post'])
    def generate_now(self, request, pk=None):
        """Generate report immediately"""
        template = self.get_object()
        try:
            report_data = ReportingService._generate_report_by_type(
                template.school,
                template.report_type
            )
            return Response({
                'status': 'success',
                'data': report_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ScheduledReportViewSet(viewsets.ModelViewSet):
    """ViewSet for scheduled reports"""
    queryset = ScheduledReport.objects.all()
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['school', 'term', 'is_active']


class ReportExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for report executions (read-only)"""
    queryset = ReportExecution.objects.all()
    serializer_class = ReportExecutionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'status']
    ordering_fields = ['generated_at']
    ordering = ['-generated_at']


class ReportCustomizationViewSet(viewsets.ModelViewSet):
    """ViewSet for custom reports"""
    queryset = ReportCustomization.objects.all()
    serializer_class = ReportCustomizationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school', 'report_type']
    search_fields = ['name']
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


# ==================== ANALYTICS VIEWSETS ====================

class PaymentAnalyticViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment analytics (read-only)"""
    queryset = PaymentAnalytic.objects.all()
    serializer_class = PaymentAnalyticSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['school', 'term', 'date']
    ordering_fields = ['date']
    ordering = ['-date']
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get analytics summary for a school"""
        school_id = request.query_params.get('school')
        term_id = request.query_params.get('term')
        
        if not school_id or not term_id:
            return Response({
                'error': 'school and term parameters required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        analytics = PaymentAnalytic.objects.filter(
            school_id=school_id,
            term_id=term_id
        ).order_by('-date')[:30]
        
        serializer = self.get_serializer(analytics, many=True)
        return Response({
            'count': len(analytics),
            'data': serializer.data
        })


class PaymentForecastViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment forecasts (read-only)"""
    queryset = PaymentForecast.objects.all()
    serializer_class = PaymentForecastSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['school', 'term']
    ordering_fields = ['forecast_date']
    ordering = ['-forecast_date']


class PaymentMethodTrendViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment method trends (read-only)"""
    queryset = PaymentMethodTrend.objects.all()
    serializer_class = PaymentMethodTrendSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['school', 'term']
    ordering_fields = ['date']
    ordering = ['-date']


# ==================== CURRENCY VIEWSETS ====================

class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for currencies (read-only)"""
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']


class ExchangeRateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for exchange rates (read-only)"""
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['from_currency', 'to_currency', 'date']
    ordering_fields = ['date']
    ordering = ['-date']
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest exchange rate between two currencies"""
        from_code = request.query_params.get('from')
        to_code = request.query_params.get('to')
        
        if not from_code or not to_code:
            return Response({
                'error': 'from and to parameters required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rate = ExchangeRate.objects.filter(
                from_currency__code=from_code,
                to_currency__code=to_code
            ).latest('date')
            
            serializer = self.get_serializer(rate)
            return Response(serializer.data)
        except ExchangeRate.DoesNotExist:
            return Response({
                'error': 'Exchange rate not found'
            }, status=status.HTTP_404_NOT_FOUND)


class SchoolCurrencyViewSet(viewsets.ModelViewSet):
    """ViewSet for school currency configuration"""
    queryset = SchoolCurrency.objects.all()
    serializer_class = SchoolCurrencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['school']
    
    @action(detail=True, methods=['post'])
    def add_currency(self, request, pk=None):
        """Add a supported currency to school"""
        config = self.get_object()
        currency_code = request.data.get('currency_code')
        
        if not currency_code:
            return Response({
                'error': 'currency_code required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            currency = Currency.objects.get(code=currency_code)
            config.supported_currencies.add(currency)
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        except Currency.DoesNotExist:
            return Response({
                'error': 'Currency not found'
            }, status=status.HTTP_404_NOT_FOUND)


class MultiCurrencyPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for multi-currency payments (read-only)"""
    queryset = MultiCurrencyPayment.objects.all()
    serializer_class = MultiCurrencyPaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['original_currency', 'converted_currency']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


# ==================== REFUND VIEWSETS ====================

class RefundViewSet(viewsets.ModelViewSet):
    """ViewSet for managing refunds"""
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['payment__school', 'status', 'refund_method']
    ordering_fields = ['requested_at']
    ordering = ['-requested_at']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a refund request"""
        refund = self.get_object()
        notes = request.data.get('notes', '')
        
        try:
            RefundService.approve_refund(refund, request.user, notes)
            serializer = self.get_serializer(refund)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a refund request"""
        refund = self.get_object()
        reason = request.data.get('reason', '')
        
        try:
            RefundService.reject_refund(refund, request.user, reason)
            serializer = self.get_serializer(refund)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process (complete) an approved refund"""
        refund = self.get_object()
        
        if refund.status != 'APPROVED':
            return Response({
                'error': 'Only approved refunds can be processed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            RefundService.process_refund(refund, request.user)
            serializer = self.get_serializer(refund)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentReversalViewSet(viewsets.ModelViewSet):
    """ViewSet for payment reversals"""
    queryset = PaymentReversal.objects.all()
    serializer_class = PaymentReversalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['payment__school', 'status']
    ordering_fields = ['requested_at']
    ordering = ['-requested_at']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a reversal request"""
        reversal = self.get_object()
        
        try:
            RefundService.approve_reversal(reversal, request.user)
            serializer = self.get_serializer(reversal)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a reversal (delete payment)"""
        reversal = self.get_object()
        
        if reversal.status != 'APPROVED':
            return Response({
                'error': 'Only approved reversals can be executed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            RefundService.execute_reversal(reversal, request.user)
            serializer = self.get_serializer(reversal)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RefundNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for refund notifications (read-only)"""
    queryset = RefundNotification.objects.all()
    serializer_class = RefundNotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['refund', 'status']
    ordering_fields = ['sent_at']
    ordering = ['-sent_at']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for audit logs (read-only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['action', 'entity_type', 'performed_by']
    search_fields = ['description']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
