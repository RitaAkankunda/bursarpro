from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, ClassLevelViewSet, TermViewSet,
    FeeStructureViewSet, StudentViewSet, PaymentViewSet,
    DashboardViewSet, RegisterView, UserRoleViewSet, ParentPINAuthView, StudentBalanceViewSet,
    HeadmasterDashboardViewSet, TeacherDashboardViewSet, ReportViewSet, NotificationViewSet, NotificationPreferenceViewSet,
    BulkPaymentViewSet, BankStatementViewSet, PaymentReconciliationViewSet, ReconciliationDiscrepancyViewSet,
    SMSReminderConfigurationViewSet, SMSReminderViewSet, SMSReminderHistoryViewSet, SMSReminderTemplateViewSet,
    DashboardWidgetViewSet, DashboardPreferenceViewSet, DashboardAlertViewSet, RoleDashboardViewSet, 
    GlobalSearchViewSet, WidgetCustomizationViewSet, AuditLogViewSet
)
from .phase8_viewsets import (
    ReportTemplateViewSet, ScheduledReportViewSet, ReportExecutionViewSet,
    ReportCustomizationViewSet, PaymentAnalyticViewSet, PaymentForecastViewSet,
    PaymentMethodTrendViewSet, CurrencyViewSet, ExchangeRateViewSet,
    SchoolCurrencyViewSet, MultiCurrencyPaymentViewSet, RefundViewSet,
    PaymentReversalViewSet, RefundNotificationViewSet
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

# Payment Reconciliation Endpoints
router.register(r'bank-statements', BankStatementViewSet, basename='bank-statement')
router.register(r'payment-reconciliations', PaymentReconciliationViewSet, basename='payment-reconciliation')
router.register(r'reconciliation-discrepancies', ReconciliationDiscrepancyViewSet, basename='reconciliation-discrepancy')

# SMS Reminder Endpoints
router.register(r'sms-reminders', SMSReminderViewSet, basename='sms-reminder')
router.register(r'sms-reminder-history', SMSReminderHistoryViewSet, basename='sms-reminder-history')
router.register(r'sms-reminder-templates', SMSReminderTemplateViewSet, basename='sms-reminder-template')
router.register(r'sms-reminder-config', SMSReminderConfigurationViewSet, basename='sms-reminder-config')

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

# Dashboard
router.register(r'dashboard-widgets', DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'dashboard-preferences', DashboardPreferenceViewSet, basename='dashboard-preference')
router.register(r'dashboard-alerts', DashboardAlertViewSet, basename='dashboard-alert')
router.register(r'role-dashboard', RoleDashboardViewSet, basename='role-dashboard')

# Search
router.register(r'search', GlobalSearchViewSet, basename='global-search')

# Widget Customization
router.register(r'widget-customization', WidgetCustomizationViewSet, basename='widget-customization')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/parent-pin/', ParentPINAuthView.as_view(), name='parent-pin-auth'),
    path('', include(router.urls)),
]
