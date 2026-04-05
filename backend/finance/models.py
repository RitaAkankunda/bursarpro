from django.db import models
from django.contrib.auth.models import User

class UserRole(models.Model):
    """
    Define roles in the system.
    Each user belongs to a school and has a role.
    """
    ROLE_CHOICES = [
        ('BURSAR', 'Bursar/Admin'),
        ('HEADMASTER', 'Headmaster'),
        ('TEACHER', 'Teacher'),
        ('PARENT', 'Parent'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='role')
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='BURSAR')
    
    # For parent/student roles to link to a specific student
    student = models.ForeignKey('Student', on_delete=models.CASCADE, null=True, blank=True, related_name='parents_and_students')
    
    # PIN for parent login (4-6 digit code)
    pin_code = models.CharField(max_length=10, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} ({self.school.name if self.school else 'N/A'})"

class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schools', null=True, blank=True)
    # School-specific student ID format (e.g., "STU0001", "A001", "2024-001", etc.)
    # Leave empty for free-form entry, or set a pattern for reference (no validation applied)
    student_id_format = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Example: STU0001, A001, 2024-001. This is for documentation only - actual IDs are entered freely."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ClassLevel(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=50) # e.g. "Primary 1", "Senior 1"
    
    def __str__(self):
        return f"{self.school.name} - {self.name}"

class Term(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50) # e.g. "Term 1 2026"
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.school.name} - {self.name}"

class FeeStructure(models.Model):
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_structures')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='fee_structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2) # Max 10 digits, e.g. 99,999,999.99

    def __str__(self):
        return f"{self.class_level.name} ({self.term.name}) - UGX {self.amount}"

class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.SET_NULL, null=True, related_name='students')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=50, unique=True) # Custom Registration Number
    parent_name = models.CharField(max_length=255)
    parent_phone = models.CharField(max_length=20) # Important for SMS

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    receipt_number = models.CharField(max_length=50, unique=True)
    
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.student.first_name} - UGX {self.amount}"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payment_records')

    def __str__(self):
        return f'Receipt {self.receipt_number} - {self.student.first_name} {self.student.last_name} ({self.amount})'


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('PAYMENT_CONFIRMATION', 'Payment Confirmation'),
        ('OUTSTANDING_FEES', 'Outstanding Fees Alert'),
        ('REPORT_GENERATED', 'Report Generated'),
        ('SYSTEM_ALERT', 'System Alert'),
    ]
    
    CHANNEL_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('IN_APP', 'In-App'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('DELIVERED', 'Delivered'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='SMS')
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    recipient = models.CharField(max_length=255)  # Phone or email
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_id = models.CharField(max_length=255, blank=True, null=True)  # ID from SMS/Email provider
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.get_notification_type_display()} - {self.recipient}'


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    payment_sms = models.BooleanField(default=True)
    payment_email = models.BooleanField(default=True)
    outstanding_fees_email = models.BooleanField(default=True)
    weekly_summary_email = models.BooleanField(default=False)
    report_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'Notification preferences for {self.user.username}'


# Enhanced Parent Portal Models
class ParentMessage(models.Model):
    """
    Bidirectional messaging between parents and school staff.
    """
    MESSAGE_TYPE_CHOICES = [
        ('GENERAL', 'General Inquiry'),
        ('FEES', 'Fees Related'),
        ('PAYMENT', 'Payment Issue'),
        ('STUDENT', 'Student Related'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('UNREAD', 'Unread'),
        ('READ', 'Read'),
        ('REPLIED', 'Replied'),
        ('RESOLVED', 'Resolved'),
    ]
    
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='parent_messages')
    sender_role = models.CharField(max_length=10, choices=[('PARENT', 'Parent'), ('SCHOOL', 'School')])
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_messages')
    
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='GENERAL')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNREAD')
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        sender_name = 'Parent' if self.sender_role == 'PARENT' else 'School'
        return f'{sender_name} - {self.subject} ({self.student.first_name})'


