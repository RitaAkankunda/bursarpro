import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_sms(phone_number, message):
        """
        Sends an SMS message.
        In production, this would integrate with Twilio or Africa's Talking.
        """
        logger.info(f"\n========== SMS DISPATCH ==========\nTo: {phone_number}\nMessage: {message}\n==================================\n")
        return True

    @staticmethod
    def send_email(to_email, subject, body):
        """
        Sends an Email.
        In production, this would use django.core.mail
        """
        logger.info(f"\n========= EMAIL DISPATCH =========\nTo: {to_email}\nSubject: {subject}\nBody: {body}\n==================================\n")
        return True
