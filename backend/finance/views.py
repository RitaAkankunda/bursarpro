from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count, Q
from django.contrib.auth.models import User
from datetime import datetime
import json
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment, UserRole, Notification, NotificationPreference, DashboardWidget, DashboardPreference, DashboardAlert
from .refund_models import AuditLog
from .serializers import (
    SchoolSerializer, ClassLevelSerializer, TermSerializer,
    FeeStructureSerializer, StudentSerializer, PaymentSerializer,
    UserRegistrationSerializer, UserRoleSerializer, ParentPINSerializer,
    NotificationSerializer, NotificationPreferenceSerializer,
    BankStatementSerializer, PaymentReconciliationSerializer, ReconciliationDiscrepancySerializer,
    SMSReminderConfigurationSerializer, SMSReminderSerializer, SMSReminderHistorySerializer, SMSReminderTemplateSerializer,
    DashboardWidgetSerializer, DashboardPreferenceSerializer, DashboardAlertSerializer,
    AuditLogSerializer
)
from .permissions import IsBursar, BursarOrReadOnly
from .utils import send_payment_sms, render_to_pdf
from .notification_service import SMSService, EmailService
from .reports import ReportGenerator
from .bulk_payment_service import BulkPaymentProcessor, BulkPaymentError
from .sms_reminder_service import SMSReminderService
from .dashboard_service import BursarDashboardService, HeadmasterDashboardService, TeacherDashboardService, ParentDashboardService
from .search_service import StudentSearchService, PaymentSearchService, FeeStructureSearchService, GlobalSearchService
from .widget_customization_service import WidgetCustomizationService, WidgetLayoutService
from django.http import HttpResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime, timedelta
import csv

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class ParentPINAuthView(generics.GenericAPIView):
    """
    Parent authentication via PIN code.
    POST with: student_id and pin_code
    Returns JWT token for parent access to student's data
    """
    serializer_class = ParentPINSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'student_id': serializer.validated_data['student_id'],
            'student_name': serializer.validated_data['student_name'],
            'parent_name': serializer.validated_data['parent_name'],
        }, status=status.HTTP_200_OK)


class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user roles.
    - Bursar can create/update/delete roles
    - Other users can only view their own role
    """
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Bursar sees all roles in their school, others see only their own
        user_role = UserRole.objects.filter(user=self.request.user).first()
        
        if user_role and user_role.role == 'BURSAR':
            # Bursar sees all roles in their school
            return UserRole.objects.filter(school=user_role.school)
        else:
            # Others see only their own role
            return UserRole.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Only bursar can create roles
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if not user_role or user_role.role != 'BURSAR':
            return Response(
                {'error': 'Only Bursars can create roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()

    def perform_destroy(self, instance):
        # Prevent deleting the last bursar role
        if instance.role == 'BURSAR':
            bursar_count = UserRole.objects.filter(
                school=instance.school,
                role='BURSAR'
            ).count()
            if bursar_count <= 1:
                return Response(
                    {'error': 'Cannot delete the last Bursar role in the school'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        instance.delete()


class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users only see schools they created
        return School.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # Automatically set created_by to current user when creating a school
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def my_school(self, request):
        """Get the current user's school (first one if multiple)"""
        school = School.objects.filter(created_by=request.user).first()
        if school:
            serializer = self.get_serializer(school)
            return Response(serializer.data)
        return Response({'error': 'No school found'}, status=status.HTTP_404_NOT_FOUND)


