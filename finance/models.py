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
        ('ACCOUNTANT', 'Accountant'),
        ('TEACHER', 'Teacher'),
        ('PARENT', 'Parent'),
        ('STUDENT', 'Student'),
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

