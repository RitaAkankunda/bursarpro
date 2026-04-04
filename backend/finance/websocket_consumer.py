"""
Real-time notification service using WebSocket
"""
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Notification, DashboardAlert
from .refund_models import AuditLog
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class RealtimeNotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """
    
    # Maps to track active connections
    user_connections = {}
    
    async def connect(self):
        """Handle WebSocket connection"""
        user = self.scope['user']
        
        # Initialize user_group_name to prevent AttributeError in disconnect
        self.user_group_name = None
        
        if not user.is_authenticated:
            await self.close()
            return
        
        # Add user to group (one group per user for broadcasting)
        self.user_group_name = f'user_{user.id}'
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Track active connections
        if user.id not in RealtimeNotificationConsumer.user_connections:
            RealtimeNotificationConsumer.user_connections[user.id] = []
        RealtimeNotificationConsumer.user_connections[user.id].append(self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection.established',
            'user_id': user.id,
            'username': user.username,
            'timestamp': datetime.now().isoformat()
        }))
        
        # Send any pending notifications
        await self.send_pending_notifications()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        user = self.scope['user']
        
        # Remove from group (only if connected successfully)
        if hasattr(self, 'user_group_name') and self.user_group_name:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        # Clean up connection tracking
        if user.id in RealtimeNotificationConsumer.user_connections:
            if self.channel_name in RealtimeNotificationConsumer.user_connections[user.id]:
                RealtimeNotificationConsumer.user_connections[user.id].remove(self.channel_name)
            
            if not RealtimeNotificationConsumer.user_connections[user.id]:
                del RealtimeNotificationConsumer.user_connections[user.id]
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
            
            elif message_type == 'mark_read':
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
            
            elif message_type == 'dismiss_alert':
                alert_id = data.get('alert_id')
                await self.dismiss_alert(alert_id)
            
            elif message_type == 'subscribe_to_entity':
                entity_type = data.get('entity_type')
                entity_id = data.get('entity_id')
                await self.subscribe_to_entity(entity_type, entity_id)
        
        except json.JSONDecodeError:
            logger.error('Invalid JSON received on WebSocket')
        except Exception as e:
            logger.error(f'Error processing WebSocket message: {e}')
    
    # Event handlers that are called by group_send
    async def notification_event(self, event):
        """Send notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data'],
            'timestamp': datetime.now().isoformat()
        }))
    
    async def alert_event(self, event):
        """Send alert to client"""
        await self.send(text_data=json.dumps({
            'type': 'alert',
            'data': event['data'],
            'timestamp': datetime.now().isoformat()
        }))
    
    async def audit_event(self, event):
        """Send audit log event to client"""
        await self.send(text_data=json.dumps({
            'type': 'audit_event',
            'data': event['data'],
            'timestamp': datetime.now().isoformat()
        }))
    
    async def status_update_event(self, event):
        """Send status update to client"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'data': event['data'],
            'timestamp': datetime.now().isoformat()
        }))
    
    async def connection_error(self, event):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': event['message'],
            'timestamp': datetime.now().isoformat()
        }))
    
    # Database operations
    @database_sync_to_async
    def send_pending_notifications(self):
        """Send unread notifications to connected user"""
        user = self.scope['user']
        
        # Get unread notifications
        unread_notifications = Notification.objects.filter(
            user=user,
            status__in=['PENDING', 'SENT']
        )[:10]  # Limit to 10 most recent
        
        notifications_data = []
        for notif in unread_notifications:
            notifications_data.append({
                'id': notif.id,
                'type': notif.get_notification_type_display(),
                'channel': notif.channel,
                'subject': notif.subject,
                'message': notif.message,
                'recipient': notif.recipient,
                'created_at': notif.created_at.isoformat() if notif.created_at else None
            })
        
        return notifications_data
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read in database"""
        try:
            notif = Notification.objects.get(id=notification_id)
            if notif.status == 'PENDING':
                notif.status = 'DELIVERED'
                notif.sent_at = datetime.now()
                notif.save()
        except Notification.DoesNotExist:
            pass
    
    @database_sync_to_async
    def dismiss_alert(self, alert_id):
        """Dismiss a dashboard alert"""
        try:
            alert = DashboardAlert.objects.get(id=alert_id)
            alert.is_dismissed = True
            alert.dismissed_at = datetime.now()
            alert.save()
        except DashboardAlert.DoesNotExist:
            pass
    
    @database_sync_to_async
    def subscribe_to_entity(self, entity_type, entity_id):
        """Add user to subscription for entity updates"""
        pass  # Can implement subscription tracking


class NotificationBroadcaster:
    """
    Helper class for broadcasting notifications to users via WebSocket
    """
    
    @staticmethod
    async def send_notification_to_user(user_id, notification_data):
        """
        Send a notification to a specific user
        
        Args:
            user_id (int): Target user ID
            notification_data (dict): Notification data to send
        """
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            f'user_{user_id}',
            {
                'type': 'notification.event',
                'data': notification_data
            }
        )
    
    @staticmethod
    async def send_alert_to_user(user_id, alert_data):
        """
        Send an alert to a specific user
        
        Args:
            user_id (int): Target user ID
            alert_data (dict): Alert data to send
        """
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            f'user_{user_id}',
            {
                'type': 'alert.event',
                'data': alert_data
            }
        )
    
    @staticmethod
    async def broadcast_to_role(role, notification_data):
        """
        Broadcast notification to all users of a specific role
        
        Args:
            role (str): User role (BURSAR, HEADMASTER, etc.)
            notification_data (dict): Data to broadcast
        """
        from channels.layers import get_channel_layer
        from .models import UserRole
        
        channel_layer = get_channel_layer()
        
        # Get all users with this role
        users = UserRole.objects.filter(role=role).values_list('user_id', flat=True)
        
        for user_id in users:
            await channel_layer.group_send(
                f'user_{user_id}',
                {
                    'type': 'notification.event',
                    'data': notification_data
                }
            )
    
    @staticmethod
    async def send_audit_event_to_admins(audit_log_data):
        """
        Send audit log event to admin users
        
        Args:
            audit_log_data (dict): Audit log data
        """
        from channels.layers import get_channel_layer
        from .models import UserRole
        
        channel_layer = get_channel_layer()
        
        # Send to all BURSAR and HEADMASTER users
        for role in ['BURSAR', 'HEADMASTER']:
            users = UserRole.objects.filter(role=role).values_list('user_id', flat=True)
            
            for user_id in users:
                await channel_layer.group_send(
                    f'user_{user_id}',
                    {
                        'type': 'audit.event',
                        'data': audit_log_data
                    }
                )
    
    @staticmethod
    async def send_status_update(user_id, status_data):
        """
        Send a status update to a user
        
        Args:
            user_id (int): Target user ID
            status_data (dict): Status information
        """
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            f'user_{user_id}',
            {
                'type': 'status.update.event',
                'data': status_data
            }
        )
