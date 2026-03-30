
class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    Users can view and manage their notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see only their own notifications
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread = self.get_queryset().exclude(status='DELIVERED')
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read/delivered"""
        notification = self.get_object()
        notification.status = 'DELIVERED'
        notification.save()
        return Response({'status': 'marked as read'})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification preferences
    Each user has their notification preferences (SMS, Email, etc.)
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post'])
    def my_preferences(self, request):
        """Get or update current user's notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(user=request.user)
        
        if request.method == 'POST':
            serializer = self.get_serializer(preference, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
