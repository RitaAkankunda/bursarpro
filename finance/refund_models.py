"""
Refund and Payment Reversal System Models
"""
from django.db import models
from django.contrib.auth.models import User
from .models import Payment


class Refund(models.Model):
    """Payment refund record"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    REASON_CHOICES = [
        ('DUPLICATE', 'Duplicate Payment'),
        ('OVERPAYMENT', 'Overpayment'),
        ('PAYMENT_ERROR', 'Payment Error'),
        ('STUDENT_REQUEST', 'Student Request'),
        ('POLICY', 'School Policy'),
        ('OTHER', 'Other'),
    ]
    
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='refunds')
    
    # Refund details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField()
    
    # Refund method
    refund_method = models.CharField(
        max_length=20,
        choices=[
            ('BANK_TRANSFER', 'Bank Transfer'),
            ('MOBILE_MONEY', 'Mobile Money'),
            ('CASH', 'Cash'),
            ('CREDIT', 'Account Credit'),
        ]
    )
    refund_destination = models.CharField(max_length=255, blank=True)  # Account/phone/details
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='refund_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_refunds')
    
    # Dates
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    notes = models.TextField(blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Refund {self.id} - {self.payment.id} - {self.amount}"


class PaymentReversal(models.Model):
    """Complete payment reversal (removes payment from system)"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REVERSED', 'Reversed'),
        ('FAILED', 'Failed'),
    ]
    
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='reversal')
    
    # Reason for reversal
    reason = models.TextField()
    description = models.TextField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reversal_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reversals')
    
    # Original payment backup
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    original_receipt = models.CharField(max_length=100)
    
    # Dates
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    reversed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit trail
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Reversal {self.id} - Payment {self.payment.id}"


class RefundNotification(models.Model):
    """Track refund notifications sent to parents"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    refund = models.ForeignKey(Refund, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification details
    recipient_phone = models.CharField(max_length=20)
    recipient_email = models.EmailField(blank=True)
    
    notification_type = models.CharField(
        max_length=20,
        choices=[
            ('INITIATION', 'Refund Initiated'),
            ('APPROVAL', 'Refund Approved'),
            ('COMPLETION', 'Refund Completed'),
            ('REJECTION', 'Refund Rejected'),
        ]
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Notification {self.id} - Refund {self.refund.id}"


class AuditLog(models.Model):
    """Audit trail for all refunds and reversals"""
    ACTION_TYPES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('APPROVE', 'Approved'),
        ('REJECT', 'Rejected'),
        ('PROCESS', 'Processed'),
        ('COMPLETE', 'Completed'),
        ('FAIL', 'Failed'),
    ]
    
    # Log details
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=20, choices=[
        ('REFUND', 'Refund'), 
        ('REVERSAL', 'Reversal'),
        ('PAYMENT', 'Payment'),
        ('STUDENT', 'Student'),
        ('USER', 'User')
    ])
    entity_id = models.IntegerField()
    
    # Who did it
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # What changed
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    
    # Additional info
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Audit Logs"
    
    def __str__(self):
        return f"{self.action} - {self.entity_type} {self.entity_id} - {self.timestamp}"