class PaymentAlert(models.Model):
    """
    Track outstanding fee alerts sent to parents.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
    ]
    
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='payment_alerts')
    term = models.ForeignKey('Term', on_delete=models.CASCADE, related_name='alerts')
    
    outstanding_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    sent_via_sms = models.BooleanField(default=True)
    sent_via_email = models.BooleanField(default=False)
    
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Alert: {self.student.first_name} - UGX {self.outstanding_amount} ({self.status})'


# Payment Reconciliation Models
class BankStatement(models.Model):
    """
    Track uploaded bank statements for reconciliation.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('PROCESSING', 'Processing'),
        ('RECONCILED', 'Fully Reconciled'),
        ('PARTIAL', 'Partially Reconciled'),
        ('FAILED', 'Reconciliation Failed'),
    ]
    
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='bank_statements')
    term = models.ForeignKey('Term', on_delete=models.CASCADE, related_name='bank_statements')
    
    statement_date = models.DateField()  # Bank statement period date
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='bank_statements/')
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = models.IntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_statements')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-statement_date']
    
    def __str__(self):
        return f'{self.school.name} - {self.statement_date} ({self.get_status_display()})'


class PaymentReconciliation(models.Model):
    """
    Match bank statement transactions with recorded payments.
    """
    STATUS_CHOICES = [
        ('UNMATCHED', 'Unmatched'),
        ('MATCHED', 'Matched'),
        ('MANUAL_MATCHED', 'Manually Matched'),
        ('DISPUTED', 'Disputed'),
    ]
    
    bank_statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='reconciliations')
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='reconciliation', null=True, blank=True)
    
    # Bank transaction details
    bank_transaction_id = models.CharField(max_length=255, unique=True)
    bank_amount = models.DecimalField(max_digits=12, decimal_places=2)
    bank_date = models.DateField()
    bank_reference = models.CharField(max_length=255, blank=True)
    bank_description = models.TextField(blank=True)
    
    # Matched payment details
    matched_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    amount_difference = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNMATCHED')
    confidence_score = models.FloatField(default=0)  # 0-100: matching confidence
    
    matched_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reconciliations_matched')
    matched_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-bank_date']
    
    def __str__(self):
        status_text = f'({self.get_status_display()})' if self.status != 'MATCHED' else ''
        return f'{self.bank_transaction_id} - UGX {self.bank_amount} {status_text}'


class ReconciliationDiscrepancy(models.Model):
    """
    Track discrepancies found during reconciliation process.
    """
    DISCREPANCY_TYPE_CHOICES = [
        ('AMOUNT_MISMATCH', 'Amount Mismatch'),
        ('DATE_MISMATCH', 'Date Mismatch'),
        ('MISSING_PAYMENT', 'Missing Payment Record'),
        ('DUPLICATE_TRANSACTION', 'Duplicate Transaction'),
        ('UNKNOWN_SENDER', 'Unknown Sender'),
        ('LATE_DEPOSIT', 'Late Deposit'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    reconciliation = models.ForeignKey(PaymentReconciliation, on_delete=models.CASCADE, related_name='discrepancies')
    
    discrepancy_type = models.CharField(max_length=30, choices=DISCREPANCY_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    
    description = models.TextField()
    suggested_action = models.TextField(blank=True)
    
    is_resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-severity', '-created_at']
    
    def __str__(self):
        return f'{self.get_discrepancy_type_display()} - {self.get_severity_display()}'


# SMS Reminder Models
class SMSReminderConfiguration(models.Model):
    """
    Configure automatic SMS reminders for payment deadlines.
    """
    TRIGGER_TYPE_CHOICES = [
        ('DAYS_BEFORE', 'Days Before Due Date'),
        ('OVERDUE', 'Payment Overdue'),
        ('SPECIFIC_DATE', 'Specific Date'),
    ]
    
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='sms_reminder_config')
    
    # Enable/disable reminders globally
    is_enabled = models.BooleanField(default=True)
    
    # Trigger rules
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPE_CHOICES, default='DAYS_BEFORE')
    days_before_due = models.IntegerField(default=3, help_text='Send reminder this many days before due date')
    max_daily_reminders = models.IntegerField(default=500, help_text='Maximum SMS to send per day')
    
    # Message template
    message_template = models.TextField(
        default='Dear {student_name}, payment of UGX {amount} for {term_name} is due on {due_date}. Please pay to avoid penalties.',
        help_text='Use {student_name}, {parent_name}, {amount}, {term_name}, {due_date} as placeholders'
    )
    
    # Scheduling
    send_time = models.TimeField(default='08:00', help_text='Time to send reminders (HH:MM format)')
    send_days = models.CharField(
        max_length=50, 
        default='1,2,3,4,5',
        help_text='Comma-separated day numbers: 1=Monday, 2=Tuesday, ..., 7=Sunday'
    )
    
    # Cost tracking
    sms_cost_per_unit = models.DecimalField(max_digits=8, decimal_places=2, default=200, help_text='Cost in UGX per SMS')
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=50000)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "SMS Reminder Configurations"
    
    def __str__(self):
        return f'{self.school.name} - SMS Reminder Config'


