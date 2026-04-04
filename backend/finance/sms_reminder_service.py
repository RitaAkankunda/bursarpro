"""
SMS Reminder Service - Handle automatic SMS reminders for payment deadlines
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q, Sum
from .models import (
    SMSReminderConfiguration, SMSReminder, SMSReminderHistory, 
    SMSReminderTemplate, Student, Term, Payment, PaymentAlert, School
)

logger = logging.getLogger(__name__)


class SMSReminderService:
    """
    Handle SMS reminder scheduling, sending, and tracking.
    """
    
    def __init__(self, school):
        self.school = school
        try:
            self.config = SMSReminderConfiguration.objects.get(school=school)
        except SMSReminderConfiguration.DoesNotExist:
            self.config = None
    
    def is_enabled(self):
        """Check if SMS reminders are enabled for this school"""
        return self.config and self.config.is_enabled
    
    def get_message_template(self):
        """Get the current message template"""
        return self.config.message_template if self.config else ""
    
    def format_message(self, student, term, amount, due_date, parent_name=None):
        """
        Format SMS message with student and payment details.
        Uses placeholders: {student_name}, {parent_name}, {amount}, {term_name}, {due_date}
        """
        template = self.get_message_template()
        if not template:
            return f"Dear {student.first_name}, payment of UGX {amount} for {term.name} is due on {due_date}. Please pay to avoid penalties."
        
        try:
            message = template.format(
                student_name=student.first_name,
                parent_name=parent_name or student.first_name,
                amount=f"{amount:,.0f}",
                term_name=term.name,
                due_date=due_date.strftime('%Y-%m-%d')
            )
            # Truncate to 160 characters (SMS limit)
            if len(message) > 160:
                message = message[:157] + "..."
            return message
        except Exception as e:
            logger.error(f"Error formatting SMS message: {e}")
            return f"Payment reminder: UGX {amount} due on {due_date}"
    
    def get_students_to_remind(self):
        """
        Get list of students with outstanding payments that need reminders.
        Based on trigger_type (DAYS_BEFORE, OVERDUE, SPECIFIC_DATE).
        """
        if not self.is_enabled():
            return []
        
        students_to_remind = []
        current_date = timezone.now().date()
        
        # Get all active terms
        active_terms = Term.objects.filter(school=self.school, is_active=True)
        
        for term in active_terms:
            # Get all students in school with outstanding payments
            outstanding_payments = Student.objects.filter(
                school=self.school,
                class_level__in=term.school.classes.all()
            ).exclude(
                payments__term=term,
                payments__status='PAID'
            ).distinct()
            
            for student in outstanding_payments:
                # Calculate outstanding amount for this term
                total_fees = student.calculate_total_fees(term)
                paid_amount = Payment.objects.filter(
                    student=student,
                    term=term,
                    status='PAID'
                ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')
                
                outstanding = total_fees - paid_amount
                
                if outstanding > 0:
                    # Determine if reminder should be sent based on trigger type
                    should_remind = False
                    due_date = term.end_date
                    
                    if self.config.trigger_type == 'DAYS_BEFORE':
                        # Send reminder X days before due date
                        reminder_date = due_date - timedelta(days=self.config.days_before_due)
                        should_remind = current_date == reminder_date
                    
                    elif self.config.trigger_type == 'OVERDUE':
                        # Send reminder if payment is overdue
                        should_remind = current_date > due_date and outstanding > 0
                    
                    elif self.config.trigger_type == 'SPECIFIC_DATE':
                        # Send reminder on specific day of month
                        should_remind = current_date.day == self.config.days_before_due
                    
                    if should_remind:
                        # Get parent phone number (from PaymentAlert or user profile)
                        recipient_phone = self._get_parent_phone(student)
                        if recipient_phone:
                            students_to_remind.append({
                                'student': student,
                                'term': term,
                                'amount': outstanding,
                                'due_date': due_date,
                                'phone': recipient_phone,
                                'recipient_type': 'PARENT'
                            })
        
        return students_to_remind
    
    def _get_parent_phone(self, student):
        """
        Get parent phone number for SMS reminder.
        Tries to get from PaymentAlert, then falls back to student profile.
        """
        # Try to get from payment alert
        alert = PaymentAlert.objects.filter(student=student).first()
        if alert:
            # Parse phone from alert if stored
            return getattr(alert, 'phone_number', None)
        
        # Falls back to hardcoded or can be extended to fetch from user profile
        return None
    
    def schedule_reminders(self):
        """
        Schedule SMS reminders for students with outstanding payments.
        Returns count of scheduled reminders.
        """
        if not self.is_enabled():
            logger.info(f"SMS reminders are disabled for {self.school.name}")
            return 0
        
        scheduled_count = 0
        students_data = self.get_students_to_remind()
        
        # Check daily limit
        sent_today = SMSReminderHistory.objects.filter(
            school=self.school,
            sent_at__date=timezone.now().date()
        ).count()
        
        remaining_quota = self.config.max_daily_reminders - sent_today
        
        for i, student_data in enumerate(students_data):
            if i >= remaining_quota:
                logger.warning(f"Reached daily SMS limit for {self.school.name}")
                break
            
            try:
                # Don't duplicate reminders
                existing = SMSReminder.objects.filter(
                    school=self.school,
                    student=student_data['student'],
                    term=student_data['term'],
                    status__in=['PENDING', 'SCHEDULED']
                ).exists()
                
                if existing:
                    continue
                
                # Format message
                message = self.format_message(
                    student_data['student'],
                    student_data['term'],
                    student_data['amount'],
                    student_data['due_date']
                )
                
                # Schedule for send_time today
                send_time = datetime.combine(
                    timezone.now().date(),
                    self.config.send_time
                )
                send_time = timezone.make_aware(send_time)
                
                # Create reminder record
                reminder = SMSReminder.objects.create(
                    school=self.school,
                    student=student_data['student'],
                    term=student_data['term'],
                    recipient_phone=student_data['phone'],
                    recipient_type=student_data['recipient_type'],
                    outstanding_amount=student_data['amount'],
                    due_date=student_data['due_date'],
                    message_content=message,
                    status='SCHEDULED',
                    scheduled_send_time=send_time
                )
                
                scheduled_count += 1
                logger.info(f"Scheduled SMS reminder for {student_data['student'].first_name}")
            
            except Exception as e:
                logger.error(f"Error scheduling reminder: {e}")
                continue
        
        return scheduled_count
    
    def send_scheduled_reminders(self):
        """
        Send all reminders that are due.
        This should be called by a scheduled task (Celery beat, etc.)
        """
        if not self.is_enabled():
            return 0
        
        current_time = timezone.now()
        sent_count = 0
        
        # Get reminders due to send
        pending_reminders = SMSReminder.objects.filter(
            school=self.school,
            status='SCHEDULED',
            scheduled_send_time__lte=current_time
        )
        
        for reminder in pending_reminders:
            try:
                success = self.send_sms(reminder)
                
                if success:
                    reminder.status = 'SENT'
                    reminder.sent_at = current_time
                    reminder.save()
                    
                    # Log to history
                    SMSReminderHistory.objects.create(
                        school=self.school,
                        student=reminder.student,
                        term=reminder.term,
                        recipient_phone=reminder.recipient_phone,
                        recipient_type=reminder.recipient_type,
                        message_sent=reminder.message_content,
                        amount_reminded=reminder.outstanding_amount,
                        sms_gateway_response='SUCCESS',
                        cost=self.config.sms_cost_per_unit
                    )
                    
                    sent_count += 1
                    logger.info(f"Sent SMS reminder to {reminder.recipient_phone}")
                else:
                    reminder.status = 'FAILED'
                    reminder.retry_count += 1
                    reminder.save()
            
            except Exception as e:
                logger.error(f"Error sending SMS reminder: {e}")
                reminder.status = 'FAILED'
                reminder.error_message = str(e)
                reminder.retry_count += 1
                reminder.save()
        
        return sent_count
    
    def send_sms(self, reminder):
        """
        Send SMS via external gateway (Africa's Talking, Twilio, etc.)
        This is a placeholder - integrate with actual SMS provider.
        """
        try:
            # TODO: Integrate with SMS gateway (Africa's Talking, Twilio, etc.)
            # For now, just log that it would be sent
            logger.info(f"[SMS GATEWAY] Sending to {reminder.recipient_phone}: {reminder.message_content}")
            
            # Placeholder success
            return True
        
        except Exception as e:
            logger.error(f"SMS gateway error: {e}")
            return False
    
    def get_monthly_cost(self):
        """Calculate estimated monthly SMS cost"""
        if not self.config:
            return Decimal('0')
        
        # Get reminders sent this month
        this_month = timezone.now().date().replace(day=1)
        reminders_sent = SMSReminderHistory.objects.filter(
            school=self.school,
            sent_at__date__gte=this_month
        ).count()
        
        return reminders_sent * self.config.sms_cost_per_unit
    
    def is_budget_exceeded(self):
        """Check if monthly SMS budget has been exceeded"""
        if not self.config:
            return False
        
        current_cost = self.get_monthly_cost()
        return current_cost > self.config.monthly_budget
    
    def get_stats(self):
        """Get SMS reminder statistics"""
        this_month = timezone.now().date().replace(day=1)
        
        sent_today = SMSReminderHistory.objects.filter(
            school=self.school,
            sent_at__date=timezone.now().date()
        ).count()
        
        sent_this_month = SMSReminderHistory.objects.filter(
            school=self.school,
            sent_at__date__gte=this_month
        ).count()
        
        pending_reminders = SMSReminder.objects.filter(
            school=self.school,
            status='PENDING'
        ).count()
        
        scheduled_reminders = SMSReminder.objects.filter(
            school=self.school,
            status='SCHEDULED'
        ).count()
        
        return {
            'sent_today': sent_today,
            'sent_this_month': sent_this_month,
            'pending_count': pending_reminders,
            'scheduled_count': scheduled_reminders,
            'monthly_cost': self.get_monthly_cost(),
            'budget_remaining': max(Decimal('0'), self.config.monthly_budget - self.get_monthly_cost()) if self.config else Decimal('0'),
            'budget_exceeded': self.is_budget_exceeded(),
        }
