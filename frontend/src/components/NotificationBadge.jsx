import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import useRealtimeNotifications from '../hooks/useRealtimeNotifications';

const NotificationBadge = () => {
  const { notifications, isConnected } = useRealtimeNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative">
      {/* Badge Button */}
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <div className="relative">
          <Bell size={18} className="text-gray-700" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {unreadCount > 0 ? unreadCount : '0'}
        </span>
      </motion.button>

      {/* Dropdown Preview */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Recent Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                <div className="space-y-2 p-3">
                  {recentNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notif.subject || notif.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notif.message?.slice(0, 60)}...
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Bell size={24} className="mx-auto opacity-30 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBadge;
