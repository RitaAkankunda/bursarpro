"""
Refund and Reversal Service
"""
from django.db import transaction
from datetime import datetime
from django.contrib.auth.models import User
from .models import Payment
from .refund_models import Refund, PaymentReversal, RefundNotification, AuditLog
from .notification_service import SMSService, EmailService


class RefundService:
    """Service for handling refunds and reversals"""
    
    @staticmethod
    @transaction.atomic
    def create_refund_request(payment, amount, reason, description, refund_method, requested_by):
        """Create a new refund request"""
        
        # Validate amount
        if amount <= 0 or amount > payment.amount:
            raise ValueError("Refund amount must be between 0 and payment amount")
        
        # Create refund
        refund = Refund.objects.create(
            payment=payment,
            amount=amount,
            reason=reason,
            description=description,
            refund_method=refund_method,
            status='PENDING',
            requested_by=requested_by
        )
        
        # Log action
        AuditLog.objects.create(
            action='CREATE',
            entity_type='REFUND',
            entity_id=refund.id,
            performed_by=requested_by,
            new_values={'amount': str(amount), 'reason': reason},
            description=f"Refund requested for payment {payment.id}"
        )
        
        # Send SMS to parent
        try:
            message = f"Refund of {amount} KES requested for student {payment.student.student_id}. Status: Pending approval."
            SMSService.send_sms(payment.student.parent_phone, message)
        except Exception as e:
            print(f"Failed to send refund SMS: {str(e)}")
        
        return refund
    
    @staticmethod
    @transaction.atomic
    def approve_refund(refund, approved_by, notes=""):
        """Approve a refund request"""
        
        refund.status = 'APPROVED'
        refund.approved_by = approved_by
        refund.approved_at = datetime.now()
        refund.notes = notes
        refund.save()
        
        # Log action
        AuditLog.objects.create(
            action='APPROVE',
            entity_type='REFUND',
            entity_id=refund.id,
            performed_by=approved_by,
            old_values={'status': 'PENDING'},
            new_values={'status': 'APPROVED'},
            description=f"Refund approved by {approved_by.username}"
        )
        
        # Send notification
        RefundService._send_refund_notification(
            refund,
            'APPROVAL',
            f"Your refund of {refund.amount} KES has been approved and will be processed within 5-7 business days."
        )
        
        return refund
    
    @staticmethod
    @transaction.atomic
    def reject_refund(refund, rejected_by, reason):
        """Reject a refund request"""
        
        refund.status = 'REJECTED'
        refund.notes = reason
        refund.save()
        
        # Log action
        AuditLog.objects.create(
            action='REJECT',
            entity_type='REFUND',
            entity_id=refund.id,
            performed_by=rejected_by,
            new_values={'status': 'REJECTED', 'reason': reason},
            description=f"Refund rejected: {reason}"
        )
        
        # Send notification
        RefundService._send_refund_notification(
            refund,
            'REJECTION',
            f"Your refund request has been rejected. Reason: {reason}"
        )
        
        return refund
    
    @staticmethod
    @transaction.atomic
    def process_refund(refund, processed_by):
        """Process approved refund (mark as completed)"""
        
        refund.status = 'COMPLETED'
        refund.completed_at = datetime.now()
        refund.save()
        
        # Log action
        AuditLog.objects.create(
            action='COMPLETE',
            entity_type='REFUND',
            entity_id=refund.id,
            performed_by=processed_by,
            new_values={'status': 'COMPLETED'},
            description="Refund processed and sent"
        )
        
        # Send notification
        RefundService._send_refund_notification(
            refund,
            'COMPLETION',
            f"Your refund of {refund.amount} KES has been completed. Please allow 2-3 days for it to appear in your account."
        )
        
        return refund
    
    @staticmethod
    @transaction.atomic
    def create_reversal(payment, reason, reversed_by):
        """Create a payment reversal (complete removal)"""
        
        if PaymentReversal.objects.filter(payment=payment).exists():
            raise ValueError("Payment already has an active reversal request")
        
        reversal = PaymentReversal.objects.create(
            payment=payment,
            reason=reason,
            description=f"Reversal requested for {payment.receipt_number}",
            status='PENDING',
            requested_by=reversed_by,
            original_amount=payment.amount,
            original_receipt=payment.receipt_number
        )
        
        # Log action
        AuditLog.objects.create(
            action='CREATE',
            entity_type='REVERSAL',
            entity_id=reversal.id,
            performed_by=reversed_by,
            new_values={'payment_id': payment.id, 'amount': str(payment.amount)},
            description=f"Payment reversal requested for {payment.receipt_number}"
        )
        
        return reversal
    
    @staticmethod
    @transaction.atomic
    def approve_reversal(reversal, approved_by):
        """Approve a payment reversal"""
        
        reversal.status = 'APPROVED'
        reversal.approved_by = approved_by
        reversal.approved_at = datetime.now()
        reversal.save()
        
        # Log action
        AuditLog.objects.create(
            action='APPROVE',
            entity_type='REVERSAL',
            entity_id=reversal.id,
            performed_by=approved_by,
            new_values={'status': 'APPROVED'},
            description="Payment reversal approved"
        )
        
        return reversal
    
    @staticmethod
    @transaction.atomic
    def execute_reversal(reversal, executed_by):
        """Execute the actual reversal (delete payment from system)"""
        
        # Store payment data for audit
        payment = reversal.payment
        reversal.status = 'REVERSED'
        reversal.reversed_at = datetime.now()
        reversal.save()
        
        # Log action BEFORE deleting payment
        AuditLog.objects.create(
            action='COMPLETE',
            entity_type='REVERSAL',
            entity_id=reversal.id,
            performed_by=executed_by,
            old_values={
                'payment_id': payment.id,
                'amount': str(payment.amount),
                'receipt': payment.receipt_number
            },
            new_values={'status': 'REVERSED'},
            description=f"Payment {payment.receipt_number} reversed and removed from system"
        )
        
        # Delete the payment
        payment.delete()
        
        return reversal
    
    @staticmethod
    def _send_refund_notification(refund, notification_type, message):
        """Send refund notification via SMS and/or Email"""
        
        student = refund.payment.student
        
        # Send SMS
        try:
            SMSService.send_sms(student.parent_phone, message)
        except Exception as e:
            print(f"Failed to send SMS: {str(e)}")
        
        # Create refund notification record
        RefundNotification.objects.create(
            refund=refund,
            recipient_phone=student.parent_phone,
            recipient_email=student.parent_email if hasattr(student, 'parent_email') else '',
            notification_type=notification_type,
            status='SENT'
        )
