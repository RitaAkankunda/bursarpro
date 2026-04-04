import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const useDashboardCustomization = () => {
  const [config, setConfig] = useState({
    theme: 'light',
    columns: 3,
    hidden_widgets: [],
    widget_order: [],
    show_notifications: true,
    notification_frequency: 'daily',
  });
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Fetch current configuration
  const fetchConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/widget-customization/');
      setConfig(response.data);
    } catch (err) {
      console.error('Error fetching configuration:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch widgets with customization applied
  const fetchWidgets = useCallback(async () => {
    try {
      const response = await api.get('/widget-customization/get_widgets/');
      setWidgets(response.data.widgets || []);
    } catch (err) {
      console.error('Error fetching widgets:', err);
    }
  }, []);

  // Toggle widget visibility
  const toggleWidget = useCallback(async (widgetType) => {
    try {
      const widget = widgets.find(w => w.widget_type === widgetType);
      await api.post('/widget-customization/toggle_widget/', {
        widget_type: widgetType,
        is_visible: !widget.is_visible
      });

      // Update local state
      setWidgets(widgets.map(w =>
        w.widget_type === widgetType
          ? { ...w, is_visible: !w.is_visible }
          : w
      ));

      toast.success(`Widget ${!widget.is_visible ? 'shown' : 'hidden'}`);
    } catch (err) {
      console.error('Error toggling widget:', err);
      toast.error('Failed to update widget');
    }
  }, [widgets]);

  // Update theme
  const updateTheme = useCallback(async (theme) => {
    try {
      await api.post('/widget-customization/update_theme/', { theme });
      setConfig(prev => ({ ...prev, theme }));
      toast.success(`Theme changed to ${theme}`);
    } catch (err) {
      console.error('Error updating theme:', err);
      toast.error('Failed to update theme');
    }
  }, []);

  // Update columns
  const updateColumns = useCallback(async (columns) => {
    try {
      await api.post('/widget-customization/update_columns/', { columns });
      setConfig(prev => ({ ...prev, columns }));
      toast.success(`Layout changed to ${columns} columns`);
    } catch (err) {
      console.error('Error updating columns:', err);
      toast.error('Failed to update layout');
    }
  }, []);

  // Get visible widgets
  const getVisibleWidgets = useCallback(() => {
    return widgets.filter(w => w.is_visible).sort((a, b) => a.order - b.order);
  }, [widgets]);

  // Initialize on mount
  useEffect(() => {
    fetchConfiguration();
    fetchWidgets();
  }, [fetchConfiguration, fetchWidgets]);

  return {
    config,
    widgets,
    loading,
    isCustomizerOpen,
    setIsCustomizerOpen,
    fetchConfiguration,
    fetchWidgets,
    toggleWidget,
    updateTheme,
    updateColumns,
    getVisibleWidgets,
  };
};

export default useDashboardCustomization;
