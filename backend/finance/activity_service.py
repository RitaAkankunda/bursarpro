"""
Activity logging service for tracking school activities and enabling real-time notifications.
"""
from django.contrib.auth.models import User
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import ActivityLog, School, Student, Payment


def send_activity_notification(school: School, activity: ActivityLog):
    """
    Send real-time activity notification to all admins in the school via WebSocket.
    """
    try:
        channel_layer = get_channel_layer()
        group_name = f"school_activity_{school.id}"
        
        activity_data = {
            'type': 'activity_log_message',
            'activity': {
                'id': activity.id,
                'title': activity.title,
                'description': activity.description,
                'activity_type': activity.activity_type,
                'activity_type_display': activity.get_activity_type_display(),
                'user_name': activity.user.get_full_name() if activity.user else 'System',
                'user_username': activity.user.username if activity.user else 'system',
                'student_name': f"{activity.student.first_name} {activity.student.last_name}" if activity.student else None,
                'created_at': activity.created_at.isoformat(),
                'visible_to_roles': activity.visible_to_roles,
                'metadata': activity.metadata,
            }
        }
        
        async_to_sync(channel_layer.group_send)(group_name, activity_data)
    except Exception as e:
        # Log error but don't fail the main operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send activity notification: {str(e)}")



class ActivityLogger:
    """Service for logging activities to the ActivityLog model."""
    
    @staticmethod
    def log_payment(school: School, user: User, payment: Payment, description: str = None):
        """Log a payment activity."""
        title = f"Payment received: {payment.student.first_name} {payment.student.last_name} - UGX {payment.amount_paid}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='PAYMENT',
            title=title,
            description=description or f"Payment of UGX {payment.amount_paid} recorded for term {payment.term.name}",
            student=payment.student,
            payment=payment,
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={
                'amount': float(payment.amount_paid),
                'payment_method': payment.payment_method,
                'status': payment.status,
                'term': payment.term.name if payment.term else 'N/A',
            }
        )
    
    @staticmethod
    def log_refund(school: School, user: User, payment: Payment, refund_amount: float, reason: str = None):
        """Log a refund activity."""
        title = f"Refund processed: {payment.student.first_name} {payment.student.last_name} - UGX {refund_amount}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='REFUND',
            title=title,
            description=reason or f"Refund of UGX {refund_amount} processed",
            student=payment.student,
            payment=payment,
            visible_to_roles=['BURSAR'],
            metadata={
                'refund_amount': refund_amount,
                'original_payment': float(payment.amount_paid),
                'reason': reason,
            }
        )
    
    @staticmethod
    def log_student_created(school: School, user: User, student: Student):
        """Log student creation."""
        title = f"Student created: {student.first_name} {student.last_name}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='STUDENT_CREATED',
            title=title,
            description=f"New student {student.first_name} {student.last_name} enrolled in {student.class_level.name if student.class_level else 'N/A'}",
            student=student,
            visible_to_roles=['BURSAR', 'HEADMASTER', 'TEACHER'],
            metadata={
                'class': student.class_level.name if student.class_level else 'N/A',
                'admission_number': student.admission_number,
            }
        )
    
    @staticmethod
    def log_student_updated(school: School, user: User, student: Student, changes: dict = None):
        """Log student update."""
        title = f"Student updated: {student.first_name} {student.last_name}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='STUDENT_UPDATED',
            title=title,
            description=f"Student information updated",
            student=student,
            visible_to_roles=['BURSAR', 'HEADMASTER', 'TEACHER'],
            metadata={'changes': changes or {}}
        )
    
    @staticmethod
    def log_fee_updated(school: School, user: User, student: Student, term, new_amount: float, old_amount: float = None):
        """Log fee update."""
        title = f"Fee updated: {student.first_name} {student.last_name}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='FEE_UPDATED',
            title=title,
            description=f"Fee for {term.name} updated from UGX {old_amount or 'N/A'} to UGX {new_amount}",
            student=student,
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={
                'new_amount': new_amount,
                'old_amount': old_amount,
                'term': term.name,
            }
        )
    
    @staticmethod
    def log_sms_sent(school: School, user: User, student: Student, recipient: str, message_summary: str = None):
        """Log SMS reminder sent."""
        title = f"SMS reminder sent to {recipient}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='SMS_SENT',
            title=title,
            description=message_summary or f"SMS reminder sent for {student.first_name} {student.last_name}",
            student=student,
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={
                'recipient': recipient,
                'student': f"{student.first_name} {student.last_name}",
            }
        )
    
    @staticmethod
    def log_term_created(school: School, user: User, term):
        """Log term creation."""
        title = f"Term created: {term.name}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='TERM_CREATED',
            title=title,
            description=f"New term {term.name} created",
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={
                'term_name': term.name,
                'start_date': str(term.start_date) if hasattr(term, 'start_date') else 'N/A',
                'end_date': str(term.end_date) if hasattr(term, 'end_date') else 'N/A',
            }
        )
    
    @staticmethod
    def log_reconciliation(school: School, user: User, status: str, summary: str = None):
        """Log bank reconciliation."""
        title = f"Bank reconciliation: {status}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='RECONCILIATION',
            title=title,
            description=summary or f"Bank reconciliation {status}",
            visible_to_roles=['BURSAR'],
            metadata={'status': status}
        )
    
    @staticmethod
    def log_payment_alert(school: School, student: Student, alert_type: str, message: str = None):
        """Log payment-related alert."""
        title = f"Alert: {alert_type} for {student.first_name} {student.last_name}"
        
        ActivityLog.objects.create(
            school=school,
            user=None,  # System-generated
            activity_type='ALERT_GENERATED',
            title=title,
            description=message or f"Payment alert: {alert_type}",
            student=student,
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={'alert_type': alert_type}
        )
    
    @staticmethod
    def log_user_login(school: School, user: User):
        """Log user login."""
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='USER_LOGIN',
            title=f"{user.get_full_name() or user.username} logged in",
            description=f"User login at {user.role.get_role_display() if hasattr(user, 'role') else 'N/A'}",
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={'username': user.username}
        )
    
    @staticmethod
    def log_report_generated(school: School, user: User, report_type: str, report_name: str = None):
        """Log report generation."""
        title = f"Report generated: {report_name or report_type}"
        
        ActivityLog.objects.create(
            school=school,
            user=user,
            activity_type='REPORT_GENERATED',
            title=title,
            description=f"{report_type} report generated",
            visible_to_roles=['BURSAR', 'HEADMASTER'],
            metadata={'report_type': report_type, 'report_name': report_name}
        )
    
    @staticmethod
    def get_school_activity_feed(school: School, user_role: str, limit: int = 50):
        """
        Get activity feed for a school, filtered by user role.
        
        Args:
            school: School instance
            user_role: User's role (e.g., 'BURSAR', 'HEADMASTER')
            limit: Number of activities to return
        
        Returns:
            QuerySet of ActivityLog objects filtered by role
        """
        return ActivityLog.objects.filter(
            school=school,
            visible_to_roles__contains=user_role
        ).order_by('-created_at')[:limit]
