from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment, UserRole, Notification, NotificationPreference
from .serializers import (
    SchoolSerializer, ClassLevelSerializer, TermSerializer,
    FeeStructureSerializer, StudentSerializer, PaymentSerializer,
    UserRegistrationSerializer, UserRoleSerializer, ParentPINSerializer,
    NotificationSerializer, NotificationPreferenceSerializer
)
from .permissions import IsBursar, BursarOrReadOnly
from .utils import send_payment_sms, render_to_pdf
from .notification_service import SMSService, EmailService
from .reports import ReportGenerator
from .bulk_payment_service import BulkPaymentProcessor, BulkPaymentError
from django.http import HttpResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime, timedelta
import csv


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
        # Auto-filter by user's school
        user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
        qs = ClassLevel.objects.filter(school_id__in=user_schools)
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Auto-filter by user's school
        user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
        qs = Term.objects.filter(school_id__in=user_schools)
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        qs = FeeStructure.objects.all()
        term_id = self.request.query_params.get('term_id')
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Auto-filter by user's school
        user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
        qs = Student.objects.filter(school_id__in=user_schools)
        school_id = self.request.query_params.get('school_id')
        class_level_id = self.request.query_params.get('class_level_id')
        search = self.request.query_params.get('search')

        if school_id:
            qs = qs.filter(school_id=school_id)
        if class_level_id:
            qs = qs.filter(class_level_id=class_level_id)
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(student_id__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        # Auto-assign student to user's school
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


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, BursarOrReadOnly]

    def get_queryset(self):
        # Auto-filter by user's school
        user_schools = School.objects.filter(created_by=self.request.user).values_list('id', flat=True)
        qs = Payment.objects.select_related('student', 'term', 'recorded_by').filter(student__school_id__in=user_schools)
        student_id = self.request.query_params.get('student_id')
        term_id = self.request.query_params.get('term_id')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs.order_by('-payment_date')

    def perform_create(self, serializer):
        payment = serializer.save(recorded_by=self.request.user)
        # Send SMS & Email notifications (SMS is the core Phase 6 feature)
        try:
            # Try the new SMS service first
            SMSService.send_payment_confirmation(payment, payment.student.parent_phone)
        except Exception as e:
            # Fallback to old method if new service fails
            try:
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


class HeadmasterDashboardViewSet(viewsets.ViewSet):
    """
    Headmaster dashboard with system-wide reports.
    - Headmasters see read-only reports across all schools
    - Shows collection analytics, unpaid students, payment trends
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get headmaster dashboard overview for all schools"""
        term_id = request.query_params.get('term_id')

        if not term_id:
            # Get current/latest term
            term = Term.objects.order_by('-end_date').first()
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

        # Get all schools
        schools = School.objects.all()
        
        # System-wide totals
        total_students = Student.objects.count()
        total_schools = schools.count()
        
        # Get all payments for this term
        payments = Payment.objects.filter(term=term)
        total_collected = float(payments.aggregate(total=Sum('amount'))['total'] or 0)
        
        # Get all fee structures for this term
        fee_structures = FeeStructure.objects.filter(term=term)
        total_expected = 0
        for fee in fee_structures:
            students_count = Student.objects.filter(class_level=fee.class_level).count()
            total_expected += float(fee.amount) * students_count
        
        total_outstanding = total_expected - total_collected
        
        # Students who paid this term
        paid_students = payments.values('student').distinct().count()
        unpaid_students = total_students - paid_students
        
        # Per-school breakdown
        schools_data = []
        for school in schools:
            school_students_count = Student.objects.filter(school=school).count()
            school_payments = payments.filter(student__school=school)
            school_collected = float(school_payments.aggregate(total=Sum('amount'))['total'] or 0)
            
            # School expected
            school_fees = fee_structures.filter(term__school=school)
            school_expected = 0
            for fee in school_fees:
                school_students_per_class = Student.objects.filter(
                    school=school,
                    class_level=fee.class_level
                ).count()
                school_expected += float(fee.amount) * school_students_per_class
            
            school_paid_students = school_payments.values('student').distinct().count()
            school_unpaid = school_students_count - school_paid_students
            school_rate = (school_collected / school_expected * 100) if school_expected > 0 else 0
            
            schools_data.append({
                'id': school.id,
                'name': school.name,
                'total_students': school_students_count,
                'students_with_payments': school_paid_students,
                'students_without_payments': school_unpaid,
                'total_collected': round(school_collected, 2),
                'total_expected': round(school_expected, 2),
                'total_outstanding': round(school_expected - school_collected, 2),
                'collection_rate_percent': round(school_rate, 1),
            })
        
        collection_rate = (total_collected / total_expected * 100) if total_expected > 0 else 0
        
        return Response({
            'term_id': term_id,
            'term_name': term.name,
            'total_schools': total_schools,
            'total_students': total_students,
            'students_with_payments': paid_students,
            'students_without_payments': unpaid_students,
            'total_expected': round(total_expected, 2),
            'total_collected': round(total_collected, 2),
            'total_outstanding': round(total_outstanding, 2),
            'collection_rate_percent': round(collection_rate, 1),
            'schools': schools_data,
        })




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