class ClassLevelViewSet(viewsets.ModelViewSet):
    serializer_class = ClassLevelSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Get user's school from their role
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            # Return all classes for their school
            qs = ClassLevel.objects.filter(school=user_role.school)
        else:
            # Fallback for BURSAR - show their created schools' classes
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            qs = ClassLevel.objects.filter(school_id__in=user_schools)
        
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs

    def perform_create(self, serializer):
        # Verify the school belongs to the current user
        school_id = serializer.validated_data.get('school').id
        user_role = UserRole.objects.filter(user=self.request.user).first()
        
        # Check if user is BURSAR or has permission for this school
        if user_role and user_role.role == 'BURSAR':
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            if school_id not in user_schools:
                return Response(
                    {'error': 'You do not have permission to add classes to this school'},
                    status=status.HTTP_403_FORBIDDEN
                )
        serializer.save()


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Get user's school from their role
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            # Return all terms for their school
            qs = Term.objects.filter(school=user_role.school)
        else:
            # Fallback for BURSAR - show their created schools' terms
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            qs = Term.objects.filter(school_id__in=user_schools)
        
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs

    def perform_create(self, serializer):
        # Verify the school belongs to the current user
        school_id = serializer.validated_data.get('school').id
        user_role = UserRole.objects.filter(user=self.request.user).first()
        
        # Check if user is BURSAR or has permission for this school
        if user_role and user_role.role == 'BURSAR':
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            if school_id not in user_schools:
                return Response(
                    {'error': 'You do not have permission to add terms to this school'},
                    status=status.HTTP_403_FORBIDDEN
                )
        serializer.save()


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Get user's school from their role
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            # Return fees for their school
            qs = FeeStructure.objects.filter(term__school=user_role.school)
        else:
            # Fallback for BURSAR - show their created schools' fees
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            qs = FeeStructure.objects.filter(term__school_id__in=user_schools)
        
        term_id = self.request.query_params.get('term_id')
        class_level_id = self.request.query_params.get('class_level_id')
        search = self.request.query_params.get('search')
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        sort_by = self.request.query_params.get('sort_by', 'date')
        
        if term_id:
            qs = qs.filter(term_id=term_id)
        if class_level_id:
            qs = qs.filter(student__class_level_id=class_level_id)
        
        # Use search service for advanced filtering
        if user_role and user_role.school:
            search_service = FeeStructureSearchService(user_role.school, qs)
        else:
            search_service = FeeStructureSearchService(None, qs)
        
        if search:
            qs = search_service.search(search)
        if min_amount or max_amount:
            qs = search_service.filter_by_amount_range(min_amount, max_amount)
        
        qs = search_service.sort(sort_by)
        return qs
    
    @action(detail=False, methods=['get'])
    def search_stats(self, request):
        """Get aggregated statistics for current search/filter results"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        qs = self.get_queryset()
        search_service = FeeStructureSearchService(user_role.school, qs)
        stats = search_service.get_summary_stats(qs)
        
        return Response(stats)

    def perform_create(self, serializer):
        # Verify term belongs to user's school
        term = serializer.validated_data.get('term')
        user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
        if term.school_id not in user_schools:
            return Response(
                {'error': 'You cannot add fees to terms in other schools'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Get user's school from their role
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            # Return all students for their school
            qs = Student.objects.filter(school=user_role.school)
        else:
            # Fallback for BURSAR - show their created schools' students
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            qs = Student.objects.filter(school_id__in=user_schools)
        
        school_id = self.request.query_params.get('school_id')
        class_level_id = self.request.query_params.get('class_level_id')
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')
        gender = self.request.query_params.get('gender')
        sort_by = self.request.query_params.get('sort_by', 'date_joined')

        if school_id:
            qs = qs.filter(school_id=school_id)
        if class_level_id:
            qs = qs.filter(class_level_id=class_level_id)
        
        # Use search service for advanced filtering
        if user_role and user_role.school:
            search_service = StudentSearchService(user_role.school, qs)
        else:
            search_service = StudentSearchService(qs.first().school if qs.exists() else None, qs)
        
        if search:
            qs = search_service.search(search)
        if status_filter:
            qs = search_service.filter_by_status(status_filter)
        if gender:
            qs = search_service.filter_by_gender(gender)
        
        qs = search_service.sort(sort_by)
        return qs

    def perform_create(self, serializer):
        # Auto-assign student to user's school
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            serializer.save(school=user_role.school)
        else:
            # Fallback for BURSAR
            user_school = School.objects.filter(created_by=self.request.user).first()
            if user_school:
                serializer.save(school=user_school)
            else:
                return Response(
                    {'error': 'No school associated with user. Please create a school first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('no_paginate') == 'true':
            return None
        return super().paginate_queryset(queryset)
    
    @action(detail=False, methods=['get'])
    def search_stats(self, request):
        """Get aggregated statistics for current search/filter results"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        qs = self.get_queryset()
        search_service = StudentSearchService(user_role.school, qs)
        stats = search_service.get_summary_stats()
        
        return Response(stats)
        
    @action(detail=False, methods=['get'])
    def send_reminders(self, request):
        term_id = request.data.get('term_id')
        if not term_id:
            return Response({"detail": "term_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        students = self.get_queryset()
        reminders_sent = 0
        from .notification_service import SMSService
        
        for student in students:
            # Calculate expected fee
            fee_structures = FeeStructure.objects.filter(term_id=term_id, class_level=student.class_level)
            expected = sum(f.amount for f in fee_structures)
            
            # Calculate total paid
            payments = Payment.objects.filter(student=student, term_id=term_id)
            paid = payments.aggregate(total=Sum('amount'))['total'] or 0
            
            balance = expected - paid
            if balance > 0 and student.parent_phone:
                SMSService.send_outstanding_fees_alert(student, balance)
                reminders_sent += 1
                
        return Response({
            "detail": f"Successfully dispatched {reminders_sent} SMS reminders.",
            "count": reminders_sent
        }, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Get user's school from their role
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role and user_role.school:
            # Return all payments for their school
            qs = Payment.objects.select_related('student', 'term', 'recorded_by').filter(student__school=user_role.school)
        else:
            # Fallback for BURSAR - show their created schools' payments
            user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
            qs = Payment.objects.select_related('student', 'term', 'recorded_by').filter(student__school_id__in=user_schools)
        
        student_id = self.request.query_params.get('student_id')
        term_id = self.request.query_params.get('term_id')
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')
        method_filter = self.request.query_params.get('method')
        class_level_id = self.request.query_params.get('class_level_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        sort_by = self.request.query_params.get('sort_by', 'date')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        
        # Use search service for advanced filtering
        if user_role and user_role.school:
            search_service = PaymentSearchService(user_role.school, qs)
        else:
            search_service = PaymentSearchService(None, qs)
        
        if search:
            qs = search_service.search(search)
        if status_filter:
            qs = search_service.filter_by_status(status_filter)
        if method_filter:
            qs = search_service.filter_by_method(method_filter)
        if class_level_id:
            qs = search_service.filter_by_class(class_level_id)
        if start_date or end_date:
            qs = search_service.filter_by_date_range(start_date, end_date)
        if min_amount or max_amount:
            qs = search_service.filter_by_amount_range(min_amount, max_amount)
        
        qs = search_service.sort(sort_by)
        return qs

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('no_paginate') == 'true':
            return None
        return super().paginate_queryset(queryset)
    
    @action(detail=False, methods=['get'])
    def search_stats(self, request):
        """Get aggregated statistics for current search/filter results"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        qs = self.get_queryset()
        search_service = PaymentSearchService(user_role.school, qs)
        stats = search_service.get_summary_stats(qs)
        
        return Response(stats)

    def perform_create(self, serializer):
        payment = serializer.save(recorded_by=self.request.user)
        try:
            # Try the new SMS service first
            SMSService.send_payment_confirmation(payment, payment.student.parent_phone)
            
            # create notification record in DB
            from .models import Notification
            Notification.objects.create(
                user=self.request.user,
                title="Payment Receipt Sent",
                message=f"SMS receipt for {payment.receipt_number} dispatched to {payment.student.parent_name}.",
                type='info'
            )
        except Exception as e:
            # Fallback to old method if new service fails
            try:
                from .utils import send_payment_sms
                send_payment_sms(payment)
            except Exception:
                pass  # SMS failure should not block payment recording

    @action(detail=True, methods=['get'], url_path='receipt')
    def receipt(self, request, pk=None):
        """Generate a PDF receipt for a payment."""
        payment = self.get_object()
        context = {'payment': payment}
        pdf = render_to_pdf('finance/receipt.html', context)
        if pdf:
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'filename="receipt_{payment.receipt_number}.pdf"'
            return response
        return Response(
            {'error': 'Failed to generate PDF'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class DashboardViewSet(viewsets.ViewSet):
    """
    Returns a summary for the Bursar/Headteacher dashboard.
    Required query param: ?term_id=<id>
    Optional query param: ?school_id=<id>
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        term_id = request.query_params.get('term_id')
        school_id = request.query_params.get('school_id')

        if not term_id:
            return Response(
                {'error': 'term_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Base querysets filtered by school if provided
        student_qs = Student.objects.all()
        payment_qs = Payment.objects.filter(term_id=term_id)
        fee_qs = FeeStructure.objects.filter(term_id=term_id)

        if school_id:
            student_qs = student_qs.filter(school_id=school_id)
            payment_qs = payment_qs.filter(student__school_id=school_id)
            fee_qs = fee_qs.filter(term__school_id=school_id)

        total_students = student_qs.count()
        total_collected = payment_qs.aggregate(total=Sum('amount'))['total'] or 0

        # Total expected = sum of fee_structure amounts * number of students per class
        total_expected = 0
        for fee in fee_qs:
            count = student_qs.filter(class_level=fee.class_level).count()
            total_expected += float(fee.amount) * count

        total_outstanding = total_expected - float(total_collected)

        # Students who have made at least one payment this term
        paid_students = payment_qs.values('student').distinct().count()

        return Response({
            'term_id': term_id,
            'total_students': total_students,
            'students_with_payments': paid_students,
            'students_without_payments': total_students - paid_students,
            'total_expected': round(total_expected, 2),
            'total_collected': round(float(total_collected), 2),
            'total_outstanding': round(total_outstanding, 2),
            'collection_rate_percent': round(
                (float(total_collected) / total_expected * 100) if total_expected > 0 else 0, 1
            ),
        })

    @action(detail=False, methods=['post'])
    def send_outstanding_alerts(self, request):
        """Send SMS alerts to parents for outstanding fees"""
        term_id = request.query_params.get('term_id')
        
        if not term_id:
            return Response(
                {'error': 'term_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            term = Term.objects.get(id=term_id)
        except Term.DoesNotExist:
            return Response(
                {'error': 'Term not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all students in all schools (or filter by school)
        school_id = request.query_params.get('school_id')
        students_qs = Student.objects.all()
        if school_id:
            students_qs = students_qs.filter(school_id=school_id)

        sent_count = 0
        failed_count = 0
        
        for student in students_qs:
            try:
                # Get student's fee structure
                fee = FeeStructure.objects.filter(
                    term=term,
                    class_level=student.class_level
                ).first()
                
                if not fee:
                    continue
                
                # Get total paid
                paid = float(
                    Payment.objects.filter(
                        student=student,
                        term=term
                    ).aggregate(total=Sum('amount'))['total'] or 0
                )
                
                outstanding = float(fee.amount) - paid
                
                # Send SMS only if there are outstanding fees
                if outstanding > 0:
                    SMSService.send_outstanding_fees_alert(student, outstanding)
                    sent_count += 1
            except Exception as e:
                failed_count += 1

        return Response({
            'term_id': term_id,
            'alerts_sent': sent_count,
            'alerts_failed': failed_count,
            'message': f'Sent {sent_count} outstanding fees alerts'
        })


class StudentBalanceViewSet(viewsets.ViewSet):
    """
    Parents can view their student's balance and payment history.
    Accessed via JWT token obtained from /auth/parent-pin/
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get student balance for current term"""
        # Get parent role to find their student
        parent_role = UserRole.objects.filter(user=request.user, role='PARENT').first()
        
        if not parent_role or not parent_role.student:
            return Response(
                {'error': 'Parent account not properly configured'},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = parent_role.student
        term_id = request.query_params.get('term_id')

        if not term_id:
            # Get the current/latest term
            term = Term.objects.filter(school=student.school).order_by('-end_date').first()
            if not term:
                return Response(
                    {'error': 'No active term found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            term_id = term.id
        else:
            try:
                term = Term.objects.get(id=term_id)
            except Term.DoesNotExist:
                return Response(
                    {'error': 'Term not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get fee structure for student's class this term
        fee_structure = FeeStructure.objects.filter(
            term=term,
            class_level=student.class_level
        ).first()

        if not fee_structure:
            return Response(
                {'error': 'No fee structure for this term'},
                status=status.HTTP_400_BAD_REQUEST
            )

        expected_amount = float(fee_structure.amount)

        # Get total paid this term
        total_paid = Payment.objects.filter(
            student=student,
            term=term
        ).aggregate(total=Sum('amount'))['total'] or 0
        total_paid = float(total_paid)

        balance = expected_amount - total_paid

        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'class': student.class_level.name,
            'term': term.name,
            'term_id': term.id,
            'expected_amount': round(expected_amount, 2),
            'amount_paid': round(total_paid, 2),
            'balance_outstanding': round(balance, 2),
            'payment_status': 'fully_paid' if balance <= 0 else 'partially_paid' if total_paid > 0 else 'unpaid',
        })

    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """Get payment history for the parent's student"""
        parent_role = UserRole.objects.filter(user=request.user, role='PARENT').first()
        
        if not parent_role or not parent_role.student:
            return Response(
                {'error': 'Parent account not properly configured'},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = parent_role.student
        term_id = request.query_params.get('term_id')

        # Get payments
        payments = Payment.objects.select_related('term').filter(student=student)
        
        if term_id:
            payments = payments.filter(term_id=term_id)

        payments = payments.order_by('-payment_date')

        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'payments': [
                {
                    'id': p.id,
                    'receipt_number': p.receipt_number,
                    'amount': float(p.amount),
                    'payment_date': p.payment_date,
                    'term': p.term.name,
                    'recorded_by': p.recorded_by.username,
                }
                for p in payments
            ]
        })

    @action(detail=False, methods=['get'], url_path='receipt/(?P<payment_id>[0-9]+)')
    def receipt(self, request, payment_id=None):
        """Download receipt for a specific payment"""
        parent_role = UserRole.objects.filter(user=request.user, role='PARENT').first()
        
        if not parent_role or not parent_role.student:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify this payment belongs to parent's student
        try:
            payment = Payment.objects.get(id=payment_id, student=parent_role.student)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        context = {'payment': payment}
        pdf = render_to_pdf('finance/receipt.html', context)
        if pdf:
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'filename="receipt_{payment.receipt_number}.pdf"'
            return response
        return Response(
            {'error': 'Failed to generate PDF'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @action(detail=False, methods=['post'], url_path='pay_online')
    def pay_online(self, request):
        """Simulate an online payment via Student Portal Checkout"""
        parent_role = UserRole.objects.filter(user=request.user, role='PARENT').first()
        if not parent_role or not parent_role.student:
            return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Payment amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        student = parent_role.student
        term = Term.objects.filter(school=student.school).order_by('-end_date').first()

        try:
            payment = Payment.objects.create(
                student=student,
                term=term,
                amount=amount,
                payment_method='MOBILE_MONEY',
                recorded_by=request.user
            )
            
            # Dispatch the SMS receipt automatically
            from .notification_service import SMSService
            SMSService.send_payment_confirmation(payment, student.parent_phone)

            return Response({
                'message': 'Online Payment processed successfully',
                'receipt': payment.receipt_number
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)




class HeadmasterDashboardViewSet(viewsets.ViewSet):

    """

    Headmaster dashboard with school-wide reports.

    - Headmasters see read-only reports for their school

    - Shows collection analytics, unpaid students, payment trends

    """

    permission_classes = [IsAuthenticated]



    def list(self, request):

        """Get headmaster dashboard overview for a school"""

        # Get headmaster's school

        headmaster_role = UserRole.objects.filter(user=request.user, role='HEADMASTER').first()

        

        if not headmaster_role or not headmaster_role.school:

            return Response(

                {'error': 'Headmaster account not properly configured'},

                status=status.HTTP_400_BAD_REQUEST

            )



        school = headmaster_role.school

        term_id = request.query_params.get('term_id')



        if not term_id:

            # Get current/latest term

            term = Term.objects.filter(school=school).order_by('-end_date').first()

            if not term:

                return Response(

                    {'error': 'No active term found'},

                    status=status.HTTP_400_BAD_REQUEST

                )

            term_id = term.id

        else:

            try:

                term = Term.objects.get(id=term_id, school=school)

            except Term.DoesNotExist:

                return Response(

                    {'error': 'Term not found'},

                    status=status.HTTP_404_NOT_FOUND

                )



        # Get all students in school

        total_students = Student.objects.filter(school=school).count()

        

        # Get payments for this term

        payments = Payment.objects.filter(term=term, student__school=school)

        total_collected = float(payments.aggregate(total=Sum('amount'))['total'] or 0)

        

        # Get expected fees

        fee_structures = FeeStructure.objects.filter(term=term)

        total_expected = 0

        for fee in fee_structures:

            students_in_class = Student.objects.filter(

                school=school,

                class_level=fee.class_level

            ).count()

            total_expected += float(fee.amount) * students_in_class



        total_outstanding = total_expected - total_collected



        # Students analysis

        students_paid = payments.values('student').distinct().count()

        students_unpaid = total_students - students_paid



        # Collection rate

        collection_rate = round(

            (total_collected / total_expected * 100) if total_expected > 0 else 0, 1

        )



        # Get list of unpaid students

        unpaid_students_list = []

        for student in Student.objects.filter(school=school):

            student_paid = float(

                payments.filter(student=student).aggregate(total=Sum('amount'))['total'] or 0

            )

            

            # Find student's expected fee

            student_fee = fee_structures.filter(class_level=student.class_level).first()

            if student_fee:

                expected = float(student_fee.amount)

                unpaid = expected - student_paid

                

                if unpaid > 0:

                    unpaid_students_list.append({
                        'id': student.id,
                        'name': f"{student.first_name} {student.last_name}",
                        'class': student.class_level.name,
                        'expected': expected,
                        'paid': student_paid,
                        'outstanding': unpaid,
                        'parent_phone': student.parent_phone
                    })



        # Sort by outstanding amount (highest first)

        unpaid_students_list.sort(key=lambda x: x['outstanding'], reverse=True)



        # Payment trend (last 5 payments this term)

        recent_payments = payments.order_by('-payment_date')[:5]

        payment_trend = [

            {

                'receipt': p.receipt_number,

                'student': f"{p.student.first_name} {p.student.last_name}",

                'amount': float(p.amount),

                'date': p.payment_date.isoformat()

            }

            for p in recent_payments

        ]



        return Response({

            'school_name': school.name,

            'term': term.name,

            'term_id': term.id,

            'total_students': total_students,

            'students_paid': students_paid,

            'students_unpaid': students_unpaid,

            'total_expected': round(total_expected, 2),

            'total_collected': round(total_collected, 2),

            'total_outstanding': round(total_outstanding, 2),

            'collection_rate_percent': collection_rate,

            'average_payment_per_student': round(

                (total_collected / students_paid) if students_paid > 0 else 0, 2

            ),

            'unpaid_students': unpaid_students_list,

            'recent_payments': payment_trend,

        })



    @action(detail=False, methods=['get'])

    def students_report(self, request):

        """Detailed student payment report"""

        headmaster_role = UserRole.objects.filter(user=request.user, role='HEADMASTER').first()

        

        if not headmaster_role or not headmaster_role.school:

            return Response(

                {'error': 'Unauthorized'},

                status=status.HTTP_403_FORBIDDEN

            )



        school = headmaster_role.school

        term_id = request.query_params.get('term_id')



        if not term_id:

            term = Term.objects.filter(school=school).order_by('-end_date').first()

            if not term:

                return Response(

                    {'error': 'No term found'},

                    status=status.HTTP_400_BAD_REQUEST

                )

        else:

            try:

                term = Term.objects.get(id=term_id, school=school)

            except Term.DoesNotExist:

                return Response({'error': 'Term not found'}, status=404)



        students_report = []

        for student in Student.objects.filter(school=school).select_related('class_level'):

            fee = FeeStructure.objects.filter(

                term=term,

                class_level=student.class_level

            ).first()

            

            if not fee:

                continue



            payments = Payment.objects.filter(student=student, term=term)

            total_paid = float(payments.aggregate(total=Sum('amount'))['total'] or 0)

            expected = float(fee.amount)

            outstanding = expected - total_paid



            students_report.append({

                'id': student.id,

                'name': f"{student.first_name} {student.last_name}",

                'class': student.class_level.name,

                'expected': expected,

                'paid': total_paid,

                'outstanding': outstanding,

                'status': 'fully_paid' if outstanding <= 0 else 'partial' if total_paid > 0 else 'unpaid',

                'payment_count': payments.count(),

                'last_payment': payments.order_by('-payment_date').first().payment_date.isoformat() if payments.exists() else None

            })



        return Response({

            'term': term.name,

            'school': school.name,

            'students_count': len(students_report),

            'report': students_report

        })


class TeacherDashboardViewSet(viewsets.ViewSet):
    """
    Teacher dashboard showing classes and students.
    Teachers can view classes and students in their school.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get teacher dashboard overview"""
        # Get teacher's school
        teacher_role = UserRole.objects.filter(user=request.user, role='TEACHER').first()
        
        if not teacher_role or not teacher_role.school:
            return Response(
                {'error': 'Teacher account not properly configured'},
                status=status.HTTP_400_BAD_REQUEST
            )

        school = teacher_role.school
        term_id = request.query_params.get('term_id')

        if not term_id:
            # Get current/latest term
            term = Term.objects.filter(school=school).order_by('-end_date').first()
            if not term:
                return Response(
                    {'error': 'No active term found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            term_id = term.id
        else:
            try:
                term = Term.objects.get(id=term_id, school=school)
            except Term.DoesNotExist:
                return Response(
                    {'error': 'Term not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get all classes in school
        classes = ClassLevel.objects.filter(school=school)
        
        # Build class details with students
        classes_data = []
        for cls in classes:
            students = Student.objects.filter(school=school, class_level=cls)
            fee_structure = FeeStructure.objects.filter(term=term, class_level=cls).first()
            
            # Calculate class stats
            total_students = students.count()
            payments = Payment.objects.filter(
                student__in=students,
                term=term
            )
            students_paid = payments.values('student').distinct().count()
            students_unpaid = total_students - students_paid
            total_collected = float(payments.aggregate(total=Sum('amount'))['total'] or 0)
            
            classes_data.append({
                'id': cls.id,
                'name': cls.name,
                'total_students': total_students,
                'students_paid': students_paid,
                'students_unpaid': students_unpaid,
                'fee_amount': float(fee_structure.amount) if fee_structure else 0,
                'total_collected': round(total_collected, 2),
                'students': [
                    {
                        'id': s.id,
                        'name': f"{s.first_name} {s.last_name}",
                        'student_id': s.student_id,
                    }
                    for s in students
                ]
            })

        # Terms for dropdown
        terms = Term.objects.filter(school=school).order_by('-start_date').values('id', 'name')

        return Response({
            'term': term.name,
            'term_id': term.id,
            'school': school.name,
            'classes': classes_data,
            'terms': list(terms),
            'total_classes': len(classes_data),
        })


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    Users can view and manage their notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see only their own notifications
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread = self.get_queryset().exclude(status='DELIVERED')
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read/delivered"""
        notification = self.get_object()
        notification.status = 'DELIVERED'
        notification.save()
        return Response({'status': 'marked as read'})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification preferences
    Each user has their notification preferences (SMS, Email, etc.)
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post'])
    def my_preferences(self, request):
        """Get or update current user's notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(user=request.user)
        
        if request.method == 'POST':
            serializer = self.get_serializer(preference, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(preference)
        return Response(serializer.data)


# Append this content to finance/views.py to restore ReportViewSet


class ReportViewSet(viewsets.ViewSet):
    """
    Report generation ViewSet for Bursar/Headmaster
    Generates PDF reports for various fee collection analytics
    """
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def _get_school_and_term(self, request):
        """Helper to get user's school and requested term"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role or not user_role.school:
            return None, None, Response(
                {'error': 'User not associated with a school'},
                status=status.HTTP_400_BAD_REQUEST
            )
        school = user_role.school

        term_id = request.query_params.get('term')
        if not term_id:
            term = Term.objects.filter(school=school).order_by('-end_date').first()
            if not term:
                return None, None, Response(
                    {'error': 'No active term found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            try:
                term = Term.objects.get(id=term_id, school=school)
            except Term.DoesNotExist:
                return None, None, Response(
                    {'error': 'Term not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        return school, term, None

    @action(detail=False, methods=['get'])
    def collection_summary(self, request):
        """Collection Summary Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_collection_summary(school, term)
        filename = f'collection_summary_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def student_statements(self, request):
        """Student Statements Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_student_statements(school, term)
        filename = f'student_statements_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def payment_transactions(self, request):
        """Payment Transactions Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_payment_transactions(school, term)
        filename = f'payment_transactions_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def collection_analytics(self, request):
        """Collection Analytics Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_collection_analytics(school, term)
        filename = f'collection_analytics_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def outstanding_fees(self, request):
        """Outstanding Fees Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_outstanding_fees(school, term)
        filename = f'outstanding_fees_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def budget_vs_actual(self, request):
        """Budget vs Actual Report"""
        school, term, error = self._get_school_and_term(request)
        if error:
            return error

        pdf_buffer = ReportGenerator.generate_budget_vs_actual(school, term)
        filename = f'budget_vs_actual_{term.name}_{datetime.now().strftime("%Y%m%d%H%M%S")}.pdf'
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread = self.get_queryset().exclude(status='DELIVERED')
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post'])
    def my_preferences(self, request):
        """Get or update notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(user=request.user)
        
        if request.method == 'POST':
            serializer = self.get_serializer(preference, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(preference)
        return Response(serializer.data)



class BulkPaymentViewSet(viewsets.ViewSet):
    """
    ViewSet for bulk payment uploads via Excel file
    POST /api/v1/bulk-payments/upload/ - Upload Excel file with multiple payments
    """
    permission_classes = [IsAuthenticated, IsBursar]

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        """
        Upload and process an Excel file with bulk payments
        
        POST body:
        - file: Excel file (.xlsx or .xls)
        - term_id: ID of the term for these payments
        
        Returns:
        {
            'total_rows': int,
            'successful_payments': int,
            'failed_payments': int,
            'validation_errors': list,
            'created_payments': list,
            'total_amount': decimal
        }
        """
        # Get file and term_id
        file_obj = request.FILES.get('file')
        term_id = request.data.get('term_id')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided. Use "file" field in form data.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not term_id:
            return Response(
                {'error': 'term_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file type
        filename = file_obj.name.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.xls')):
            return Response(
                {'error': 'File must be .xlsx or .xls format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Process the bulk payment
            processor = BulkPaymentProcessor(file_obj, term_id, request.user)
            results = processor.process()
            
            return Response(results, status=status.HTTP_200_OK)
            
        except BulkPaymentError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error processing file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request):
        """Get bulk payment upload history (if implemented)"""
        return Response({
            'message': 'Use POST /upload/ endpoint to upload bulk payments',
            'supported_formats': ['xlsx', 'xls'],
            'required_columns': ['Student ID', 'Amount', 'Receipt Number', 'Payment Method'],
            'valid_payment_methods': ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY']
        })


# Payment Reconciliation ViewSets
class BankStatementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bank statement uploads and processing.
    """
    serializer_class = None  # Will be set based on action
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter statements by user's school"""
        from .models import BankStatement
        user_school = UserRole.objects.filter(user=self.request.user).first()
        if user_school:
            return BankStatement.objects.filter(school=user_school.school).order_by('-statement_date')
        return BankStatement.objects.none()
    
    def get_serializer_class(self):
        from .serializers import BankStatementSerializer
        return BankStatementSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBursar])
    def process(self, request, pk=None):
        """
        Process an uploaded bank statement for reconciliation.
        """
        from .models import BankStatement
        statement = self.get_object()
        
        if statement.status != 'PENDING':
            return Response(
                {'error': f'Statement already in {statement.get_status_display()} status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update status to processing
            statement.status = 'PROCESSING'
            statement.save()
            
            # TODO: Parse bank statement file and create reconciliation records
            # This would typically involve:
            # 1. Reading the bank statement file (CSV, Excel, etc.)
            # 2. Extracting transaction data
            # 3. Creating PaymentReconciliation records for each transaction
            # 4. Running matching algorithm
            
            statement.status = 'PARTIAL'
            statement.save()
            
            serializer = self.get_serializer(statement)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            statement.status = 'FAILED'
            statement.save()
            return Response(
                {'error': f'Error processing statement: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentReconciliationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment reconciliations and matching.
    """
    serializer_class = None  # Will be set based on action
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter reconciliations by user's school (through bank statement)"""
        from .models import PaymentReconciliation
        user_school = UserRole.objects.filter(user=self.request.user).first()
        if user_school:
            return PaymentReconciliation.objects.filter(
                bank_statement__school=user_school.school
            ).order_by('-bank_date')
        return PaymentReconciliation.objects.none()
    
    def get_serializer_class(self):
        from .serializers import PaymentReconciliationSerializer
        return PaymentReconciliationSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBursar])
    def match_payment(self, request, pk=None):
        """
        Manually match a bank transaction to a payment.
        """
        from .models import PaymentReconciliation
        reconciliation = self.get_object()
        payment_id = request.data.get('payment_id')
        confidence = request.data.get('confidence_score', 100)
        notes = request.data.get('notes', '')
        
        if not payment_id:
            return Response(
                {'error': 'payment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Update reconciliation
            reconciliation.payment = payment
            reconciliation.matched_amount = payment.amount_paid
            reconciliation.amount_difference = abs(reconciliation.bank_amount - payment.amount_paid)
            reconciliation.status = 'MANUAL_MATCHED'
            reconciliation.confidence_score = confidence
            reconciliation.notes = notes
            reconciliation.matched_by = request.user
            reconciliation.matched_at = datetime.now()
            reconciliation.save()
            
            serializer = self.get_serializer(reconciliation)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsBursar])
    def unmatched(self, request):
        """Get all unmatched reconciliation records"""
        from .models import PaymentReconciliation
        queryset = self.get_queryset().filter(status='UNMATCHED')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsBursar])
    def disputed(self, request):
        """Get all disputed reconciliation records"""
        from .models import PaymentReconciliation
        queryset = self.get_queryset().filter(status='DISPUTED')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ReconciliationDiscrepancyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reconciliation discrepancies.
    """
    serializer_class = None  # Will be set based on action
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter discrepancies by user's school (through reconciliation -> bank statement)"""
        from .models import ReconciliationDiscrepancy
        user_school = UserRole.objects.filter(user=self.request.user).first()
        if user_school:
            return ReconciliationDiscrepancy.objects.filter(
                reconciliation__bank_statement__school=user_school.school
            ).order_by('-severity', '-created_at')
        return ReconciliationDiscrepancy.objects.none()
    
    def get_serializer_class(self):
        from .serializers import ReconciliationDiscrepancySerializer
        return ReconciliationDiscrepancySerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBursar])
    def resolve(self, request, pk=None):
        """
        Mark a discrepancy as resolved.
        """
        from .models import ReconciliationDiscrepancy
        discrepancy = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')
        
        discrepancy.is_resolved = True
        discrepancy.resolution_notes = resolution_notes
        discrepancy.resolved_at = datetime.now()
        discrepancy.save()
        
        serializer = self.get_serializer(discrepancy)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsBursar])
    def unresolved(self, request):
        """Get all unresolved discrepancies"""
        from .models import ReconciliationDiscrepancy
        queryset = self.get_queryset().filter(is_resolved=False)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsBursar])
    def by_severity(self, request):
        """Get discrepancies filtered by severity"""
        from .models import ReconciliationDiscrepancy
        severity = request.query_params.get('severity')
        
        if not severity:
            return Response(
                {'error': 'severity query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(severity=severity)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# SMS Reminder ViewSets
class SMSReminderConfigurationViewSet(viewsets.ViewSet):
    """
    ViewSet for managing SMS reminder configuration.
    Only one config per school.
    """
    permission_classes = [IsAuthenticated, IsBursar]
    
    def get_school(self):
        """Get user's school"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        return user_role.school if user_role else None
    
    def list(self, request):
        """Get SMS reminder configuration for school"""
        from .models import SMSReminderConfiguration
        school = self.get_school()
        if not school:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        config, created = SMSReminderConfiguration.objects.get_or_create(school=school)
        serializer = SMSReminderConfigurationSerializer(config)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """Update SMS reminder configuration"""
        from .models import SMSReminderConfiguration
        school = self.get_school()
        if not school:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        config, created = SMSReminderConfiguration.objects.get_or_create(school=school)
        serializer = SMSReminderConfigurationSerializer(config, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get SMS reminder statistics"""
        school = self.get_school()
        if not school:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = SMSReminderService(school)
        stats = service.get_stats()
        return Response(stats)


class SMSReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing scheduled SMS reminders.
    """
    serializer_class = None
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter reminders by user's school"""
        from .models import SMSReminder
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role:
            return SMSReminder.objects.filter(school=user_role.school).order_by('-scheduled_send_time')
        return SMSReminder.objects.none()
    
    def get_serializer_class(self):
        return SMSReminderSerializer
    
    @action(detail=False, methods=['post'])
    def schedule_batch(self, request):
        """Schedule reminders for upcoming payment deadlines"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if not user_role:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = SMSReminderService(user_role.school)
        scheduled_count = service.schedule_reminders()
        
        return Response({
            'message': f'Scheduled {scheduled_count} SMS reminders',
            'count': scheduled_count
        })
    
    @action(detail=False, methods=['post'])
    def send_scheduled(self, request):
        """Send all scheduled reminders that are due"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if not user_role:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = SMSReminderService(user_role.school)
        sent_count = service.send_scheduled_reminders()
        
        return Response({
            'message': f'Sent {sent_count} SMS reminders',
            'count': sent_count
        })
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend a failed SMS reminder"""
        from .models import SMSReminder
        reminder = self.get_object()
        
        if reminder.status == 'FAILED':
            service = SMSReminderService(reminder.school)
            success = service.send_sms(reminder)
            
            if success:
                reminder.status = 'SENT'
                reminder.sent_at = datetime.now()
                reminder.retry_count += 1
                reminder.save()
                
                serializer = self.get_serializer(reminder)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Failed to send reminder'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {'error': f'Cannot resend reminder with status {reminder.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending reminders"""
        queryset = self.get_queryset().filter(status='PENDING')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SMSReminderHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing SMS reminder history (read-only).
    """
    serializer_class = SMSReminderHistorySerializer
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter history by user's school"""
        from .models import SMSReminderHistory
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role:
            return SMSReminderHistory.objects.filter(school=user_role.school).order_by('-sent_at')
        return SMSReminderHistory.objects.none()
    
    @action(detail=False, methods=['get'])
    def by_student(self, request):
        """Get SMS history for a specific student"""
        from .models import SMSReminderHistory
        student_id = request.query_params.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'student_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(student_id=student_id)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly_cost(self, request):
        """Get monthly SMS cost"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if not user_role:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = SMSReminderService(user_role.school)
        cost = service.get_monthly_cost()
        
        return Response({
            'monthly_cost': float(cost),
            'budget_exceeded': service.is_budget_exceeded()
        })


class SMSReminderTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing SMS reminder message templates.
    """
    serializer_class = SMSReminderTemplateSerializer
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter templates by user's school"""
        from .models import SMSReminderTemplate
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role:
            return SMSReminderTemplate.objects.filter(school=user_role.school).order_by('-created_at')
        return SMSReminderTemplate.objects.none()


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing dashboard widget configurations by role.
    Allows Bursars to configure which widgets appear for each role.
    """
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated, IsBursar]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter widgets by user's school"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role:
            return DashboardWidget.objects.filter(school=user_role.school).order_by('role', 'order')
        return DashboardWidget.objects.none()
    
    def perform_create(self, serializer):
        """Attach school automatically from user's role"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if user_role:
            serializer.save(school=user_role.school)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get all widgets configured for a specific role"""
        role = request.query_params.get('role')
        if not role:
            return Response({'error': 'role parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        widgets = DashboardWidget.objects.filter(
            school=user_role.school,
            role=role,
            is_enabled=True
        ).order_by('order')
        
        serializer = self.get_serializer(widgets, many=True)
        return Response(serializer.data)


class DashboardPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user-specific dashboard preferences.
    Each user has one DashboardPreference record.
    """
    serializer_class = DashboardPreferenceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter preferences - users can only see their own"""
        return DashboardPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create preference for current user"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        serializer.save(user=self.request.user, school=user_role.school if user_role else None)
    
    @action(detail=False, methods=['get'])
    def my_preference(self, request):
        """Get current user's dashboard preference"""
        try:
            preference = DashboardPreference.objects.get(user=request.user)
            serializer = self.get_serializer(preference)
            return Response(serializer.data)
        except DashboardPreference.DoesNotExist:
            return Response({'error': 'No preference found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def update_theme(self, request):
        """Quick update to theme setting"""
        theme = request.data.get('theme')
        if theme not in ['light', 'dark']:
            return Response({'error': 'Invalid theme'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            preference = DashboardPreference.objects.get(user=request.user)
            preference.theme = theme
            preference.save()
            return Response({'success': True, 'theme': theme})
        except DashboardPreference.DoesNotExist:
            return Response({'error': 'No preference found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def toggle_widget_visibility(self, request):
        """Toggle visibility of a specific widget"""
        widget_type = request.data.get('widget_type')
        if not widget_type:
            return Response({'error': 'widget_type required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            preference = DashboardPreference.objects.get(user=request.user)
            hidden = preference.hidden_widgets or []
            
            if widget_type in hidden:
                hidden.remove(widget_type)
            else:
                hidden.append(widget_type)
            
            preference.hidden_widgets = hidden
            preference.save()
            
            return Response({'hidden_widgets': hidden})
        except DashboardPreference.DoesNotExist:
            return Response({'error': 'No preference found'}, status=status.HTTP_404_NOT_FOUND)


class DashboardAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing dashboard alerts.
    Alerts can target specific roles or individual users.
    """
    serializer_class = DashboardAlertSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Get alerts relevant to the current user"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        
        # Get alerts for user's role or specific to user
        alerts = DashboardAlert.objects.filter(
            school=user_role.school if user_role else None
        ).filter(
            Q(target_role=user_role.role if user_role else None) | Q(target_user=self.request.user)
        ).order_by('-severity', '-created_at')
        
        return alerts
    
    def perform_create(self, serializer):
        """Create alert - only Bursars can do this"""
        user_role = UserRole.objects.filter(user=self.request.user).first()
        if not user_role or user_role.role != 'BURSAR':
            raise PermissionError('Only Bursars can create alerts')
        serializer.save(school=user_role.school)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark an alert as read"""
        alert = self.get_object()
        alert.is_read = True
        alert.read_at = timezone.now()
        alert.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss (hide) an alert"""
        alert = self.get_object()
        alert.is_dismissed = True
        alert.dismissed_at = timezone.now()
        alert.save()
        return Response({'success': True})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread alerts for current user"""
        user_role = UserRole.objects.filter(user=request.user).first()
        
        count = DashboardAlert.objects.filter(
            school=user_role.school if user_role else None,
            is_read=False,
            is_dismissed=False
        ).filter(
            Q(target_role=user_role.role if user_role else None) | Q(target_user=request.user)
        ).count()
        
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active (not dismissed) alerts"""
        user_role = UserRole.objects.filter(user=request.user).first()
        
        alerts = self.get_queryset().filter(is_dismissed=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)


class RoleDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving role-specific dashboard data.
    Aggregates statistics based on user's role.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def bursar_dashboard(self, request):
        """Get Bursar dashboard data with payment statistics"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role or user_role.role != 'BURSAR':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        service = BursarDashboardService(user_role.school)
        
        # Get school information
        school_info = {
            'id': user_role.school.id,
            'name': user_role.school.name,
            'address': user_role.school.address,
        }
        
        # Get other admins/bursars from the same school
        other_admins = UserRole.objects.filter(
            school=user_role.school,
            role__in=['BURSAR', 'ACCOUNTANT']
        ).exclude(user=request.user).values(
            'user__username',
            'user__first_name',
            'user__last_name',
            'user__email',
            'role'
        )
        
        return Response({
            'school': school_info,
            'school_admins': list(other_admins),
            'payment_summary': service.get_payment_summary(),
            'top_outstanding_students': service.get_top_outstanding_students(limit=5),
            'recent_payments': service.get_recent_payments(limit=10),
            'sms_stats': service.get_sms_stats(),
            'reconciliation_stats': service.get_reconciliation_stats(),
            'payment_methods_breakdown': service.get_payment_methods_breakdown(),
        })
    
    @action(detail=False, methods=['get'])
    def headmaster_dashboard(self, request):
        """Get Headmaster dashboard data with school overview"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role or user_role.role != 'HEADMASTER':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        service = HeadmasterDashboardService(user_role.school)
        
        # Get school information
        school_info = {
            'id': user_role.school.id,
            'name': user_role.school.name,
            'address': user_role.school.address,
        }
        
        # Get other admins from the same school (Bursars, Accountants, and Headmasters)
        other_admins = UserRole.objects.filter(
            school=user_role.school,
            role__in=['BURSAR', 'ACCOUNTANT', 'HEADMASTER']
        ).exclude(user=request.user).values(
            'user__username',
            'user__first_name',
            'user__last_name',
            'user__email',
            'role'
        )
        
        return Response({
            'school': school_info,
            'school_admins': list(other_admins),
            'school_overview': service.get_school_overview(),
            'class_performance': service.get_class_performance(),
            'payment_trends': service.get_payment_trends(),
            'teacher_insights': service.get_teacher_insights(),
            'alerts_summary': service.get_alerts_summary(),
        })
    
    @action(detail=False, methods=['get'])
    def teacher_dashboard(self, request):
        """Get Teacher dashboard data with class-level information"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role or user_role.role != 'TEACHER':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        service = TeacherDashboardService(request.user)
        
        class_overview = service.get_class_overview()
        if not class_overview:
            return Response({'error': 'No class assignment found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'class_overview': class_overview,
            'student_fee_status': service.get_student_fee_status(),
        })
    
    @action(detail=False, methods=['get'])
    def parent_dashboard(self, request):
        """Get Parent dashboard data with student fee information"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role or user_role.role != 'PARENT':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        service = ParentDashboardService(request.user)
        
        student_summary = service.get_student_summary()
        if not student_summary:
            return Response({'error': 'No student found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'student_summary': student_summary,
            'payment_history': service.get_payment_history(limit=5),
        })


class GlobalSearchViewSet(viewsets.ViewSet):
    """
    ViewSet for global search across Students, Payments, and Fee Structures.
    Query parameter 'q' or 'search' for search term.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Global search across all models"""
        query = request.query_params.get('q') or request.query_params.get('search')
        
        if not query or len(query.strip()) < 2:
            return Response({
                'error': 'Search query must be at least 2 characters',
                'results': {'students': [], 'payments': [], 'fees': []}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        search_service = GlobalSearchService(user_role.school)
        results = search_service.search_all(query, limit=10)
        
        return Response({
            'query': query,
            'results': results,
            'total_results': len(results['students']) + len(results['payments']) + len(results['fees'])
        })
    
    @action(detail=False, methods=['get'])
    def recent_searches(self, request):
        """Get recently searched items (simplified - just returns empty for now)"""
        # This would be stored in a separate model if needed
        return Response({'recent_searches': []})


class WidgetCustomizationViewSet(viewsets.ViewSet):
    """
    ViewSet for customizing dashboard widgets and layout.
    Allows users to:
    - Show/hide widgets
    - Reorder widgets
    - Apply layout presets
    - Update theme and notification settings
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user's widget configuration"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        config = service.export_configuration()
        
        return Response(config)
    
    @action(detail=False, methods=['get'])
    def get_widgets(self, request):
        """Get available widgets for user's role with customization applied"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        widgets = service.get_user_widget_configuration(user_role.role)
        
        return Response({
            'widgets': widgets,
            'role': user_role.role,
            'total': len(widgets),
            'visible': len([w for w in widgets if w['is_visible']])
        })
    
    @action(detail=False, methods=['post'])
    def toggle_widget(self, request):
        """Toggle visibility of a specific widget"""
        widget_type = request.data.get('widget_type')
        is_visible = request.data.get('is_visible', True)
        
        if not widget_type:
            return Response({'error': 'widget_type required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        service.update_widget_visibility(widget_type, is_visible)
        
        return Response({
            'success': True,
            'widget_type': widget_type,
            'is_visible': is_visible
        })
    
    @action(detail=False, methods=['post'])
    def reorder_widgets(self, request):
        """Update widget order"""
        widget_order = request.data.get('widget_order', [])
        
        if not widget_order or not isinstance(widget_order, list):
            return Response(
                {'error': 'widget_order must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            service = WidgetCustomizationService(request.user, user_role.school)
            service.update_widget_order(widget_order)
            
            return Response({
                'success': True,
                'widget_order': widget_order
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def update_theme(self, request):
        """Update theme preference"""
        theme = request.data.get('theme')
        
        if theme not in ['light', 'dark']:
            return Response(
                {'error': 'Theme must be light or dark'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        service.update_theme(theme)
        
        return Response({'success': True, 'theme': theme})
    
    @action(detail=False, methods=['post'])
    def update_columns(self, request):
        """Update layout columns"""
        columns = request.data.get('columns')
        
        if not isinstance(columns, int) or columns < 1 or columns > 4:
            return Response(
                {'error': 'Columns must be an integer between 1 and 4'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        service.update_layout_columns(columns)
        
        return Response({'success': True, 'columns': columns})
    
    @action(detail=False, methods=['post'])
    def apply_preset(self, request):
        """Apply a layout preset"""
        preset_name = request.data.get('preset')
        
        if preset_name not in WidgetLayoutService.get_available_presets():
            return Response(
                {
                    'error': f'Unknown preset. Available: {", ".join(WidgetLayoutService.get_available_presets())}',
                    'available_presets': WidgetLayoutService.get_available_presets()
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        WidgetLayoutService.apply_preset(request.user, user_role.school, preset_name)
        
        return Response({
            'success': True,
            'preset': preset_name,
            'message': f'Applied {preset_name} layout preset'
        })
    
    @action(detail=False, methods=['get'])
    def presets(self, request):
        """Get available layout presets"""
        return Response({
            'presets': WidgetLayoutService.get_available_presets(),
            'descriptions': {
                'compact': 'Compact layout (2 columns, fewer widgets)',
                'balanced': 'Balanced layout (3 columns, standard view)',
                'detailed': 'Detailed layout (4 columns, all widgets)',
                'focus': 'Focus layout (1 column, key metrics only)',
            }
        })
    
    @action(detail=False, methods=['post'])
    def reset(self, request):
        """Reset all customizations to defaults"""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        service = WidgetCustomizationService(request.user, user_role.school)
        service.reset_to_defaults()
        
        return Response({
            'success': True,
            'message': 'Dashboard reset to default configuration'
        })
    
    @action(detail=False, methods=['post'])
    def update_notifications(self, request):
        """Update notification settings"""
        show_notifications = request.data.get('show_notifications')
        frequency = request.data.get('frequency')
        
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            service = WidgetCustomizationService(request.user, user_role.school)
            service.update_notification_settings(show_notifications, frequency)
            
            return Response({
                'success': True,
                'show_notifications': show_notifications,
                'frequency': frequency
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AuditLogViewSet(viewsets.ViewSet):
    """ViewSet for audit log operations and compliance reporting"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Get audit logs with optional filters"""
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')
        action = request.query_params.get('action')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
            except ValueError:
                pass
        
        try:
            from .audit_service import AuditService
            
            logs = AuditService.get_audit_logs(
                entity_type=entity_type,
                entity_id=int(entity_id) if entity_id else None,
                action=action,
                start_date=start_date,
                end_date=end_date,
                limit=limit,
                offset=offset
            )
            
            total_count = AuditLog.objects.count()
            
            serializer = AuditLogSerializer(logs, many=True)
            
            return Response({
                'results': serializer.data,
                'total': total_count,
                'limit': limit,
                'offset': offset
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def entity_history(self, request):
        """Get complete history for a specific entity"""
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')
        
        if not entity_type or not entity_id:
            return Response({'error': 'entity_type and entity_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .audit_service import AuditService
            
            history = AuditService.get_entity_history(entity_type, int(entity_id))
            serializer = AuditLogSerializer(history, many=True)
            
            return Response(serializer.data)
        except ValueError:
            return Response({'error': 'Invalid entity_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Get user activity for compliance reporting"""
        user_id = request.query_params.get('user_id')
        days = int(request.query_params.get('days', 30))
        
        if not user_id:
            user_id = request.user.id
        
        try:
            user = User.objects.get(id=user_id)
            from .audit_service import AuditService
            
            activity = AuditService.get_user_activity(user, days=days)
            serializer = AuditLogSerializer(activity, many=True)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'days': days,
                'total_actions': len(activity),
                'logs': serializer.data
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get audit summary statistics"""
        entity_type = request.query_params.get('entity_type')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
            except ValueError:
                pass
        
        try:
            from .audit_service import AuditService, ComplianceService
            
            if entity_type:
                summary = AuditService.get_audit_summary(entity_type, start_date, end_date)
                return Response(summary)
            else:
                # Return system compliance report if no entity specified
                report = ComplianceService.get_system_compliance_report()
                return Response(report)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def compliance_report(self, request):
        """Generate compliance report for a user"""
        user_id = request.query_params.get('user_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not user_id:
            user_id = request.user.id
        
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
            except ValueError:
                pass
        
        try:
            user = User.objects.get(id=user_id)
            from .audit_service import ComplianceService
            
            report = ComplianceService.get_compliance_report(user, start_date, end_date)
            return Response(report)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search audit logs by query"""
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 50))
        
        if not query:
            return Response({'error': 'Query parameter "q" required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .audit_service import AuditService
            
            results = AuditService.search_audit_logs(query, limit)
            serializer = AuditLogSerializer(results, many=True)
            
            return Response({
                'query': query,
                'count': len(results),
                'results': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs to JSON or CSV"""
        entity_type = request.query_params.get('entity_type')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        format_type = request.query_params.get('format', 'json')
        
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
            except ValueError:
                pass
        
        try:
            from .audit_service import AuditService
            
            exported_data = AuditService.export_audit_logs(
                entity_type=entity_type,
                start_date=start_date,
                end_date=end_date,
                format=format_type
            )
            
            if format_type == 'csv':
                return Response({
                    'format': 'csv',
                    'data': exported_data,
                    'filename': f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                })
            else:
                return Response({
                    'format': 'json',
                    'data': json.loads(exported_data),
                    'filename': f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ActivityLogViewSet(viewsets.ViewSet):
    """ViewSet for activity logging and real-time school notifications."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def school_activity_feed(self, request):
        """Get activity feed for the user's school, role-filtered."""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        activity_type = request.query_params.get('activity_type')
        
        from .activity_service import ActivityLogger
        from .models import ActivityLog
        
        # Get filtered activity feed
        query = ActivityLog.objects.filter(
            school=user_role.school,
            visible_to_roles__contains=user_role.role
        )
        
        if activity_type:
            query = query.filter(activity_type=activity_type)
        
        activities = query.order_by('-created_at')[offset:offset + limit]
        total_count = query.count()
        
        from .serializers import ActivityLogSerializer
        serializer = ActivityLogSerializer(activities, many=True)
        
        return Response({
            'results': serializer.data,
            'total': total_count,
            'limit': limit,
            'offset': offset,
            'user_role': user_role.get_role_display(),
            'school': {
                'id': user_role.school.id,
                'name': user_role.school.name,
            }
        })
    
    @action(detail=False, methods=['get'])
    def activity_types(self, request):
        """Get available activity types."""
        from .models import ActivityLog
        
        return Response({
            'activity_types': [
                {'value': code, 'label': label}
                for code, label in ActivityLog.ACTIVITY_TYPES
            ]
        })
    
    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get most recent activities for dashboard."""
        user_role = UserRole.objects.filter(user=request.user).first()
        if not user_role:
            return Response({'error': 'User role not found'}, status=status.HTTP_404_NOT_FOUND)
        
        limit = int(request.query_params.get('limit', 10))
        
        from .models import ActivityLog
        
        activities = ActivityLog.objects.filter(
            school=user_role.school,
            visible_to_roles__contains=user_role.role
        ).order_by('-created_at')[:limit]
        
        from .serializers import ActivityLogSerializer
        serializer = ActivityLogSerializer(activities, many=True)
        
        return Response(serializer.data)



