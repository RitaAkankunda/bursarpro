import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Student, Payment, FeeStructure
from .refund_models import AuditLog
from .middleware import get_current_user

def log_audit(action, entity_type, instance, old_values=None, new_values=None):
    user = get_current_user()
    if user and not user.is_authenticated:
        user = None

    AuditLog.objects.create(
        action=action,
        entity_type=entity_type,
        entity_id=instance.id,
        performed_by=user,
        description=f"{action} {entity_type} {instance.id}",
        old_values=old_values or {},
        new_values=new_values or {}
    )

@receiver(post_save, sender=Student)
def student_saved(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    log_audit(action, 'STUDENT', instance)

@receiver(post_delete, sender=Student)
def student_deleted(sender, instance, **kwargs):
    log_audit('DELETE', 'STUDENT', instance)

@receiver(post_save, sender=Payment)
def payment_saved(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    log_audit(action, 'PAYMENT', instance)

@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    log_audit('DELETE', 'PAYMENT', instance)

@receiver(post_save, sender=FeeStructure)
def fee_structure_saved(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    log_audit(action, 'FEE_STRUCTURE', instance)

@receiver(post_delete, sender=FeeStructure)
def fee_structure_deleted(sender, instance, **kwargs):
    log_audit('DELETE', 'FEE_STRUCTURE', instance)
