"""
Widget customization service for managing dashboard widget layout and preferences.
Handles widget positioning, visibility, and user-specific customizations.
"""
from django.db.models import F, Q
from .models import DashboardWidget, DashboardPreference


class WidgetCustomizationService:
    """Service for customizing dashboard widgets."""
    
    def __init__(self, user, school):
        self.user = user
        self.school = school
    
    def get_or_create_preference(self):
        """Get or create user's dashboard preference."""
        preference, created = DashboardPreference.objects.get_or_create(
            user=self.user,
            defaults={
                'school': self.school,
                'theme': 'light',
                'columns': 3,
                'hidden_widgets': [],
                'widget_order': [],
                'show_notifications': True,
                'notification_frequency': 'daily'
            }
        )
        return preference
    
    def get_available_widgets(self, role):
        """Get all widgets configured for a user's role."""
        widgets = DashboardWidget.objects.filter(
            school=self.school,
            role=role,
            is_enabled=True
        ).order_by('order')
        
        return widgets
    
    def get_user_widget_configuration(self, role):
        """
        Get widgets with user preferences applied.
        Returns: list of widget configs with visibility and order info.
        """
        preference = self.get_or_create_preference()
        widgets = self.get_available_widgets(role)
        
        hidden = preference.hidden_widgets or []
        custom_order = preference.widget_order or []
        
        widget_list = []
        for widget in widgets:
            widget_data = {
                'id': widget.id,
                'widget_type': widget.widget_type,
                'role': widget.role,
                'is_visible': widget.widget_type not in hidden,
                'order': custom_order.index(widget.widget_type) if widget.widget_type in custom_order else widget.order,
                'is_enabled': widget.is_enabled,
            }
            widget_list.append(widget_data)
        
        # Sort by custom order or default order
        widget_list.sort(key=lambda x: x['order'])
        
        return widget_list
    
    def update_widget_visibility(self, widget_type, is_visible):
        """Toggle widget visibility for user."""
        preference = self.get_or_create_preference()
        hidden = preference.hidden_widgets or []
        
        if is_visible and widget_type in hidden:
            hidden.remove(widget_type)
        elif not is_visible and widget_type not in hidden:
            hidden.append(widget_type)
        
        preference.hidden_widgets = hidden
        preference.save()
        
        return preference
    
    def update_widget_order(self, widget_order):
        """Update custom widget order (list of widget_type strings)."""
        preference = self.get_or_create_preference()
        
        # Validate that all widgets exist
        valid_widgets = DashboardWidget.objects.filter(
            school=self.school,
            widget_type__in=widget_order,
            is_enabled=True
        ).values_list('widget_type', flat=True)
        
        # Only keep valid widgets in the order
        valid_order = [w for w in widget_order if w in valid_widgets]
        
        preference.widget_order = valid_order
        preference.save()
        
        return preference
    
    def update_theme(self, theme):
        """Update user's theme preference."""
        if theme not in ['light', 'dark']:
            raise ValueError('Theme must be either "light" or "dark"')
        
        preference = self.get_or_create_preference()
        preference.theme = theme
        preference.save()
        
        return preference
    
    def update_layout_columns(self, columns):
        """Update dashboard layout columns (1-4)."""
        if columns < 1 or columns > 4:
            raise ValueError('Columns must be between 1 and 4')
        
        preference = self.get_or_create_preference()
        preference.columns = columns
        preference.save()
        
        return preference
    
    def update_notification_settings(self, show_notifications=None, frequency=None):
        """Update notification settings."""
        preference = self.get_or_create_preference()
        
        if show_notifications is not None:
            preference.show_notifications = show_notifications
        
        if frequency:
            if frequency not in ['immediate', 'daily', 'weekly']:
                raise ValueError('Frequency must be immediate, daily, or weekly')
            preference.notification_frequency = frequency
        
        preference.save()
        
        return preference
    
    def reset_to_defaults(self):
        """Reset all dashboard customizations to default."""
        preference = self.get_or_create_preference()
        preference.hidden_widgets = []
        preference.widget_order = []
        preference.theme = 'light'
        preference.columns = 3
        preference.save()
        
        return preference
    
    def export_configuration(self):
        """Export current dashboard configuration as dictionary."""
        preference = self.get_or_create_preference()
        
        return {
            'theme': preference.theme,
            'columns': preference.columns,
            'hidden_widgets': preference.hidden_widgets or [],
            'widget_order': preference.widget_order or [],
            'show_notifications': preference.show_notifications,
            'notification_frequency': preference.notification_frequency,
        }
    
    def import_configuration(self, config):
        """Import dashboard configuration from dictionary."""
        preference = self.get_or_create_preference()
        
        if 'theme' in config:
            preference.theme = config['theme']
        if 'columns' in config:
            preference.columns = config['columns']
        if 'hidden_widgets' in config:
            preference.hidden_widgets = config['hidden_widgets']
        if 'widget_order' in config:
            preference.widget_order = config['widget_order']
        if 'show_notifications' in config:
            preference.show_notifications = config['show_notifications']
        if 'notification_frequency' in config:
            preference.notification_frequency = config['notification_frequency']
        
        preference.save()
        
        return preference


class WidgetLayoutService:
    """Service for managing widget layouts and presets."""
    
    LAYOUT_PRESETS = {
        'compact': {
            'columns': 2,
            'hidden_widgets': ['payment_analytics', 'payment_methods'],
        },
        'balanced': {
            'columns': 3,
            'hidden_widgets': [],
        },
        'detailed': {
            'columns': 4,
            'hidden_widgets': [],
        },
        'focus': {
            'columns': 1,
            'hidden_widgets': [
                'payment_methods',
                'payment_analytics',
                'top_students',
                'attendance_overview'
            ],
        },
    }
    
    @staticmethod
    def apply_preset(user, school, preset_name):
        """Apply a layout preset."""
        if preset_name not in WidgetLayoutService.LAYOUT_PRESETS:
            raise ValueError(f'Unknown layout preset: {preset_name}')
        
        preset = WidgetLayoutService.LAYOUT_PRESETS[preset_name]
        service = WidgetCustomizationService(user, school)
        
        service.update_layout_columns(preset['columns'])
        
        preference = service.get_or_create_preference()
        preference.hidden_widgets = preset['hidden_widgets']
        preference.save()
        
        return preference
    
    @staticmethod
    def get_available_presets():
        """Get list of available layout presets."""
        return list(WidgetLayoutService.LAYOUT_PRESETS.keys())
