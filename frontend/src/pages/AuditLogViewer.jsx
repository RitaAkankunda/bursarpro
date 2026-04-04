import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Activity,
  Download,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);
  
  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    total_changes: 0,
    by_action: {},
    by_user: {}
  });

  const entityTypes = [
    'PAYMENT', 'STUDENT', 'REFUND', 'REVERSAL', 'USER',
    'SCHOOL', 'TERM', 'FEE_STRUCTURE', 'CLASS', 'SMS_CONFIG',
    'SMS_REMINDER', 'RECONCILIATION', 'BANK_STATEMENT', 'DASHBOARD_WIDGET', 'NOTIFICATION'
  ];

  const actions = [
    'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
    'PROCESS', 'COMPLETE', 'FAIL', 'EXPORT', 'IMPORT',
    'RECONCILE', 'SEND', 'CANCEL', 'REVERT'
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (entityType) params.append('entity_type', entityType);
      if (action) params.append('action', action);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit);
      params.append('offset', offset);
      
      const response = await api.get(`/audit-logs/?${params.toString()}`);
      
      setLogs(response.data.results);
      
      // Fetch stats
      const statsResponse = await api.get('/audit-logs/summary/');
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, action, startDate, endDate, limit, offset]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchLogs();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/audit-logs/search/?q=${encodeURIComponent(searchQuery)}`);
      setLogs(response.data.results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entity_type', entityType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('format', format);
      
      const response = await api.get(`/audit-logs/export/?${params.toString()}`);
      
      const data = format === 'json' ? JSON.stringify(response.data.data, null, 2) : response.data.data;
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      
      toast.success(`Exported to ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'UPDATE':
        return <TrendingUp size={16} className="text-blue-600" />;
      case 'DELETE':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'APPROVE':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'REJECT':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'APPROVE':
        return 'bg-green-100 text-green-800';
      case 'REJECT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setEntityType('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl">
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Audit Logs</h1>
              <p className="text-gray-600">Track all system operations and compliance events</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-600 uppercase">Total Changes</p>
                <p className="text-3xl font-black text-gray-900">{stats.total_changes}</p>
              </div>
              <Activity size={32} className="text-slate-600 opacity-20" />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-600 uppercase">Operations</p>
              <div className="space-y-1">
                {Object.entries(stats.by_action || {}).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-600">{type}:</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-600 uppercase">Active Users</p>
              <div className="space-y-1">
                {Object.entries(stats.by_user || {}).slice(0, 3).map(([user, count]) => (
                  <div key={user} className="flex justify-between text-xs">
                    <span className="text-gray-600">{user}:</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search audit logs..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <motion.button
              onClick={handleSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Search
            </motion.button>
            <motion.button
              onClick={() => setFilterOpen(!filterOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Filter size={18} />
              Filters
            </motion.button>
            <motion.button
              onClick={() => handleExport('json')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
              title="Export as JSON"
            >
              <Download size={18} />
            </motion.button>
          </div>

          {/* Expandable Filters */}
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="backdrop-blur-md bg-white/60 rounded-xl p-4 border border-white/30 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Entity Type</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                  >
                    <option value="">All Types</option>
                    {entityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                  >
                    <option value="">All Actions</option>
                    {actions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">End Date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Clear Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-8 h-8 border-3 border-slate-600/20 border-t-slate-600 rounded-full"
              />
            </div>
          ) : logs.length > 0 ? (
            logs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="backdrop-blur-md bg-white/60 rounded-xl border border-white/30 overflow-hidden hover:border-white/50 transition-all"
              >
                <div
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                          {log.action_display}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{log.entity_type_display}</span>
                        {log.entity_name && <span className="text-sm text-gray-600">- {log.entity_name}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        {log.performed_by && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.performed_by.full_name || log.performed_by.username}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {log.timestamp_display}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-gray-600 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/30 p-4 bg-white/30 space-y-3"
                  >
                    {log.description && (
                      <div>
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">Description</p>
                        <p className="text-sm text-gray-800 font-mono bg-white/50 p-2 rounded">{log.description}</p>
                      </div>
                    )}

                    {Object.keys(log.old_values).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">Previous Values</p>
                        <div className="text-sm bg-white/50 p-3 rounded font-mono">
                          <pre className="overflow-x-auto text-xs">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {Object.keys(log.new_values).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">New Values</p>
                        <div className="text-sm bg-white/50 p-3 rounded font-mono">
                          <pre className="overflow-x-auto text-xs">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-4"
          >
            <motion.button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </motion.button>
            <span className="text-sm text-gray-600">
              Showing {offset + 1} - {offset + logs.length}
            </span>
            <motion.button
              onClick={() => setOffset(offset + limit)}
              disabled={logs.length < limit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
