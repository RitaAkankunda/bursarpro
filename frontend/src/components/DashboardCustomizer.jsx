import { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw, Settings } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DashboardCustomizer = ({ isOpen, onClose, role }) => {
  const [widgets, setWidgets] = useState([]);
  const [theme, setTheme] = useState('light');
  const [columns, setColumns] = useState(3);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch current configuration
      const configRes = await api.get('/widget-customization/');
      setTheme(configRes.data.theme || 'light');
      setColumns(configRes.data.columns || 3);
      
      // Fetch widgets with customization
      const widgetsRes = await api.get('/widget-customization/get_widgets/');
      setWidgets(widgetsRes.data.widgets || []);
      
      // Fetch available presets
      const presetsRes = await api.get('/widget-customization/presets/');
      setPresets(presetsRes.data.presets || []);
    } catch (err) {
      console.error('Error fetching customization data:', err);
      toast.error('Failed to load dashboard customization');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWidget = async (widgetType, currentVisibility) => {
    try {
      await api.post('/widget-customization/toggle_widget/', {
        widget_type: widgetType,
        is_visible: !currentVisibility
      });
      
      // Update local state
      setWidgets(widgets.map(w => 
        w.widget_type === widgetType 
          ? { ...w, is_visible: !currentVisibility }
          : w
      ));
      
      toast.success(`Widget ${!currentVisibility ? 'shown' : 'hidden'}`);
    } catch (err) {
      console.error('Error toggling widget:', err);
      toast.error('Failed to update widget visibility');
    }
  };

  const handleReorderWidgets = async (newOrder) => {
    try {
      await api.post('/widget-customization/reorder_widgets/', {
        widget_order: newOrder
      });
      toast.success('Widget order updated');
    } catch (err) {
      console.error('Error reordering widgets:', err);
      toast.error('Failed to update widget order');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedItem];
    
    newWidgets.splice(draggedItem, 1);
    newWidgets.splice(targetIndex, 0, draggedWidget);
    
    setWidgets(newWidgets);
    
    // Send update to backend
    const widgetOrder = newWidgets.map(w => w.widget_type);
    handleReorderWidgets(widgetOrder);
    
    setDraggedItem(null);
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await api.post('/widget-customization/update_theme/', {
        theme: newTheme
      });
      setTheme(newTheme);
      toast.success(`Theme changed to ${newTheme}`);
    } catch (err) {
      console.error('Error updating theme:', err);
      toast.error('Failed to update theme');
    }
  };

  const handleColumnsChange = async (newColumns) => {
    try {
      await api.post('/widget-customization/update_columns/', {
        columns: newColumns
      });
      setColumns(newColumns);
      toast.success(`Layout changed to ${newColumns} columns`);
    } catch (err) {
      console.error('Error updating columns:', err);
      toast.error('Failed to update layout');
    }
  };

  const handleApplyPreset = async (presetName) => {
    try {
      await api.post('/widget-customization/apply_preset/', {
        preset: presetName
      });
      await fetchInitialData();
      toast.success(`Applied ${presetName} layout preset`);
    } catch (err) {
      console.error('Error applying preset:', err);
      toast.error('Failed to apply preset');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all dashboard customizations to defaults?')) {
      try {
        await api.post('/widget-customization/reset/');
        await fetchInitialData();
        toast.success('Dashboard reset to defaults');
      } catch (err) {
        console.error('Error resetting:', err);
        toast.error('Failed to reset dashboard');
      }
    }
  };

  const widgetLabels = {
    payment_summary: 'Payment Summary',
    outstanding_fees: 'Outstanding Fees',
    recent_payments: 'Recent Payments',
    class_performance: 'Class Performance',
    student_roster: 'Student Roster',
    attendance_overview: 'Attendance Overview',
    fee_breakdown: 'Fee Breakdown',
    sms_reminders_stats: 'SMS Reminders Statistics',
    bank_reconciliation: 'Bank Reconciliation',
    payment_methods: 'Payment Methods',
    payment_analytics: 'Payment Analytics',
    top_students: 'Top Students',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] backdrop-blur-md bg-white/80 border border-white/30 rounded-2xl shadow-2xl overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 backdrop-blur-md bg-white/60 border-b border-white/30 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings size={24} className="text-primary" />
                  <h2 className="text-2xl font-black text-gray-900">Customize Dashboard</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full"
                    />
                  </div>
                ) : (
                  <>
                    {/* Theme Selection */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-800">Theme</h3>
                      <div className="flex gap-3">
                        {['light', 'dark'].map((t) => (
                          <button
                            key={t}
                            onClick={() => handleThemeChange(t)}
                            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all capitalize ${
                              theme === t
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/40 text-gray-700 hover:bg-white/60'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Columns */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-800">Layout Columns</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((col) => (
                          <button
                            key={col}
                            onClick={() => handleColumnsChange(col)}
                            className={`py-3 rounded-lg font-bold transition-all ${
                              columns === col
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/40 text-gray-700 hover:bg-white/60'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Presets */}
                    {presets.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-gray-800">Quick Presets</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {presets.map((preset) => (
                            <button
                              key={preset}
                              onClick={() => handleApplyPreset(preset)}
                              className="px-4 py-2 bg-white/40 hover:bg-primary/20 text-gray-700 hover:text-primary font-bold rounded-lg transition-all capitalize"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Widgets Reordering */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-800">Widgets (drag to reorder)</h3>
                      <div className="space-y-2 bg-white/40 p-4 rounded-lg">
                        {widgets.length > 0 ? (
                          widgets.map((widget, index) => (
                            <motion.div
                              key={widget.widget_type}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                              className={`flex items-center gap-3 p-3 bg-white/60 border border-white/30 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                                draggedItem === index ? 'opacity-50' : ''
                              }`}
                            >
                              <GripVertical size={18} className="text-gray-400" />
                              <span className="flex-1 font-medium text-gray-800">
                                {widgetLabels[widget.widget_type] || widget.widget_type}
                              </span>
                              <button
                                onClick={() => handleToggleWidget(widget.widget_type, widget.is_visible)}
                                className="p-2 hover:bg-white/40 rounded-lg transition-colors"
                                title={widget.is_visible ? 'Hide widget' : 'Show widget'}
                              >
                                {widget.is_visible ? (
                                  <Eye size={18} className="text-green-600" />
                                ) : (
                                  <EyeOff size={18} className="text-gray-400" />
                                )}
                              </button>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center text-gray-600 py-4">No widgets available</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/20">
                      <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 font-bold rounded-lg transition-all"
                      >
                        <RotateCcw size={18} />
                        Reset to Defaults
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/80 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DashboardCustomizer;
