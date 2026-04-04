"""
Audit Service for compliance tracking and operation logging
"""
from django.contrib.auth.models import User
from .refund_models import AuditLog
from django.db.models import Q
from datetime import datetime, timedelta
import json


class AuditService:
    """
    Service for logging and retrieving audit trail entries
    """
    
    ENTITY_TYPES = {
        'REFUND': 'Refund',
        'REVERSAL': 'Reversal',
        'PAYMENT': 'Payment',
        'STUDENT': 'Student',
        'USER': 'User',
        'SCHOOL': 'School',
        'TERM': 'Term',
        'FEE_STRUCTURE': 'Fee Structure',
        'CLASS': 'Class Level',
        'SMS_CONFIG': 'SMS Configuration',
        'SMS_REMINDER': 'SMS Reminder',
        'RECONCILIATION': 'Reconciliation',
        'BANK_STATEMENT': 'Bank Statement',
        'DASHBOARD_WIDGET': 'Dashboard Widget',
        'NOTIFICATION': 'Notification'
    }
    
    ACTION_TYPES = {
        'CREATE': 'Created',
        'UPDATE': 'Updated',
        'DELETE': 'Deleted',
        'APPROVE': 'Approved',
        'REJECT': 'Rejected',
        'PROCESS': 'Processed',
        'COMPLETE': 'Completed',
        'FAIL': 'Failed',
        'EXPORT': 'Exported',
        'IMPORT': 'Imported',
        'RECONCILE': 'Reconciled',
        'SEND': 'Sent',
        'CANCEL': 'Cancelled',
        'REVERT': 'Reverted'
    }
    
    @staticmethod
    def log_action(
        action,
        entity_type,
        entity_id,
        performed_by,
        old_values=None,
        new_values=None,
        description=""
    ):
        """
        Log an action to the audit trail
        
        Args:
            action (str): Action type (CREATE, UPDATE, DELETE, etc.)
            entity_type (str): Type of entity (PAYMENT, STUDENT, etc.)
            entity_id (int): ID of the entity
            performed_by (User): User who performed the action
            old_values (dict): Previous values (for UPDATE)
            new_values (dict): New values (for UPDATE/CREATE)
            description (str): Human-readable description
        
        Returns:
            AuditLog: Created audit log entry
        """
        
        audit_log = AuditLog.objects.create(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            performed_by=performed_by,
            old_values=old_values or {},
            new_values=new_values or {},
            description=description
        )
        
        return audit_log
    
    @staticmethod
    def get_audit_logs(
        entity_type=None,
        entity_id=None,
        action=None,
        performed_by=None,
        start_date=None,
        end_date=None,
        limit=100,
        offset=0
    ):
        """
        Retrieve audit logs with optional filtering
        
        Args:
            entity_type (str): Filter by entity type
            entity_id (int): Filter by entity ID
            action (str): Filter by action type
            performed_by (User/int): Filter by user
            start_date (datetime): Filter by start date
            end_date (datetime): Filter by end date
            limit (int): Max results to return
            offset (int): Offset for pagination
        
        Returns:
            QuerySet: Filtered audit logs
        """
        
        queryset = AuditLog.objects.all()
        
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        
        if action:
            queryset = queryset.filter(action=action)
        
        if performed_by:
            if isinstance(performed_by, int):
                queryset = queryset.filter(performed_by_id=performed_by)
            else:
                queryset = queryset.filter(performed_by=performed_by)
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        return queryset.order_by('-timestamp')[offset:offset + limit]
    
    @staticmethod
    def get_entity_history(entity_type, entity_id):
        """
        Get complete history of changes for a specific entity
        
        Args:
            entity_type (str): Type of entity
            entity_id (int): Entity ID
        
        Returns:
            list: List of audit log entries for this entity
        """
        
        return list(
            AuditLog.objects.filter(
                entity_type=entity_type,
                entity_id=entity_id
            ).order_by('-timestamp')
        )
    
    @staticmethod
    def get_user_activity(user, days=30):
        """
        Get all activities performed by a user
        
        Args:
            user (User): User to get activity for
            days (int): Look back this many days
        
        Returns:
            QuerySet: Audit logs from this user
        """
        
        start_date = datetime.now() - timedelta(days=days)
        
        return AuditLog.objects.filter(
            performed_by=user,
            timestamp__gte=start_date
        ).order_by('-timestamp')
    
    @staticmethod
    def get_recent_changes(entity_type, minutes=60):
        """
        Get recent changes to a specific entity type
        
        Args:
            entity_type (str): Type of entity
            minutes (int): Look back this many minutes
        
        Returns:
            QuerySet: Recent audit logs
        """
        
        start_time = datetime.now() - timedelta(minutes=minutes)
        
        return AuditLog.objects.filter(
            entity_type=entity_type,
            timestamp__gte=start_time
        ).order_by('-timestamp')
    
    @staticmethod
    def get_audit_summary(entity_type, start_date=None, end_date=None):
        """
        Get summary statistics of operations on an entity type
        
        Args:
            entity_type (str): Type of entity
            start_date (datetime): Filter start date
            end_date (datetime): Filter end date
        
        Returns:
            dict: Summary statistics
        """
        
        queryset = AuditLog.objects.filter(entity_type=entity_type)
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        actions_summary = {}
        for action_type in AuditService.ACTION_TYPES.keys():
            count = queryset.filter(action=action_type).count()
            if count > 0:
                actions_summary[AuditService.ACTION_TYPES[action_type]] = count
        
        users_summary = {}
        for log in queryset.values('performed_by__username').distinct():
            username = log['performed_by__username']
            count = queryset.filter(performed_by__username=username).count()
            users_summary[username] = count
        
        return {
            'entity_type': entity_type,
            'total_changes': queryset.count(),
            'by_action': actions_summary,
            'by_user': users_summary,
            'start_date': start_date,
            'end_date': end_date
        }
    
    @staticmethod
    def search_audit_logs(query, limit=50):
        """
        Search audit logs by description or entity ID
        
        Args:
            query (str): Search query
            limit (int): Max results
        
        Returns:
            QuerySet: Matching audit logs
        """
        
        return AuditLog.objects.filter(
            Q(description__icontains=query) |
            Q(entity_id__icontains=query) |
            Q(performed_by__username__icontains=query) |
            Q(performed_by__email__icontains=query)
        ).order_by('-timestamp')[:limit]
    
    @staticmethod
    def export_audit_logs(entity_type=None, start_date=None, end_date=None, format='json'):
        """
        Export audit logs in specified format
        
        Args:
            entity_type (str): Filter by entity type
            start_date (datetime): Start date filter
            end_date (datetime): End date filter
            format (str): Export format (json, csv)
        
        Returns:
            str: Formatted audit log data
        """
        
        queryset = AuditLog.objects.all()
        
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        queryset = queryset.order_by('-timestamp')
        
        if format == 'json':
            data = []
            for log in queryset:
                data.append({
                    'id': log.id,
                    'action': AuditService.ACTION_TYPES.get(log.action, log.action),
                    'entity_type': AuditService.ENTITY_TYPES.get(log.entity_type, log.entity_type),
                    'entity_id': log.entity_id,
                    'performed_by': log.performed_by.username if log.performed_by else 'Unknown',
                    'old_values': log.old_values,
                    'new_values': log.new_values,
                    'description': log.description,
                    'timestamp': log.timestamp.isoformat()
                })
            return json.dumps(data, indent=2, default=str)
        
        # CSV format
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'ID', 'Action', 'Entity Type', 'Entity ID', 'Performed By',
            'Description', 'Timestamp', 'Old Values', 'New Values'
        ])
        
        for log in queryset:
            writer.writerow([
                log.id,
                AuditService.ACTION_TYPES.get(log.action, log.action),
                AuditService.ENTITY_TYPES.get(log.entity_type, log.entity_type),
                log.entity_id,
                log.performed_by.username if log.performed_by else 'Unknown',
                log.description,
                log.timestamp.isoformat(),
                json.dumps(log.old_values),
                json.dumps(log.new_values)
            ])
        
        return output.getvalue()


