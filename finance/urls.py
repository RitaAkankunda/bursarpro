from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, ClassLevelViewSet, TermViewSet,
    FeeStructureViewSet, StudentViewSet, PaymentViewSet,
    DashboardViewSet, RegisterView, UserRoleViewSet, ParentPINAuthView, StudentBalanceViewSet,
    HeadmasterDashboardViewSet, TeacherDashboardViewSet, ReportViewSet, NotificationViewSet, NotificationPreferenceViewSet,
    BulkPaymentViewSet
)
from .phase8_viewsets import (
    ReportTemplateViewSet, ScheduledReportViewSet, ReportExecutionViewSet,
    ReportCustomizationViewSet, PaymentAnalyticViewSet, PaymentForecastViewSet,
    PaymentMethodTrendViewSet, CurrencyViewSet, ExchangeRateViewSet,
    SchoolCurrencyViewSet, MultiCurrencyPaymentViewSet, RefundViewSet,
    PaymentReversalViewSet, RefundNotificationViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'class-levels', ClassLevelViewSet, basename='classlevel')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'fee-structures', FeeStructureViewSet, basename='feestructure')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'user-roles', UserRoleViewSet, basename='userrole')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'student-balance', StudentBalanceViewSet, basename='student-balance')
router.register(r'headmaster-dashboard', HeadmasterDashboardViewSet, basename='headmaster-dashboard')
router.register(r'teacher-dashboard', TeacherDashboardViewSet, basename='teacher-dashboard')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'bulk-payments', BulkPaymentViewSet, basename='bulk-payment')

# Phase 8 Endpoints
# Reporting
router.register(r'report-templates', ReportTemplateViewSet, basename='report-template')
router.register(r'scheduled-reports', ScheduledReportViewSet, basename='scheduled-report')
router.register(r'report-executions', ReportExecutionViewSet, basename='report-execution')
router.register(r'report-customizations', ReportCustomizationViewSet, basename='report-customization')

# Analytics
router.register(r'payment-analytics', PaymentAnalyticViewSet, basename='payment-analytic')
router.register(r'payment-forecasts', PaymentForecastViewSet, basename='payment-forecast')
router.register(r'payment-method-trends', PaymentMethodTrendViewSet, basename='payment-method-trend')

# Currency
router.register(r'currencies', CurrencyViewSet, basename='currency')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')
router.register(r'school-currencies', SchoolCurrencyViewSet, basename='school-currency')
router.register(r'multi-currency-payments', MultiCurrencyPaymentViewSet, basename='multi-currency-payment')

# Refunds
router.register(r'refunds', RefundViewSet, basename='refund')
router.register(r'payment-reversals', PaymentReversalViewSet, basename='payment-reversal')
router.register(r'refund-notifications', RefundNotificationViewSet, basename='refund-notification')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/parent-pin/', ParentPINAuthView.as_view(), name='parent-pin-auth'),
    path('', include(router.urls)),
]