class SMSReminder(models.Model):
    """
    Track individual SMS reminders scheduled for students.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SCHEDULED', 'Scheduled'),
        ('SENT', 'Sent Successfully'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sms_reminders')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sms_reminders')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='sms_reminders')
    
    # Reference to parent phone (or student's registered phone)
    recipient_phone = models.CharField(max_length=20)
    recipient_type = models.CharField(max_length=10, choices=[('PARENT', 'Parent'), ('STUDENT', 'Student')], default='PARENT')
    
    # Outstanding amount and due date
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    
    # Message and status
    message_content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Scheduling
    scheduled_send_time = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_send_time']
    
    def __str__(self):
        return f'SMS Reminder - {self.student.first_name} ({self.status})'


class SMSReminderHistory(models.Model):
    """
    Log of all SMS reminders sent (for audit and cost tracking).
    """
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sms_history')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sms_history')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='sms_history')
    
    recipient_phone = models.CharField(max_length=20)
    recipient_type = models.CharField(max_length=10, choices=[('PARENT', 'Parent'), ('STUDENT', 'Student')])
    
    message_sent = models.TextField()
    amount_reminded = models.DecimalField(max_digits=12, decimal_places=2)
    
    # SMS Gateway response
    sms_gateway_response = models.CharField(max_length=50, default='PENDING')
    gateway_message_id = models.CharField(max_length=100, blank=True)
    
    # Cost
    cost = models.DecimalField(max_digits=8, decimal_places=2, default=200)
    
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-sent_at']
        verbose_name_plural = "SMS Reminder Histories"
    
    def __str__(self):
        return f'SMS to {self.recipient_phone} - {self.sent_at.strftime("%Y-%m-%d %H:%M")}'


class SMSReminderTemplate(models.Model):
    """
    Store reusable SMS reminder message templates.
    """
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sms_templates')
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    message_template = models.TextField(
        help_text='Use {student_name}, {parent_name}, {amount}, {term_name}, {due_date} as placeholders'
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.school.name} - {self.name}'


# Role-based Dashboard Models
class DashboardWidget(models.Model):
    """
    Configure which widgets appear on dashboards for different roles.
    """
    ROLE_CHOICES = [
        ('BURSAR', 'Bursar'),
        ('HEADMASTER', 'Headmaster'),
        ('TEACHER', 'Teacher'),
        ('PARENT', 'Parent'),
    ]
    
    WIDGET_CHOICES = [
        ('payment_summary', 'Payment Summary'),
        ('outstanding_fees', 'Outstanding Fees'),
        ('recent_payments', 'Recent Payments'),
        ('class_performance', 'Class Performance'),
        ('student_roster', 'Student Roster'),
        ('attendance_overview', 'Attendance Overview'),
        ('fee_breakdown', 'Fee Breakdown'),
        ('sms_reminders_stats', 'SMS Reminders Statistics'),
        ('bank_reconciliation', 'Bank Reconciliation'),
        ('payment_methods', 'Payment Methods'),
        ('payment_analytics', 'Payment Analytics'),
        ('top_students', 'Top Outstanding Students'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='dashboard_widgets')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    widget_type = models.CharField(max_length=50, choices=WIDGET_CHOICES)
    
    is_enabled = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text='Display order on dashboard')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('school', 'role', 'widget_type')
        ordering = ['role', 'order']
    
    def __str__(self):
        return f'{self.school.name} - {self.get_role_display()} - {self.get_widget_type_display()}'


class DashboardPreference(models.Model):
    """
    Store user preferences for their dashboard.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_preference')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='user_preferences')
    
    # Layout preferences
    theme = models.CharField(
        max_length=20,
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light'
    )
    columns = models.IntegerField(default=3, help_text='Number of columns for dashboard grid')
    
    # Widget visibility
    hidden_widgets = models.JSONField(
        default=list,
        help_text='List of widget IDs that user has hidden'
    )
    widget_order = models.JSONField(
        default=list,
        help_text='Custom widget ordering'
    )
    
    # Notification preferences
    show_notifications = models.BooleanField(default=True)
    notification_frequency = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('daily', 'Daily Digest'),
            ('weekly', 'Weekly Digest')
        ],
        default='daily'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Dashboard Preferences"
    
    def __str__(self):
        return f'{self.user.username} - Dashboard Preferences'


