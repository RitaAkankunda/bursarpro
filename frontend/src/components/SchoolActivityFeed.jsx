import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SchoolActivityFeed = ({ limit = 50, compact = false }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial activities
  useEffect(() => {
    fetchActivities();
    const unsubscribe = setupWebSocket();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/activity-logs/school_activity_feed/?limit=${limit}`);
      setActivities(response.data.results || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/activity/`);
      
      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe' }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') return;
        
        if (data.activity && autoRefresh) {
          setActivities(prev => {
            const updated = [data.activity, ...prev];
            return updated.slice(0, limit);
          });
          toast.success(`${data.activity.title}`, {
            icon: <Activity className="text-blue-500" />,
            duration: 2,
          });
        }
      };
      
      ws.onerror = () => setWsConnected(false);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(setupWebSocket, 5000);
      };
      
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      
      return () => clearInterval(pingInterval);
    } catch (err) {
      console.error('WebSocket error:', err);
    }
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      'PAYMENT': <CheckCircle2 size={20} className="text-green-500" />,
      'REFUND': <RefreshCw size={20} className="text-orange-500" />,
      'STUDENT_CREATED': <User size={20} className="text-blue-500" />,
      'SMS_SENT': <Activity size={20} className="text-purple-500" />,
      'ALERT_GENERATED': <AlertCircle size={20} className="text-red-500" />,
    };
    return iconMap[type] || <Activity size={20} className="text-gray-500" />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'PAYMENT': 'bg-green-50 border-green-200',
      'REFUND': 'bg-orange-50 border-orange-200',
      'STUDENT_CREATED': 'bg-blue-50 border-blue-200',
      'SMS_SENT': 'bg-purple-50 border-purple-200',
      'ALERT_GENERATED': 'bg-red-50 border-red-200',
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const seconds = diff / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (days < 7) return `${Math.floor(days)}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredActivities = filter === 'ALL' 
    ? activities 
    : activities.filter(a => a.activity_type === filter);

  if (compact) {
    // Compact dashboard widget
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Activity Timeline
          </h3>
          {wsConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
        </div>
        
        <div className="divide-y max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No activities yet</div>
          ) : (
            filteredActivities.slice(0, 10).map((activity) => (
              <div key={activity.id} className={`p-3 hover:bg-opacity-75 transition-all border-l-4 ${getActivityColor(activity.activity_type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600 truncate">
                        {activity.user_name}
                      </p>
                      <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Full activity feed view
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={24} className="text-blue-600" />
          School Activity Feed
        </h2>
        <div className="flex items-center gap-3">
          {wsConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Updates
            </div>
          )}
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PAYMENT', 'REFUND', 'STUDENT_CREATED', 'SMS_SENT', 'ALERT_GENERATED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap text-sm ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">No activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getActivityColor(activity.activity_type)}`}
              onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
            >
              <div className="flex items-start gap-3">
                {getActivityIcon(activity.activity_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-lg">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        by <span className="font-semibold">{activity.user_name}</span>
                        {activity.student_name && ` for ${activity.student_name}`}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform flex-shrink-0 text-gray-400 ${
                        expandedId === activity.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {expandedId === activity.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 pt-4 border-t-2 border-opacity-30 space-y-3 text-sm"
                    >
                      <div>
                        <p className="text-gray-600 font-semibold">Description</p>
                        <p className="text-gray-900 mt-1">{activity.description}</p>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div>
                          <p className="text-gray-600 font-semibold">Additional Details</p>
                          <div className="bg-white bg-opacity-50 p-3 rounded mt-1 space-y-1">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                                <span className="text-gray-900 font-semibold">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="px-2 py-1 bg-white bg-opacity-50 rounded">
                      {activity.activity_type_display}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchoolActivityFeed;
