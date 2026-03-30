"""
Advanced Reporting System - Models for scheduled reports, templates, and email delivery
"""
from django.db import models
from django.contrib.auth.models import User
from .models import School, Term


class ReportTemplate(models.Model):
    """Template for generating recurring reports"""
    REPORT_TYPES = [
        ('COLLECTION_SUMMARY', 'Collection Summary'),
        ('STUDENT_STATEMENTS', 'Student Statements'),
        ('PAYMENT_TRANSACTIONS', 'Payment Transactions'),
        ('COLLECTION_ANALYTICS', 'Collection Analytics'),
        ('OUTSTANDING_FEES', 'Outstanding Fees'),
        ('BUDGET_VS_ACTUAL', 'Budget vs Actual'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    
    # Report configuration
    email_recipients = models.TextField(help_text="Comma-separated emails")
    include_charts = models.BooleanField(default=True)
    include_summary = models.BooleanField(default=True)
    
    # Scheduling
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"


class ScheduledReport(models.Model):
    """Scheduled report execution"""
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='schedules')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    
    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    next_run = models.DateTimeField()
    last_run = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-next_run']
    
    def __str__(self):
        return f"{self.template.name} - {self.frequency}"


class ReportExecution(models.Model):
    """Record of report generation and delivery"""
    STATUS_CHOICES = [
        ('GENERATED', 'Generated'),
        ('EMAILED', 'Emailed'),
        ('FAILED', 'Failed'),
    ]
    
    scheduled_report = models.ForeignKey(ScheduledReport, on_delete=models.CASCADE, related_name='executions')
    
    # Execution details
    executed_at = models.DateTimeField(auto_now_add=True)
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='GENERATED')
    
    # Delivery info
    recipients = models.TextField(help_text="Comma-separated emails that received the report")
    error_message = models.TextField(null=True, blank=True)
    
    # File storage (URL or reference)
    file_url = models.URLField(null=True, blank=True)
    
    class Meta:
        ordering = ['-executed_at']
    
    def __str__(self):
        return f"{self.scheduled_report.template.name} - {self.executed_at}"


class ReportCustomization(models.Model):
    """User-defined custom reports with selected fields"""
    AVAILABLE_FIELDS = [
        'student_name',
        'student_id',
        'class_level',
        'expected_amount',
        'amount_paid',
        'outstanding',
        'payment_date',
        'payment_method',
        'receipt_number',
        'payment_status',
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=100)
    
    # Selected fields
    selected_fields = models.JSONField(default=list, help_text="List of fields to include in report")
    
    # Filters
    filters = models.JSONField(default=dict, help_text="Report filters (class_level, payment_status, date_range)")
    
    # Sorting
    sort_by = models.CharField(max_length=50, default='student_name')
    sort_order = models.CharField(max_length=10, choices=[('asc', 'Ascending'), ('desc', 'Descending')], default='asc')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"
