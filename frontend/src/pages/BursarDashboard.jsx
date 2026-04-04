import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  LogOut,
  MessageCircle,
  AlertTriangle,
  PieChart,
  Activity,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import DashboardCustomizer from '../components/DashboardCustomizer';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtitle, delay, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-white/60 p-6 rounded-xl border border-white/30 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-4 flex-1">
        <div className={`p-3 ${color} rounded-2xl w-fit`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black mt-1 text-gray-800">
              {typeof value === 'number' ? `UGX ${value.toLocaleString()}` : value}
            </h3>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-600 mt-2 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="text-gray-400 opacity-20 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={24} />
      </div>
    </div>
  </motion.div>
);

const PaymentMethodCard = ({ method, data, delay }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-4 space-y-3 group hover:border-primary/50 transition-all"
  >
    <div className="flex items-center justify-between">
      <h4 className="font-bold text-gray-800">{method}</h4>
      <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
        {data.count} {data.count === 1 ? 'payment' : 'payments'}
      </span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">Total Amount</span>
        <span className="font-bold text-gray-800">UGX {data.total.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
        />
      </div>
    </div>
  </motion.div>
);

const RecentPaymentRow = ({ payment, delay }) => (
  <motion.tr 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className="hover:bg-white/40 transition-colors"
  >
    <td className="px-4 py-3 text-sm font-medium text-gray-800">{payment.student_name}</td>
    <td className="px-4 py-3 text-sm text-gray-600">{payment.payment_method}</td>
    <td className="px-4 py-3 text-sm font-bold text-green-600">UGX {payment.amount.toLocaleString()}</td>
    <td className="px-4 py-3 text-sm text-gray-600">
      {new Date(payment.date).toLocaleDateString()}
    </td>
    <td className="px-4 py-3 text-xs font-mono text-gray-500">{payment.reference?.slice(0, 8)}...</td>
  </motion.tr>
);

const StudentRow = ({ student, delay }) => (
  <motion.tr 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className="hover:bg-white/40 transition-colors"
  >
    <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.name}</td>
    <td className="px-4 py-3 text-sm text-gray-600">{student.class}</td>
    <td className="px-4 py-3 text-sm font-bold text-red-600">UGX {student.outstanding_amount.toLocaleString()}</td>
    <td className="px-4 py-3">
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
        student.outstanding_amount > 500000 
          ? 'bg-red-100 text-red-700' 
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        {student.outstanding_amount > 500000 ? 'Critical' : 'Warning'}
      </span>
    </td>
  </motion.tr>
);

const BursarDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/role-dashboard/bursar_dashboard/');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching Bursar dashboard:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-800">No Data Available</h1>
            <p className="text-gray-600">Please set up your school and terms to view the dashboard</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const summary = data.payment_summary || {};
  const topStudents = data.top_outstanding_students || [];
  const recentPayments = data.recent_payments || [];
  const methods = data.payment_methods_breakdown || [];
  const reconciliation = data.reconciliation_stats || {};
  const smsStats = data.sms_stats;

  return (
    <DashboardLayout onLogout={handleLogout}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Bursar Dashboard</h1>
          <p className="text-gray-600">Real-time payment collection and financial insights</p>
        </div>
        <motion.button
          onClick={() => setIsCustomizerOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
        >
          <Settings size={18} />
          Customize
        </motion.button>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 backdrop-blur-md bg-white/40 p-2 rounded-xl border border-white/30 w-fit">
        {['overview', 'methods', 'reconciliation'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-700 hover:text-primary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Fees" 
              value={summary.total_fees} 
              icon={DollarSign}
              color="bg-green-500/20 text-green-600"
              delay={0}
            />
            <StatCard 
              title="Amount Collected" 
              value={summary.total_paid} 
              icon={CheckCircle2}
              color="bg-blue-500/20 text-blue-600"
              delay={0.1}
              trend={15}
            />
            <StatCard 
              title="Outstanding" 
              value={summary.total_outstanding} 
              icon={AlertTriangle}
              color="bg-red-500/20 text-red-600"
              delay={0.2}
            />
            <StatCard 
              title="Collection Rate" 
              value={summary.collection_rate ? `${summary.collection_rate}%` : '0%'}
              icon={Target}
              color="bg-purple-500/20 text-purple-600"
              delay={0.3}
            />
          </div>

          {/* Student Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: summary.total_students, icon: Users, color: 'bg-indigo-500/20 text-indigo-600' },
              { label: 'Paid', value: summary.paid_students, icon: CheckCircle2, color: 'bg-green-500/20 text-green-600' },
              { label: 'Outstanding', value: summary.outstanding_students, icon: Clock, color: 'bg-orange-500/20 text-orange-600' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                className="glass-card p-6 space-y-3 text-center group hover:border-primary/50 transition-all"
              >
                <div className={`p-3 ${item.color} rounded-2xl w-fit mx-auto`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-4xl font-black text-gray-800">{item.value}</h3>
                <p className="text-sm text-gray-600 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Top Outstanding Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="backdrop-blur-md bg-white/60 rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-white/20 flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <h2 className="text-xl font-bold text-gray-800">Top Outstanding Students</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/40 border-b border-white/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Outstanding</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student, idx) => (
                    <StudentRow key={student.id} student={student} delay={idx * 0.05} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="backdrop-blur-md bg-white/60 rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-white/20 flex items-center gap-3">
              <Activity size={24} className="text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/40 border-b border-white/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment, idx) => (
                    <RecentPaymentRow key={payment.id} payment={payment} delay={idx * 0.05} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {methods.map((method, idx) => (
              <PaymentMethodCard 
                key={idx}
                method={method.method} 
                data={method} 
                delay={idx * 0.1}
              />
            ))}
          </motion.div>

          {/* SMS Stats Card */}
          {smsStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card p-6 space-y-4 group hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 text-purple-600 rounded-2xl">
                  <MessageCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">SMS Reminder Configuration</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                    smsStats.is_enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {smsStats.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Budget</span>
                  <span className="font-bold">UGX {smsStats.monthly_budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cost Per SMS</span>
                  <span className="font-bold">UGX {smsStats.sms_cost_per_unit.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Reconciliation Tab */}
      {activeTab === 'reconciliation' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Transactions', value: reconciliation.total, icon: Activity, color: 'bg-blue-500/20 text-blue-600' },
            { label: 'Matched', value: reconciliation.matched, icon: CheckCircle2, color: 'bg-green-500/20 text-green-600' },
            { label: 'Unmatched', value: reconciliation.unmatched, icon: AlertCircle, color: 'bg-yellow-500/20 text-yellow-600' },
            { label: 'Disputed', value: reconciliation.disputed, icon: AlertTriangle, color: 'bg-red-500/20 text-red-600' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card p-6 space-y-3 text-center group hover:border-primary/50 transition-all"
            >
              <div className={`p-3 ${item.color} rounded-2xl w-fit mx-auto`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-4xl font-black text-gray-800">{item.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dashboard Customizer Modal */}
      <DashboardCustomizer 
        isOpen={isCustomizerOpen} 
        onClose={() => setIsCustomizerOpen(false)} 
        role="BURSAR"
      />
    </DashboardLayout>
  );
};

export default BursarDashboard;
