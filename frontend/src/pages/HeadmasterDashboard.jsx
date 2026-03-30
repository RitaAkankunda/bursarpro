import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Building2,
  Users,
  ArrowUpRight,
  BarChart3,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

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
            <h3 className="text-3xl font-black mt-1 text-gray-800">
              {typeof value === 'number' && value > 1000000 ? `UGX ${value.toLocaleString()}` : value}
            </h3>
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

const SchoolStatsCard = ({ school, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-6 space-y-4 group hover:border-primary/50 transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl">
          <Building2 size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg">{school.name}</h4>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
      <div className="text-center">
        <p className="text-2xl font-black text-orange-400">{school.total_students}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1">Students</p>
      </div>
      <div className="text-center border-l border-r border-white/5">
        <p className="text-2xl font-black text-emerald-400">{school.students_with_payments}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1">Paid</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-accent">{school.students_without_payments}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1">Unpaid</p>
      </div>
    </div>

    <div className="pt-4 border-t border-white/5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-text-muted">Collection Rate</span>
        <span className="text-lg font-black text-primary">{school.collection_rate_percent}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${school.collection_rate_percent}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-secondary"
        />
      </div>
    </div>
  </motion.div>
);

const HeadmasterDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [terms, setTerms] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await api.get('/terms/');
        const fetchedTerms = res.data.results || res.data || [];
        setTerms(fetchedTerms);
        if (fetchedTerms.length > 0) {
          if (!selectedTerm) {
            setSelectedTerm(fetchedTerms[0].id);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setLoading(false);
      }
    };
    fetchTerms();
  }, [selectedTerm]);

  useEffect(() => {
    if (selectedTerm) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/headmaster-dashboard/?term_id=${selectedTerm}`);
          setData(res.data);
          setSchools(res.data.schools || []);
        } catch (err) {
          console.error('Error fetching headmaster dashboard:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedTerm]);

  const handleTermChange = (e) => {
    setSelectedTerm(e.target.value);
  };

  if (loading && !data) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full"
      />
    </div>
  );

  if (!loading && terms.length === 0) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Headmaster Dashboard</h1>
            <p className="text-gray-600 font-medium">School financial overview and payment analytics</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg transition border border-gray-200 w-fit"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </div>

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
            value={selectedTerm}
            onChange={handleTermChange}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
          >
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </motion.div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Students"
                value={data.total_students}
                icon={<Users size={24} />}
                color="orange-400"
                delay={0.1}
              />
              <StatCard 
                title="Paid Students"
                value={data.students_paid}
                icon={<CheckCircle2 size={24} />}
                color="emerald-400"
                delay={0.2}
              />
              <StatCard 
                title="Total Collected"
                value={data.total_collected}
                icon={<TrendingUp size={24} />}
                color="primary"
                delay={0.3}
              />
              <StatCard 
                title="Outstanding"
                value={data.total_outstanding}
                icon={<AlertCircle size={24} />}
                color="accent"
                delay={0.4}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-gray-800">Collection Rate</h3>
                  <span className="text-orange-600 font-black text-2xl">{data.collection_rate_percent}%</span>
                </div>
                
                <div className="space-y-4">
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden p-1 border border-gray-300">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.collection_rate_percent}%` }}
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
                    <BarChart3 size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800">School Performance</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{data.school_name} is at {data.collection_rate_percent}% collection rate for {data.term}. Average payment per student: UGX {data.average_payment_per_student?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="lg:col-span-2 backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg flex flex-col justify-center text-center space-y-4"
              >
                <div className="p-4 rounded-2xl bg-blue-100 w-fit mx-auto">
                  <Users size={32} className="text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-gray-800">{data.total_students}</h3>
                  <p className="text-gray-600 uppercase tracking-widest text-xs font-bold">Total Enrolled Students</p>
                </div>
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{data.students_paid}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Paid</p>
                  </div>
                  <div className="w-px h-6 bg-gray-300" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">{data.students_unpaid}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Unpaid</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Unpaid Students Section */}
            {data.unpaid_students && data.unpaid_students.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-800">Students with Outstanding Balance</h3>
                  <p className="text-gray-600">{data.unpaid_students.length} students have not completed their payments</p>
                </div>
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Student Name</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Class</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Expected</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Paid</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.unpaid_students.map((student, idx) => (
                        <motion.tr 
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 * idx }}
                          className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-4 font-medium text-gray-800">{student.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{student.class}</td>
                          <td className="px-4 py-4 font-bold text-gray-800">UGX {Number(student.expected || 0).toLocaleString()}</td>
                          <td className="px-4 py-4 text-green-600 font-bold">UGX {Number(student.paid || 0).toLocaleString()}</td>
                          <td className="px-4 py-4 text-orange-600 font-bold">UGX {Number(student.outstanding || 0).toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Payments Section */}
            {data.recent_payments && data.recent_payments.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-800">Recent Payments</h3>
                  <p className="text-gray-600">Latest payment transactions for {data.term}</p>
                </div>
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Receipt #</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_payments.map((payment, idx) => (
                        <motion.tr 
                          key={payment.receipt}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 * idx }}
                          className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-4 font-mono text-sm text-blue-600 font-bold">{payment.receipt}</td>
                          <td className="px-4 py-4 font-medium text-gray-800">{payment.student}</td>
                          <td className="px-4 py-4 text-green-600 font-bold">UGX {Number(payment.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HeadmasterDashboard;
