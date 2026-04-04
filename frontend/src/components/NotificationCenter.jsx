import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import useRealtimeNotifications from '../hooks/useRealtimeNotifications';
import useMobile from '../hooks/useMobile';

const NotificationCenter = () => {
  const {
    notifications,
    isConnected,
    connectionError,
    markAsRead,
    dismissAlert,
    removeNotification,
    clearNotifications
  } = useRealtimeNotifications();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const isMobile = useMobile();

  // Don't render if no token
  if (!localStorage.getItem('access_token')) {
    return null;
  }

  // Update unread count
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    setUnreadCount(unreadCount);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'alert':
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-600" />;
      case 'success':
        return <CheckCircle2 size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'alert':
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col gap-2`}>
      {/* Connection Status - only show error message, not as a floating element */}
      {!isConnected && connectionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 shadow-sm text-xs"
        >
          <WifiOff size={16} className="text-red-600 animate-pulse" />
          <span className="text-xs font-bold text-red-700">
            {connectionError || 'Reconnecting...'}
          </span>
        </motion.div>
      )}

      {/* Notification Bell Button */}
      <motion.button
        click={() => setShowPanel(!showPanel)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Bell size={24} />

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status Dot */}
        <div
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`${isMobile ? 'fixed inset-0 w-full h-screen rounded-none' : 'absolute top-16 right-0 w-96 max-h-[80vh] rounded-xl'} bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell size={20} className="text-blue-600" />
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    onClick={clearNotifications}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </motion.button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className={`overflow-y-auto ${isMobile ? 'max-h-[calc(100vh-160px)]' : 'max-h-[calc(80vh-80px)]'}`}>
              {notifications.length > 0 ? (
                <div className="space-y-2 p-3">
                  <AnimatePresence>
                    {notifications.map((notif, idx) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg border ${getNotificationBgColor(notif.type || notif.notification_type)} flex gap-3 hover:shadow-md transition-all group`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notif.type || notif.notification_type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">
                            {notif.subject || notif.title || 'Notification'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock size={12} />
                            {formatTime(notif.timestamp || notif.created_at)}
                          </div>
                        </div>

                        <motion.button
                          onClick={() => removeNotification(notif.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                        >
                          <X size={16} className="text-red-600" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell size={32} className="opacity-30 mb-2" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi size={12} className="text-green-600" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-red-600 animate-pulse" />
                    <span>Reconnecting...</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications (Top Right) */}
      <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => removeNotification(notif.id)}
              className={`p-4 rounded-lg shadow-lg max-w-sm pointer-events-auto cursor-pointer ${getNotificationBgColor(notif.type || notif.notification_type)} border flex items-start gap-3`}
            >
              {getNotificationIcon(notif.type || notif.notification_type)}
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">
                  {notif.subject || notif.title}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  {notif.message?.slice(0, 100)}...
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationCenter;
