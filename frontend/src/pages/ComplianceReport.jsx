import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ComplianceReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [systemStats, setSystemStats] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await api.get(`/audit-logs/compliance_report/?${params.toString()}`);
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to fetch compliance report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await api.get('/audit-logs/summary/');
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchSystemStats();
  }, []);

  const handleExport = async () => {
    try {
      if (!report) {
        toast.error('No report to export');
        return;
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const StatBox = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Compliance Report</h1>
              <p className="text-gray-600">User activity and system compliance tracking</p>
            </div>
          </div>
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            <Download size={18} />
            Export Report
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-md bg-white/60 rounded-xl p-4 border border-white/30 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">User ID (Optional)</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Leave blank for current user"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div className="flex items-end">
              <motion.button
                onClick={fetchReport}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Generate Report
              </motion.button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-8 h-8 border-3 border-green-600/20 border-t-green-600 rounded-full"
            />
          </div>
        ) : (
          <>
            {/* User Compliance Report */}
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* User Info */}
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">User: {report.user.full_name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Username</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{report.user.username}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Email</p>
                      <p className="text-sm text-gray-700 mt-1">{report.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Period</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatBox
                      title="Total Actions"
                      value={report.total_actions}
                      icon={TrendingUp}
                      color="bg-blue-500/20 text-blue-600"
                      delay={0}
                    />
                    <StatBox
                      title="Creates"
                      value={report.actions_by_type.CREATE || 0}
                      icon={CheckCircle2}
                      color="bg-green-500/20 text-green-600"
                      delay={0.1}
                    />
                    <StatBox
                      title="Updates"
                      value={report.actions_by_type.UPDATE || 0}
                      icon={BarChart3}
                      color="bg-blue-500/20 text-blue-600"
                      delay={0.2}
                    />
                    <StatBox
                      title="Deletes"
                      value={report.actions_by_type.DELETE || 0}
                      icon={AlertCircle}
                      color="bg-red-500/20 text-red-600"
                      delay={0.3}
                    />
                  </div>
                </div>

                {/* Actions Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(report.actions_by_type || {}).map(([action, count], idx) => (
                      <div
                        key={action}
                        className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-white/30"
                      >
                        <span className="font-bold text-gray-800">{action}</span>
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Entities Modified */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Entities Modified</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(report.entities_modified || {}).map(([entity, count]) => (
                      <div key={entity} className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                        <span className="text-gray-800">{entity.replace(/_/g, ' ')}</span>
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* System-Wide Stats */}
            {systemStats && !report && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900">System-Wide Compliance Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatBox
                    title="Total Changes"
                    value={systemStats.total_changes}
                    icon={TrendingUp}
                    color="bg-blue-500/20 text-blue-600"
                    delay={0}
                  />
                  <StatBox
                    title="Active Users"
                    value={systemStats.active_users}
                    icon={Users}
                    color="bg-purple-500/20 text-purple-600"
                    delay={0.1}
                  />
                  <StatBox
                    title="High Risk Actions"
                    value={systemStats.high_risk_actions.DELETES + systemStats.high_risk_actions.REVERSALS}
                    icon={AlertCircle}
                    color="bg-red-500/20 text-red-600"
                    delay={0.2}
                  />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComplianceReport;
