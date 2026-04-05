"""
WebSocket consumer for real-time activity notifications.
Sends activity updates to all admins in the same school.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import UserRole, ActivityLog, School


class ActivityNotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time activity notifications.
    Users from the same school are joined in a group to receive real-time updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Get user and school
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Get user's school
        user_role = await self.get_user_role()
        if not user_role or not user_role.school:
            await self.close()
            return
        
        self.school = user_role.school
        self.school_group_name = f"school_activity_{self.school.id}"
        self.user_role = user_role.role
        
        # Join school group
        await self.channel_layer.group_add(
            self.school_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'school_group_name'):
            await self.channel_layer.group_discard(
                self.school_group_name,
                self.channel_name
            )
    
    async def activity_log_message(self, event):
        """
        Handle activity log messages from the group.
        Filters based on user's role permissions.
        """
        activity = event['activity']
        
        # Check if user's role can see this activity
        visible_to_roles = activity.get('visible_to_roles', [])
        if self.user_role not in visible_to_roles:
            return
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps(activity))
    
    async def receive(self, text_data):
        """Handle incoming messages from client."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Keep-alive ping
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif message_type == 'subscribe':
                # Client asks for recent activities
                activities = await self.get_recent_activities()
                await self.send(text_data=json.dumps({
                    'type': 'recent_activities',
                    'data': activities
                }))
        except json.JSONDecodeError:
            pass
    
    @database_sync_to_async
    def get_user_role(self):
        """Get user role synchronously."""
        try:
            return UserRole.objects.get(user=self.user)
        except UserRole.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_recent_activities(self, limit=20):
        """Get recent activities for the school filtered by user role."""
        try:
            activities = ActivityLog.objects.filter(
                school=self.school,
                visible_to_roles__contains=self.user_role
            ).order_by('-created_at')[:limit]
            
            return [{
                'id': activity.id,
                'title': activity.title,
                'description': activity.description,
                'activity_type': activity.activity_type,
                'user_name': activity.user.get_full_name() if activity.user else 'System',
                'student_name': f"{activity.student.first_name} {activity.student.last_name}" if activity.student else None,
                'created_at': activity.created_at.isoformat(),
                'metadata': activity.metadata,
            } for activity in activities]
        except Exception:
            return []
