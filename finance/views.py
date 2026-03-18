from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment
from .serializers import (
    SchoolSerializer, ClassLevelSerializer, TermSerializer,
    FeeStructureSerializer, StudentSerializer, PaymentSerializer
)
from .utils import send_payment_sms, render_to_pdf
from django.http import HttpResponse


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]


class ClassLevelViewSet(viewsets.ModelViewSet):
    serializer_class = ClassLevelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ClassLevel.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Term.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = FeeStructure.objects.all()
        term_id = self.request.query_params.get('term_id')
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Student.objects.all()
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.select_related('student', 'term', 'recorded_by').all()
        student_id = self.request.query_params.get('student_id')
        term_id = self.request.query_params.get('term_id')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs.order_by('-payment_date')

    def perform_create(self, serializer):
        payment = serializer.save(recorded_by=self.request.user)
        # Send SMS notification to parent
        try:
            send_payment_sms(payment)
        except Exception:
            # SMS failure should not block the payment from being recorded
            pass

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
