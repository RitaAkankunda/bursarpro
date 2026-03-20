from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, ClassLevelViewSet, TermViewSet,
    FeeStructureViewSet, StudentViewSet, PaymentViewSet,
    DashboardViewSet, RegisterView, UserRoleViewSet, ParentPINAuthView, StudentBalanceViewSet,
    HeadmasterDashboardViewSet, ReportViewSet, NotificationViewSet, NotificationPreferenceViewSet,
    BulkPaymentViewSet
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
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'bulk-payments', BulkPaymentViewSet, basename='bulk-payment')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/parent-pin/', ParentPINAuthView.as_view(), name='parent-pin-auth'),
    path('', include(router.urls)),
]
