import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  TrendingDown,
  LogOut,
  Loader2,
  Download,
  Filter,
  MoreVertical,
  AlertTriangle,
  Phone,
  Eye,
  Send,
  ArrowLeft,
  Zap,
  CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import AnimatedGauge from '../components/AnimatedGauge';
import PaymentHeatmap from '../components/PaymentHeatmap';

const StatCard = ({ title, value, icon, color = 'orange', subtitle, delay, trend, isLoading, onClick }) => {
  const bgColorMap = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className={`backdrop-blur-md bg-white/80 p-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl relative overflow-hidden group transition-all ${onClick ? 'cursor-pointer hover:bg-white/95' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className={`p-3 ${bgColorMap[color]} rounded-2xl w-fit`}>
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : icon}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-black text-gray-900">
                {typeof value === 'number' ? (title.includes('Student') ? value.toLocaleString() : `UGX ${value.toLocaleString()}`) : value}
              </h3>
              {trend && (
                <span className={`text-sm font-semibold flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? <ArrowUpRight size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-2 font-medium">{subtitle}</p>}
          </div>
        </div>
        <div className={`text-${color}-600 opacity-15 group-hover:opacity-30 transition-opacity`}>
          <ArrowUpRight size={32} />
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced unpaid students card with action items
const UnpaidStudentsCard = ({ students, onContact }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.3 }}
    className="backdrop-blur-md bg-white/80 rounded-2xl border border-white/40 shadow-lg overflow-hidden"
  >
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-6 border-b border-red-200/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top Unpaid Students</h3>
            <p className="text-sm text-gray-600 font-medium">{students.length} students with outstanding fees</p>
          </div>
        </div>
      </div>
    </div>
    
    <div className="divide-y divide-gray-200">
      {students.slice(0, 5).map((student, idx) => (
        <motion.div
          key={student.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + idx * 0.1 }}
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{student.name}</h4>
              <p className="text-sm text-gray-500">{student.class}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                  UGX {student.outstanding.toLocaleString()} outstanding
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {student.parent_phone && (
                <button
                  onClick={() => onContact?.(student)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-gray-600 hover:text-blue-600"
                  title="Send SMS"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2 group">
        View All <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
      </button>
    </div>
  </motion.div>
);

// Drill-down collection breakdown
const CollectionBreakdownCard = ({ data, setSelectedClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.4 }}
    className="backdrop-blur-md bg-white/80 rounded-2xl border border-white/40 shadow-lg p-6"
  >
    <h3 className="text-lg font-bold text-gray-900 mb-4">Collection by Class</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
        <Bar dataKey="collected" fill="#f97316" radius={[8, 8, 0, 0]} onClick={(data) => setSelectedClass?.(data)} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const Overview = () => {
  const navigate = useNavigate();
  const { dashboardStats, updateStats, selectedTerm, updateTerm } = useDashboard();
  const [terms, setTerms] = useState([]);
  const [localSelectedTerm, setLocalSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [contactModal, setContactModal] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleExport = useCallback(() => {
    if (!dashboardStats) return;

    const csvContent = [
      ['Financial Overview Report'],
      ['Term:', dashboardStats.term],
      ['School:', dashboardStats.school_name],
      ['Report Date:', new Date().toLocaleDateString()],
      [],
      ['FINANCIAL SUMMARY'],
      ['Total Expected', `UGX ${dashboardStats.total_expected?.toLocaleString()}`],
      ['Total Collected', `UGX ${dashboardStats.total_collected?.toLocaleString()}`],
      ['Total Outstanding', `UGX ${dashboardStats.total_outstanding?.toLocaleString()}`],
      ['Collection Rate %', dashboardStats.collection_rate_percent],
      [],
      ['STUDENT SUMMARY'],
      ['Total Students', dashboardStats.total_students],
      ['Paid Students', dashboardStats.students_paid],
      ['Unpaid Students', dashboardStats.students_unpaid],
    ].map(row => row.join(',')).join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `financial-overview-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [dashboardStats]);

  // Memoized class breakdown for better performance
  const classBreakdownData = useMemo(() => {
    if (!dashboardStats?.unpaid_students) return [];
    
    const breakdown = {};
    dashboardStats.unpaid_students.forEach(student => {
      if (!breakdown[student.class]) {
        breakdown[student.class] = { name: student.class, collected: 0, outstanding: 0 };
      }
      breakdown[student.class].outstanding += student.outstanding;
      breakdown[student.class].collected += student.paid;
    });
    return Object.values(breakdown);
  }, [dashboardStats]);

  const { data: fetchedTerms = [], isLoading: termsLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await api.get('/terms/');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (fetchedTerms.length > 0) {
      setTerms(fetchedTerms);
      if (!localSelectedTerm) {
        setLocalSelectedTerm(fetchedTerms[0].id);
        updateTerm(fetchedTerms[0].id);
      }
    }
  }, [fetchedTerms, localSelectedTerm, updateTerm]);

  const { data: fetchedStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', localSelectedTerm],
    queryFn: async () => {
      const res = await api.get(`/dashboard/?term_id=${localSelectedTerm}`);
      return res.data;
    },
    enabled: !!localSelectedTerm,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    if (fetchedStats) {
      updateStats(fetchedStats);
    }
  }, [fetchedStats, updateStats]);

  const { data: analyticsData = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsData', terms],
    queryFn: async () => {
      if (!terms || terms.length === 0) return [];
      
      const promises = terms.map(term => api.get(`/dashboard/?term_id=${term.id}`));
      const results = await Promise.all(promises);
      
      const data = results.map((res, index) => ({
        name: terms[index].name,
        Expected: res.data.total_expected,
        Collected: res.data.total_collected,
        Outstanding: res.data.total_outstanding
      })).reverse();
      
      return data;
    },
    enabled: terms.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleTermChange = (e) => {
    setLocalSelectedTerm(e.target.value);
    updateTerm(e.target.value);
  };

  if (termsLoading) return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 pb-20 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-20">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!termsLoading && terms.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 shadow-2xl p-12 max-w-md text-center space-y-6">
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-white">No Active Terms</h2>
              <p className="text-text-muted max-w-md font-medium">You need to set up academic terms before viewing dashboard statistics.</p>
            </div>
            <button 
              onClick={() => navigate('/settings')} 
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95 w-full flex items-center justify-center gap-2"
            >
              Go to Settings <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = statsLoading || analyticsLoading;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/80 hover:bg-white border border-gray-300 rounded-lg transition hover:shadow-md"
              title="Go Back"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                Financial Overview
              </h1>
              <p className="text-gray-600 text-sm font-medium mt-2">Dashboard • {dashboardStats?.school_name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-gray-300 rounded-lg transition font-semibold text-gray-700"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-gray-300 rounded-lg transition font-semibold text-gray-700"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/80 hover:bg-white border border-gray-300 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-700" />
            </button>
          </div>
        </motion.div>

        {/* Term Selector & Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-md bg-white/70 rounded-2xl p-4 border border-white/40 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Select Term:
              </label>
              <select
                value={localSelectedTerm}
                onChange={handleTermChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800 font-semibold"
              >
                {terms.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : dashboardStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard 
                title="Total Expected"
                value={dashboardStats.total_expected}
                icon={<TrendingUp size={24} />}
                color="blue"
                subtitle={`${dashboardStats.total_students} students`}
                delay={0.1}
              />
              <StatCard 
                title="Total Collected"
                value={dashboardStats.total_collected}
                icon={<CheckCircle2 size={24} />}
                color="green"
                subtitle={`${dashboardStats.students_paid} students paid`}
                trend={dashboardStats.collection_rate_percent > 50 ? 12 : -8}
                delay={0.2}
              />
              <StatCard 
                title="Outstanding"
                value={dashboardStats.total_outstanding}
                icon={<AlertTriangle size={24} />}
                color="red"
                subtitle={`${dashboardStats.students_unpaid} students pending`}
                delay={0.3}
              />
              <StatCard 
                title="Avg Per Student"
                value={dashboardStats.average_payment_per_student}
                icon={<Users size={24} />}
                color="purple"
                subtitle="Among those paid"
                delay={0.4}
              />
              <StatCard 
                title="Collection Rate"
                value={`${dashboardStats.collection_rate_percent}%`}
                icon={<TrendingUp size={24} />}
                color="orange"
                subtitle="Progress to target"
                delay={0.5}
              />
            </div>

            {/* Enhanced Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="backdrop-blur-md bg-white/70 rounded-2xl p-6 border border-white/40 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-2.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/payments')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-150 hover:to-blue-100 border border-blue-200 rounded-lg text-blue-700 font-bold text-sm transition-all"
                  >
                    📊 Record Payment
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/students')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-100 to-green-50 hover:from-green-150 hover:to-green-100 border border-green-200 rounded-lg text-green-700 font-bold text-sm transition-all"
                  >
                    👥 View Students
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/refunds')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-150 hover:to-purple-100 border border-purple-200 rounded-lg text-purple-700 font-bold text-sm transition-all"
                  >
                    🔄 Manage Refunds
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/reports')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-150 hover:to-amber-100 border border-amber-200 rounded-lg text-amber-700 font-bold text-sm transition-all"
                  >
                    📈 View Reports
                  </motion.button>
                </div>
              </motion.div>

              {/* Collection Gauge & Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="lg:col-span-2 backdrop-blur-md bg-white/70 rounded-2xl p-8 border border-white/40 shadow-lg"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Collection Progress</h3>
                    <p className="text-gray-600 text-sm mt-1">Term: {dashboardStats.term}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-orange-600">{dashboardStats.collection_rate_percent}%</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Collection Rate</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">Collected</span>
                      <span className="text-sm font-bold text-green-600">UGX {dashboardStats.total_collected?.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (dashboardStats.total_collected / dashboardStats.total_expected) * 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">Outstanding</span>
                      <span className="text-sm font-bold text-red-600">UGX {dashboardStats.total_outstanding?.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (dashboardStats.total_outstanding / dashboardStats.total_expected) * 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
                  <div className="text-blue-600 flex-shrink-0 mt-1">ℹ️</div>
                  <div className="text-sm text-blue-900 font-medium">
                    <strong>Quick Action:</strong> Send SMS reminders to unpaid students to increase collection rate.
                  </div>
                </div>
              </motion.div>

              {/* Unpaid Students List */}
              <UnpaidStudentsCard 
                students={dashboardStats.unpaid_students || []}
                onContact={(student) => setContactModal(student)}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Line Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="backdrop-blur-md bg-white/70 rounded-2xl p-6 border border-white/40 shadow-lg"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historical Trends</h3>
                {analyticsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="text-orange-600 animate-spin" size={28} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Expected" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="Collected" stroke="#10b981" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Collection Breakdown */}
              <CollectionBreakdownCard 
                data={classBreakdownData}
                setSelectedClass={setSelectedClass}
              />
            </div>

            {/* Recent Payments Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/40 shadow-lg overflow-hidden mt-8"
            >
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {dashboardStats.recent_payments?.slice(0, 5).map((payment, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + idx * 0.05 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{payment.student}</p>
                      <p className="text-xs text-gray-500 font-medium">{payment.receipt}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">UGX {payment.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                )) || <div className="px-6 py-8 text-center text-gray-500">No recent payments</div>}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default Overview;
