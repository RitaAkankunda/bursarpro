import { useState, useEffect } from 'react';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import AnimatedGauge from '../components/AnimatedGauge';
import PaymentHeatmap from '../components/PaymentHeatmap';

const StatCard = ({ title, value, icon, color, subtitle, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-white/60 p-6 rounded-xl border border-white/30 shadow-lg relative overflow-hidden group"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-4">
        <div className={`p-3 bg-orange-100 text-orange-600 rounded-2xl w-fit`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black mt-1 text-gray-800">UGX {value.toLocaleString()}</h3>
          </div>
          {subtitle && <p className="text-xs text-gray-600 mt-2 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="text-orange-600 opacity-20 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={24} />
      </div>
    </div>
  </motion.div>
);

const Overview = () => {
  const navigate = useNavigate();
  const { dashboardStats, updateStats, selectedTerm, updateTerm } = useDashboard();
  const [terms, setTerms] = useState([]);
  const [localSelectedTerm, setLocalSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const { data: fetchedTerms = [], isLoading: termsLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await api.get('/terms/');
      return res.data;
    }
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
    enabled: !!localSelectedTerm
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
      
      // Format data for Recharts, reversing to show chronological order (assuming API returns newest first)
      const data = results.map((res, index) => ({
        name: terms[index].name,
        Expected: res.data.total_expected,
        Collected: res.data.total_collected,
        Outstanding: res.data.total_outstanding
      })).reverse();
      
      return data;
    },
    enabled: terms.length > 0
  });

  const handleTermChange = (e) => {
    setLocalSelectedTerm(e.target.value);
    updateTerm(e.target.value);
  };

  if (termsLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6 pb-20 space-y-6">
       <div className="max-w-6xl mx-auto space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
         </div>
       </div>
    </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              Financial Overview
            </h1>
            <p className="text-gray-600 text-sm font-medium mt-1">Real-time performance metrics for your school</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg transition border border-gray-200"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </motion.div>

        {/* Term Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-md bg-white/50 rounded-xl p-4 border border-white/30"
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Term:
          </label>
          <select
            value={localSelectedTerm}
            onChange={handleTermChange}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
          >
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </motion.div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : dashboardStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Total Expected"
              value={dashboardStats.total_expected}
              icon={<TrendingUp size={24} />}
              color="primary"
              subtitle={`${dashboardStats.total_students} Students registered`}
              delay={0.1}
            />
            <StatCard 
              title="Total Collected"
              value={dashboardStats.total_collected}
              icon={<CheckCircle2 size={24} />}
              color="emerald-400"
              subtitle={`${dashboardStats.students_with_payments} Students have paid`}
              delay={0.2}
            />
            <StatCard 
              title="Total Outstanding"
              value={dashboardStats.total_outstanding}
              icon={<AlertCircle size={24} />}
              color="accent"
              subtitle={`${dashboardStats.students_without_payments} Students pending`}
              delay={0.3}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-gray-800">Fee Collection Rate</h3>
                <span className="text-orange-600 font-black text-2xl">{dashboardStats.collection_rate_percent}%</span>
              </div>
              
              <div className="space-y-4">
                <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden p-1 border border-gray-300">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardStats.collection_rate_percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600 uppercase tracking-widest">
                  <span>0% Target</span>
                  <span>100% Goal</span>
                </div>
              </div>

              <div className="p-6 bg-orange-100 border border-orange-200 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-orange-200 rounded-xl text-orange-600">
                  <TrendingUp size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-800">Good Progress!</p>
                  <p className="text-xs text-gray-700 leading-relaxed">You are currently {dashboardStats.collection_rate_percent}% towards your term goal. Send SMS reminders to students with balances.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg flex flex-col justify-center text-center space-y-4"
            >
              <div className="p-4 rounded-2xl bg-orange-100 w-fit mx-auto">
                <Users size={32} className="text-orange-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-gray-800">{dashboardStats.total_students}</h3>
                <p className="text-gray-600 uppercase tracking-widest text-xs font-bold">Total Enrolled Students</p>
              </div>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{dashboardStats.students_with_payments}</p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Paid</p>
                </div>
                <div className="w-px h-6 bg-gray-300" />
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{dashboardStats.students_without_payments}</p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Unpaid</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Analytics Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="backdrop-blur-md bg-white/60 rounded-xl p-8 border border-white/30 shadow-lg mt-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-gray-800">Term-over-Term Analytics</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">Expected vs Collected revenue trajectory across academic terms.</p>
              </div>
            </div>
            
            {analyticsLoading ? (
              <div className="h-80 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Computing Aggregations...</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `UGX ${(value / 1000000).toLocaleString()}M`} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                      formatter={(value) => [`UGX ${value.toLocaleString()}`, undefined]}
                      labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '8px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="Expected" stroke="#60a5fa" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} />
                    <Line type="monotone" dataKey="Collected" stroke="#34d399" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* NEW: Three Amazing Dashboard Enhancements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Animated Gauges - 2 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatedGauge
                percentage={dashboardStats.collection_rate_percent}
                label="Collection Rate"
                value={`${dashboardStats.collection_rate_percent}%`}
                color="#3b82f6"
                icon={TrendingUp}
                subtitle="Current term performance"
              />

              <AnimatedGauge
                percentage={Math.min(100, (dashboardStats.total_students > 0 ? (dashboardStats.students_with_payments / dashboardStats.total_students) * 100 : 0))}
                label="Student Participation"
                value={`${Math.round((dashboardStats.total_students > 0 ? (dashboardStats.students_with_payments / dashboardStats.total_students) * 100 : 0))}%`}
                color="#10b981"
                icon={Users}
                subtitle={`${dashboardStats.students_with_payments}/${dashboardStats.total_students} students`}
              />
            </motion.div>

            {/* Activity Feed - 1 column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/30 shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🔔 Recent Activity
              </h3>
              <ActivityFeed schoolId={1} termId={localSelectedTerm} maxItems={5} />
            </motion.div>
          </div>

          {/* Payment Heatmap - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-8"
          >
            <PaymentHeatmap termId={localSelectedTerm} />
          </motion.div>
        </>
      )}
      </div>
    </div>
  );
};

export default Overview;
