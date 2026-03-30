

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
