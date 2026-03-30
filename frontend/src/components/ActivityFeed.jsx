/**
 * Real-Time Activity Feed Component
 * Shows live payment notifications, alerts, and system activities
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Bell,
  Zap
} from 'lucide-react';

const ActivityFeed = ({ schoolId, termId, maxItems = 8 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  const getActivityIcon = (action, entityType) => {
    const iconProps = { size: 18, strokeWidth: 2.5 };

    if (action === 'CREATE' || action === 'PROCESS') {
      return <CheckCircle className="text-emerald-500" {...iconProps} />;
    } else if (action === 'UPDATE') {
      return <TrendingUp className="text-blue-500" {...iconProps} />;
    } else if (action === 'DELETE' || action === 'FAIL') {
      return <XCircle className="text-red-500" {...iconProps} />;
    } else if (action === 'APPROVE') {
      return <Zap className="text-yellow-500" {...iconProps} />;
    } else {
      return <FileText className="text-gray-500" {...iconProps} />;
    }
  };

  const getActivityColor = (action) => {
    const colors = {
      CREATE: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
      UPDATE: 'bg-blue-50 border-blue-200 hover:bg-blue-100/70',
      DELETE: 'bg-red-50 border-red-200 hover:bg-red-100/70',
      APPROVE: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100/70',
      REJECT: 'bg-orange-50 border-orange-200 hover:bg-orange-100/70',
      PROCESS: 'bg-purple-50 border-purple-200 hover:bg-purple-100/70',
      COMPLETE: 'bg-green-50 border-green-200 hover:bg-green-100/70',
      FAIL: 'bg-red-50 border-red-200 hover:bg-red-100/70',
    };
    return colors[action] || 'bg-gray-50 border-gray-200 hover:bg-gray-100/70';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  const getActivityDescription = (log) => {
    const descriptions = {
      PAYMENT_CREATE: `📝 Payment recorded${log.new_values?.amount ? ` for UGX ${log.new_values.amount}` : ''}`,
      PAYMENT_UPDATE: `🔄 Payment updated by ${log.performed_by?.username || 'User'}`,
      REFUND_CREATE: `💰 Refund initiated`,
      REFUND_APPROVE: `✅ Refund approved`,
      REVERSAL_PROCESS: `⚠️ Payment reversal processed`,
      STUDENT_CREATE: `👤 New student registered`,
      USER_CREATE: `🔐 New user account created`,
    };

    const key = `${log.entity_type}_${log.action}`;
    return descriptions[key] || `${log.action} - ${log.entity_type}`;
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        };

        const response = await api.get('/audit-logs/', {
          params: {
            limit: maxItems,
            ordering: '-timestamp'
          },
          headers
        });

        setActivities(Array.isArray(response.data) ? response.data : response.data.results || []);
      } catch (err) {
        console.error('Error fetching activity feed:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Poll for new activities every 10 seconds
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [maxItems]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-100">
        <Bell size={32} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onMouseEnter={() => setHoveredId(activity.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`p-4 rounded-lg border-2 border-l-4 transition-all duration-200 cursor-pointer ${getActivityColor(
              activity.action
            )} ${hoveredId === activity.id ? 'shadow-md scale-[1.02]' : 'shadow-sm'}`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                {getActivityIcon(activity.action, activity.entity_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2">
                      {getActivityDescription(activity)}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{activity.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-block px-2 py-1 bg-white/50 rounded text-xs font-bold text-gray-700 uppercase">
                    {activity.entity_type}
                  </span>
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(activity.timestamp)}
                  </span>
                  {activity.performed_by && (
                    <span className="text-xs text-gray-600 font-medium">
                      by {activity.performed_by.username}
                    </span>
                  )}
                </div>
              </div>

              {hoveredId === activity.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 text-gray-400"
                >
                  <RefreshCw size={16} />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ActivityFeed;
