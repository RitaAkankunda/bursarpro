"""B2-H4-D6D5: authenticated, school-scoped summary of recorded payments.

Recorded collections only; never imply invoiced tuition, bank settlement, or tuition due.
Read-only; real reversal execution stays off. No client-controlled school scope.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserRole
from .finance_reporting_export import recorded_payment_report


class RecordedCollectionsDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'head', 'options']

    def get(self, request):
        role = (UserRole.objects.filter(
            user=request.user, school__isnull=False,
            role__in=('BURSAR', 'HEADMASTER')
        ).values('school_id', 'role').first())
        if not role:
            return Response({'detail': 'Not authorized for financial reporting.'},
                            status=status.HTTP_403_FORBIDDEN)
        term_raw = request.query_params.get('term_id')
        if not term_raw or not term_raw.isdecimal() or len(term_raw) > 12:
            return Response({'detail': 'A valid term_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        term_id = int(term_raw)
        if term_id < 1:
            return Response({'detail': 'A valid term_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            report = recorded_payment_report(school_id=role['school_id'], term_id=term_id)
        except ValueError:
            # Avoid leaking audit findings and cross-school term existence.
            return Response({'detail': 'Report unavailable for this term. Verify school scope and financial consistency.'},
                            status=status.HTTP_400_BAD_REQUEST)
        # Do not return student IDs, receipt numbers or raw payment history to dashboard widgets.
        return Response({
            'school_id': role['school_id'], 'term_id': term_id,
            'gross_recorded': report['gross_recorded'],
            'reversed_recorded': report['reversed_recorded'],
            'net_recorded': report['net_recorded'],
            'payment_count': report['payment_count'],
            'scope': report['scope'], 'read_only': True,
        })
