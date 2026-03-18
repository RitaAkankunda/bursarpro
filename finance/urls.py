from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, ClassLevelViewSet, TermViewSet,
    FeeStructureViewSet, StudentViewSet, PaymentViewSet,
    DashboardViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet)
router.register(r'class-levels', ClassLevelViewSet, basename='classlevel')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'fee-structures', FeeStructureViewSet, basename='feestructure')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
