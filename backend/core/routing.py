"""
Django Channels routing configuration for WebSocket
"""
from django.urls import re_path
from .websocket_consumer import RealtimeNotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', RealtimeNotificationConsumer.as_asgi()),
]
