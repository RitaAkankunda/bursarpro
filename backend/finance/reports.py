# Report generation module for PDF exports
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime, timedelta
from django.db.models import Sum
from .models import Payment, Student, Term, FeeStructure, School


class ReportGenerator:
    """Generates PDF reports for fees collection"""
    
    @staticmethod
    def create_pdf_response(pdf_buffer, filename):
        """Helper to create HttpResponse from PDF buffer"""
        from django.http import HttpResponse
        pdf_buffer.seek(0)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    @staticmethod
    def generate_collection_summary(school, term):
        """Generate collection summary report"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Collection Summary Report", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get collection data
        students = Student.objects.filter(school=school)
        payments = Payment.objects.filter(term=term, student__school=school)
        fee_structures = FeeStructure.objects.filter(term=term)
        
        total_students = students.count()
        total_collected = float(payments.aggregate(total=Sum('amount'))['total'] or 0)
        
        # Calculate total expected
        total_expected = 0
        for fee in fee_structures:
            count = students.filter(class_level=fee.class_level).count()
            total_expected += float(fee.amount) * count
        
        total_outstanding = total_expected - total_collected
        paid_students = payments.values('student').distinct().count()
        
        # Summary table
        summary_data = [
            ['Metric', 'Value'],
            ['Total Students', str(total_students)],
            ['Students with Payments', str(paid_students)],
            ['Students without Payments', str(total_students - paid_students)],
            ['Total Expected (KES)', f"{total_expected:,.2f}"],
            ['Total Collected (KES)', f"{total_collected:,.2f}"],
            ['Total Outstanding (KES)', f"{total_outstanding:,.2f}"],
            ['Collection Rate (%)', f"{(total_collected/total_expected*100) if total_expected > 0 else 0:.1f}%"],
        ]
        
        summary_table = Table(summary_data, colWidths=[3.5*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        
        # Build PDF
        doc.build(elements)
        return buffer
    
    @staticmethod
    def generate_student_statements(school, term):
        """Generate individual student payment statements"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Student Fee Statements", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get all students and their data
        students = Student.objects.filter(school=school).select_related('class_level')
        fee_structures = FeeStructure.objects.filter(term=term)
        
        data = [['Student Name', 'Class', 'Expected Fee', 'Amount Paid', 'Outstanding', 'Status']]
        
        for student in students:
            fee = fee_structures.filter(class_level=student.class_level).first()
            if not fee:
                continue
            
            payments = Payment.objects.filter(student=student, term=term)
            paid = float(payments.aggregate(total=Sum('amount'))['total'] or 0)
            expected = float(fee.amount)
            outstanding = expected - paid
            status = 'Fully Paid' if outstanding <= 0 else 'Partial' if paid > 0 else 'Unpaid'
            
            data.append([
                f"{student.first_name} {student.last_name}",
                student.class_level.name,
                f"{expected:,.2f}",
                f"{paid:,.2f}",
                f"{outstanding:,.2f}",
                status
            ])
        
        table = Table(data, colWidths=[1.8*inch, 0.8*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(table)
        
        doc.build(elements)
        return buffer
    
    @staticmethod
    def generate_payment_transactions(school, term):
        """Generate detailed payment transaction log"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Payment Transactions Report", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get all payments
        payments = Payment.objects.filter(
            term=term,
            student__school=school
        ).select_related('student', 'recorded_by').order_by('-payment_date')
        
        data = [['Receipt #', 'Student', 'Amount', 'Date', 'Recorded By']]
        
        for payment in payments:
            data.append([
                payment.receipt_number,
                f"{payment.student.first_name} {payment.student.last_name}",
                f"{payment.amount:,.2f}",
                payment.payment_date.strftime('%Y-%m-%d'),
                payment.recorded_by.username,
            ])
        
        if len(data) == 1:
            elements.append(Paragraph("No transactions recorded.", styles['Normal']))
        else:
            table = Table(data, colWidths=[1.5*inch, 2*inch, 1.2*inch, 1.2*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            elements.append(table)
        
        doc.build(elements)
        return buffer
    
    @staticmethod
    def generate_collection_analytics(school, term):
        """Generate collection analytics and trends"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Collection Analytics Report", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get collection data by class
        students = Student.objects.filter(school=school)
        payments = Payment.objects.filter(term=term, student__school=school)
        fee_structures = FeeStructure.objects.filter(term=term)
        
        data = [['Class', 'Count', 'Expected', 'Collected', 'Outstanding', 'Rate (%)']]
        
        for fee in fee_structures:
            class_students = students.filter(class_level=fee.class_level)
            count = class_students.count()
            if count == 0:
                continue
            
            class_payments = payments.filter(student__class_level=fee.class_level)
            collected = float(class_payments.aggregate(total=Sum('amount'))['total'] or 0)
            expected = float(fee.amount) * count
            outstanding = expected - collected
            rate = (collected / expected * 100) if expected > 0 else 0
            
            data.append([
                fee.class_level.name,
                str(count),
                f"{expected:,.2f}",
                f"{collected:,.2f}",
                f"{outstanding:,.2f}",
                f"{rate:.1f}%"
            ])
        
        table = Table(data, colWidths=[1.5*inch, 1*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(table)
        
        doc.build(elements)
        return buffer
    
    @staticmethod
    def generate_outstanding_fees(school, term):
        """Generate report of students with outstanding fees"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#e31937'),  # Red for outstanding
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Outstanding Fees Report", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get students with outstanding fees
        students = Student.objects.filter(school=school).select_related('class_level')
        payments = Payment.objects.filter(term=term, student__school=school)
        fee_structures = FeeStructure.objects.filter(term=term)
        
        data = [['Student Name', 'Class', 'Expected', 'Paid', 'Outstanding', 'Contact']]
        
        for student in students:
            fee = fee_structures.filter(class_level=student.class_level).first()
            if not fee:
                continue
            
            paid = float(payments.filter(student=student).aggregate(total=Sum('amount'))['total'] or 0)
            expected = float(fee.amount)
            outstanding = expected - paid
            
            if outstanding > 0:  # Only show those with outstanding fees
                data.append([
                    f"{student.first_name} {student.last_name}",
                    student.class_level.name,
                    f"{expected:,.2f}",
                    f"{paid:,.2f}",
                    f"{outstanding:,.2f}",
                    student.parent_phone or "N/A"
                ])
        
        if len(data) == 1:
            elements.append(Paragraph("No outstanding fees - all students paid up!", styles['Normal']))
        else:
            # Sort by outstanding amount (highest first)
            data[1:] = sorted(data[1:], key=lambda x: float(x[4].replace(',', '')), reverse=True)
            
            table = Table(data, colWidths=[1.8*inch, 1*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e31937')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            elements.append(table)
        
        doc.build(elements)
        return buffer
    
    @staticmethod
    def generate_budget_vs_actual(school, term):
        """Generate budget vs actual collection report by class"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
        )
        elements.append(Paragraph(f"Budget vs Actual Report", title_style))
        elements.append(Paragraph(f"School: {school.name} | Term: {term.name}", styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))
        
        # Get class-wise budget vs actual
        students = Student.objects.filter(school=school)
        payments = Payment.objects.filter(term=term, student__school=school)
        fee_structures = FeeStructure.objects.filter(term=term)
        
        data = [['Class', 'Students', 'Budgeted Amount', 'Actual Collection', 'Variance', 'Variance %']]
        
        total_budget = 0
        total_actual = 0
        
        for fee in fee_structures:
            class_students = students.filter(class_level=fee.class_level)
            count = class_students.count()
            if count == 0:
                continue
            
            budgeted = float(fee.amount) * count
            actual = float(payments.filter(student__class_level=fee.class_level).aggregate(total=Sum('amount'))['total'] or 0)
            variance = actual - budgeted
            variance_pct = (variance / budgeted * 100) if budgeted > 0 else 0
            
            total_budget += budgeted
            total_actual += actual
            
            data.append([
                fee.class_level.name,
                str(count),
                f"{budgeted:,.2f}",
                f"{actual:,.2f}",
                f"{variance:,.2f}",
                f"{variance_pct:.1f}%"
            ])
        
        # Add totals row
        total_variance = total_actual - total_budget
        total_variance_pct = (total_variance / total_budget * 100) if total_budget > 0 else 0
        data.append([
            'TOTAL',
            '',
            f"{total_budget:,.2f}",
            f"{total_actual:,.2f}",
            f"{total_variance:,.2f}",
            f"{total_variance_pct:.1f}%"
        ])
        
        table = Table(data, colWidths=[1.2*inch, 0.8*inch, 1.5*inch, 1.5*inch, 1.2*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d1d5db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(table)
        
        doc.build(elements)
        return buffer