class ActivityLog(models.Model):
    """
    Track all activities within a school for auditing and real-time notifications.
    """
    ACTIVITY_TYPES = [
        ('PAYMENT', 'Payment Recorded'),
        ('REFUND', 'Refund Processed'),
        ('STUDENT_CREATED', 'Student Created'),
        ('STUDENT_UPDATED', 'Student Updated'),
        ('FEE_UPDATED', 'Fee Updated'),
        ('SMS_SENT', 'SMS Reminder Sent'),
        ('TERM_CREATED', 'Term Created'),
        ('RECONCILIATION', 'Bank Reconciliation'),
        ('ALERT_GENERATED', 'Payment Alert'),
        ('USER_LOGIN', 'User Login'),
        ('REPORT_GENERATED', 'Report Generated'),
        ('OTHER', 'Other Activity'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='activity_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activities')
    
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255, help_text='Short title of the activity')
    description = models.TextField(blank=True, help_text='Detailed description')
    
    # Related objects for context
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    
    # For role-based filtering
    visible_to_roles = models.JSONField(
        default=list,
        help_text='List of roles that can see this activity (e.g., ["BURSAR", "HEADMASTER"])'
    )
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context data as JSON'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', '-created_at']),
            models.Index(fields=['school', 'activity_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.school.name} - {self.get_activity_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class DashboardAlert(models.Model):
    """
    Dashboard alerts for important system events.
    """
    ALERT_TYPE_CHOICES = [
        ('PAYMENT_OVERDUE', 'Payment Overdue'),
        ('BUDGET_EXCEEDED', 'Budget Exceeded'),
        ('RECONCILIATION_MISMATCH', 'Reconciliation Mismatch'),
        ('SMS_BUDGET_LOW', 'SMS Budget Low'),
        ('SYSTEM_ERROR', 'System Error'),
        ('INFO', 'Information'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='dashboard_alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Target information
    target_role = models.CharField(
        max_length=20,
        choices=[('BURSAR', 'Bursar'), ('HEADMASTER', 'Headmaster'), ('TEACHER', 'Teacher'), ('PARENT', 'Parent')],
        null=True,
        blank=True
    )
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='dashboard_alerts')
    
    # Action URL
    action_url = models.CharField(max_length=500, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-severity', '-created_at']
    
    def __str__(self):
        return f'{self.title} ({self.get_severity_display()})'




# Import additional models for Phase 8
try:
    from .reporting_models import ReportTemplate, ScheduledReport, ReportExecution, ReportCustomization
    from .analytics_models import PaymentAnalytic, PaymentForecast, PaymentMethodTrend
    from .currency_models import Currency, ExchangeRate, SchoolCurrency, MultiCurrencyPayment
    from .refund_models import Refund, PaymentReversal, RefundNotification, AuditLog
except ImportError:
    # Models may not be imported if files not created yet
    pass

# Import services for Phase 8
try:
    from .refund_service import RefundService
    from .reporting_service import ReportingService, EmailService
    from .currency_service import CurrencyService
    from .analytics_service import AnalyticsService
except ImportError:
    # Services may not be available yet
    pass
