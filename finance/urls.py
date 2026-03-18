from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, ClassLevelViewSet, TermViewSet, 
    FeeStructureViewSet, StudentViewSet, PaymentViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet)
router.register(r'class-levels', ClassLevelViewSet)
router.register(r'terms', TermViewSet)
router.register(r'fee-structures', FeeStructureViewSet)
router.register(r'students', StudentViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