class ComplianceService:
    """
    Service for compliance reporting and tracking
    """
    
    @staticmethod
    def get_compliance_report(user, start_date=None, end_date=None):
        """
        Generate compliance report for a user
        
        Args:
            user (User): User to generate report for
            start_date (datetime): Report start date
            end_date (datetime): Report end date
        
        Returns:
            dict: Compliance report details
        """
        
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        
        if not end_date:
            end_date = datetime.now()
        
        user_logs = AuditLog.objects.filter(
            performed_by=user,
            timestamp__range=[start_date, end_date]
        )
        
        return {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}" if user.first_name else user.username
            },
            'period': {
                'start': start_date,
                'end': end_date
            },
            'total_actions': user_logs.count(),
            'actions_by_type': {
                action: user_logs.filter(action=action).count()
                for action in AuditService.ACTION_TYPES.keys()
            },
            'entities_modified': {
                entity: user_logs.filter(entity_type=entity).count()
                for entity in AuditService.ENTITY_TYPES.keys()
                if user_logs.filter(entity_type=entity).count() > 0
            },
            'last_action': user_logs.first().timestamp if user_logs.exists() else None
        }
    
    @staticmethod
    def get_system_compliance_report(school=None, days=30):
        """
        Generate system-wide compliance report
        
        Args:
            school (School): Optional filter by school
            days (int): Number of days to look back
        
        Returns:
            dict: System compliance report
        """
        
        start_date = datetime.now() - timedelta(days=days)
        
        queryset = AuditLog.objects.filter(timestamp__gte=start_date)
        
        return {
            'period_days': days,
            'total_changes': queryset.count(),
            'by_action_type': {
                action: queryset.filter(action=action).count()
                for action in AuditService.ACTION_TYPES.keys()
            },
            'by_entity_type': {
                entity: queryset.filter(entity_type=entity).count()
                for entity in AuditService.ENTITY_TYPES.keys()
            },
            'active_users': queryset.values('performed_by').distinct().count(),
            'high_risk_actions': {
                'DELETES': queryset.filter(action='DELETE').count(),
                'REVERSALS': queryset.filter(entity_type='REVERSAL').count()
            }
        }
