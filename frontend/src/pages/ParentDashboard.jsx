import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  DollarSign,
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Calendar,
  BookOpen,
  User,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  Clock,
  FileText,
  Home,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardCustomizer from '../components/DashboardCustomizer';

const PaymentStatusCard = ({ label, value, icon: Icon, color, subtitle, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-white/60 p-6 rounded-xl border border-white/30 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className={`p-3 ${color} rounded-2xl w-fit`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-black mt-1 text-gray-800">
            {typeof value === 'number' ? `UGX ${value.toLocaleString()}` : value}
          </h3>
          {subtitle && <p className="text-xs text-gray-600 mt-2 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="text-gray-400 opacity-20 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={24} />
      </div>
    </div>
  </motion.div>
);

const StudentInfoCard = ({ student, delay }) => {
  const paymentProgress = student.total_fees > 0 
    ? Math.round((student.amount_paid / student.total_fees) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-8 space-y-6 group hover:border-primary/50 transition-all max-w-2xl mx-auto"
    >
      {/* Student Header */}
      <div className="flex items-start justify-between border-b border-white/20 pb-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-800">{student.student_name}</h2>
          <p className="text-gray-600 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            Class {student.class}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm ${
          student.payment_status === 'PAID'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {student.payment_status === 'PAID' ? '✓ Paid' : 'Pending'}
        </div>
      </div>

      {/* Fee Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total Fee</span>
          <span className="text-xl font-black text-gray-800">UGX {student.total_fees.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Amount Paid</span>
          <span className="text-xl font-black text-green-600">UGX {student.amount_paid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Outstanding</span>
          <span className={`text-xl font-black ${student.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            UGX {student.outstanding.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 pt-4 border-t border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">Payment Progress</span>
          <span className="text-sm font-bold text-gray-800">{paymentProgress}%</span>
        </div>
        <div className="h-3 w-full bg-white/40 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${paymentProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Make Payment
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-4 py-3 bg-white/40 text-primary font-bold rounded-lg border border-white/30 hover:border-primary/50 transition-all"
        >
          View Invoice
        </motion.button>
      </div>
    </motion.div>
  );
};

const PaymentHistoryRow = ({ payment, index }) => (
  <motion.tr 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="hover:bg-white/40 transition-colors border-b border-white/10"
  >
    <td className="px-4 py-4 text-sm font-medium text-gray-800">
      {new Date(payment.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })}
    </td>
    <td className="px-4 py-4 text-sm font-bold text-green-600">+UGX {payment.amount.toLocaleString()}</td>
    <td className="px-4 py-4 text-sm text-gray-600">
      <span className="font-mono">{payment.reference}</span>
    </td>
    <td className="px-4 py-4">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100/50 px-3 py-1 rounded-full">
        <CheckCircle2 size={12} />
        Completed
      </span>
    </td>
  </motion.tr>
);

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
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
        const response = await api.get('/role-dashboard/parent_dashboard/');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching Parent dashboard:', err);
        if (err.response?.status === 404) {
          toast.error('Student record not found. Please contact your school.');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogoutClick = () => {
    handleLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  if (!data || !data.student_summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-gray-900">Parent Portal</h1>
            <p className="text-gray-600">Manage your student's fees</p>
          </div>
          <motion.button
            onClick={handleLogoutClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </motion.div>

        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-800">No Student Data</h1>
            <p className="text-gray-600">We couldn't find your student information. Please contact your school.</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = data.student_summary;
  const history = data.payment_history || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header with Logout */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-white/60 border-b border-white/30 shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Home size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Parent Portal</h1>
              <p className="text-xs text-gray-600">School Fee Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsCustomizerOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              <Settings size={18} />
              Customize
            </motion.button>
            <motion.button
              onClick={handleLogoutClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 backdrop-blur-md bg-white/40 p-2 rounded-xl border border-white/30 w-fit">
          {['summary', 'history'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-8">
            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PaymentStatusCard 
                label="Total Fee" 
                value={summary.total_fees} 
                icon={FileText}
                color="bg-blue-500/20 text-blue-600"
                delay={0}
              />
              <PaymentStatusCard 
                label="Amount Paid" 
                value={summary.amount_paid} 
                icon={CheckCircle2}
                color="bg-green-500/20 text-green-600"
                delay={0.1}
              />
              <PaymentStatusCard 
                label="Outstanding" 
                value={summary.outstanding} 
                icon={Clock}
                color={summary.outstanding > 0 ? "bg-red-500/20 text-red-600" : "bg-green-500/20 text-green-600"}
                delay={0.2}
              />
            </div>

            {/* Student Information */}
            <StudentInfoCard student={summary} delay={0.3} />

            {/* Status Message */}
            {summary.payment_status === 'PAID' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-card p-6 bg-green-100/50 border-green-200 flex items-start gap-4"
              >
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-green-800 mb-1">Payment Complete</h3>
                  <p className="text-sm text-green-700">All fees for the current term have been paid. Thank you!</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-card p-6 bg-yellow-100/50 border-yellow-200 flex items-start gap-4"
              >
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-1">Pending Payment</h3>
                  <p className="text-sm text-yellow-700">
                    UGX {summary.outstanding.toLocaleString()} outstanding. Please complete payment at your earliest convenience.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-md bg-white/60 rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-white/20 flex items-center gap-3">
              <TrendingUp size={24} className="text-primary" />
              <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
            </div>
            
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">No payments yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/40 border-b border-white/20">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Reference</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((payment, idx) => (
                      <PaymentHistoryRow key={idx} payment={payment} index={idx} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Dashboard Customizer Modal */}
      <DashboardCustomizer 
        isOpen={isCustomizerOpen} 
        onClose={() => setIsCustomizerOpen(false)} 
        role="PARENT"
      />
    </div>
  );
};

export default ParentDashboard;
