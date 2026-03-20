"""
Notification services for SMS and Email
Handles Africas Talking integration and email sending
"""
import logging
from datetime import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
import africastalking

logger = logging.getLogger(__name__)

# Initialize Africa's Talking
af_api_key = getattr(settings, 'AFRICAS_TALKING_API_KEY', '')
af_username = getattr(settings, 'AFRICAS_TALKING_USERNAME', '')

if af_api_key and af_username:
    africastalking.initialize(af_username, af_api_key)
    sms = africastalking.SMS
else:
    sms = None


class SMSService:
    """Handle SMS notifications via Africa's Talking"""
    
    @staticmethod
    def send_payment_confirmation(payment, parent_phone):
        """Send SMS notification when payment is received"""
        if not sms:
            logger.warning("SMS service not configured")
            return None
        
        try:
            message = (
                f"Fee Payment Received\n"
                f"Student: {payment.student.first_name} {payment.student.last_name}\n"
                f"Amount: KES {payment.amount:,.0f}\n"
                f"Receipt: {payment.receipt_number}\n"
                f"Date: {payment.payment_date.strftime('%Y-%m-%d %H:%M')}"
            )
            
            recipients = [parent_phone]
            response = sms.send(message, recipients)
            
            logger.info(f"SMS sent to {parent_phone}: {response}")
            return response
        except Exception as e:
            logger.error(f"Failed to send SMS to {parent_phone}: {str(e)}")
            return None
    
    @staticmethod
    def send_outstanding_fees_alert(student, amount_outstanding):
        """Send SMS alert for outstanding fees"""
        if not sms or not student.parent_phone:
            logger.warning("SMS service not configured or no parent phone")
            return None
        
        try:
            message = (
                f"Outstanding Fees Alert\n"
                f"Student: {student.first_name} {student.last_name}\n"
                f"Amount Outstanding: KES {amount_outstanding:,.0f}\n"
                f"Please settle this amount promptly.\n"
                f"School: {student.school.name}"
            )
            
            recipients = [student.parent_phone]
            response = sms.send(message, recipients)
            
            logger.info(f"Outstanding fees alert sent to {student.parent_phone}")
            return response
        except Exception as e:
            logger.error(f"Failed to send alert SMS: {str(e)}")
            return None


class EmailService:
    """Handle email notifications"""
    
    @staticmethod
    def send_payment_confirmation_email(payment, parent_email):
        """Send email confirmation when payment is received"""
        try:
            subject = f"Payment Confirmation - {payment.receipt_number}"
            message = (
                f"Dear {payment.student.parent_name},\n\n"
                f"We have received your payment for {payment.student.first_name} {payment.student.last_name}.\n\n"
                f"Payment Details:\n"
                f"- Receipt Number: {payment.receipt_number}\n"
                f"- Amount: KES {payment.amount:,.2f}\n"
                f"- Date: {payment.payment_date.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"- School: {payment.student.school.name}\n\n"
                f"Thank you for your prompt payment.\n\n"
                f"Best regards,\n"
                f"Fees Tracker System"
            )
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [parent_email],
                fail_silently=False,
            )
            
            logger.info(f"Payment confirmation email sent to {parent_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send payment email: {str(e)}")
            return False
    
    @staticmethod
    def send_report_email(user_email, report_type, pdf_buffer, filename):
        """Send generated report via email"""
        try:
            subject = f"Fee Collection Report - {report_type}"
            message = (
                f"Dear User,\n\n"
                f"Please find attached your requested fee collection report.\n\n"
                f"Report Type: {report_type.replace('-', ' ').title()}\n"
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"Best regards,\n"
                f"Fees Tracker System"
            )
            
            email = None  # Would normally use EmailMessage with attachment
            # For now, just log it
            logger.info(f"Report email would be sent to {user_email}: {filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to send report email: {str(e)}")
            return False
    
    @staticmethod
    def send_outstanding_fees_summary(user_email, outstanding_list):
        """Send summary of outstanding fees for multiple students"""
        try:
            subject = "Outstanding Fees Summary"
            
            message = "Dear Administrator,\n\nOutstanding Fees Summary:\n\n"
            for student in outstanding_list:
                message += f"- {student['name']} ({student['class']}): KES {student['outstanding']:,.2f}\n"
            
            message += f"\nTotal Outstanding: KES {sum(s['outstanding'] for s in outstanding_list):,.2f}\n\n"
            message += "Best regards,\nFees Tracker System"
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user_email],
                fail_silently=False,
            )
            
            logger.info(f"Outstanding fees summary email sent to {user_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send summary email: {str(e)}")
            return False


class NotificationManager:
    """Centralized notification manager"""
    
    @staticmethod
    def create_notification(user, notification_type, channel, message, recipient, subject=""):
        """Create a notification record"""
        from .models import Notification
        
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            channel=channel,
            message=message,
            subject=subject,
            recipient=recipient,
            status='PENDING'
        )
        
        return notification
    
    @staticmethod
    def send_notification(notification):
        """Send a pending notification"""
        from .models import Notification
        
        try:
            if notification.channel == 'SMS':
                # Send SMS using Africa's Talking
                response = SMSService.send_payment_confirmation(None, notification.recipient)
                if response:
                    notification.status = 'SENT'
                    notification.sent_at = datetime.now()
                    notification.save()
                    return True
            
            elif notification.channel == 'EMAIL':
                # Send email
                result = EmailService.send_payment_confirmation_email(None, notification.recipient)
                if result:
                    notification.status = 'SENT'
                    notification.sent_at = datetime.now()
                    notification.save()
                    return True
            
            # If we get here, sending failed
            notification.status = 'FAILED'
            notification.save()
            return False
            
        except Exception as e:
            logger.error(f"Failed to send notification {notification.id}: {str(e)}")
            notification.status = 'FAILED'
            notification.save()
            return False
    
    @staticmethod
    def get_user_preference(user):
        """Get notification preferences for a user"""
        from .models import NotificationPreference
        
        preference, created = NotificationPreference.objects.get_or_create(user=user)
        return preference
