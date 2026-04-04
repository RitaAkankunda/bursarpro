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
  ChevronRight,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import DashboardCustomizer from '../components/DashboardCustomizer';

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
          <div className="w-full max-w-2xl space-y-8">
            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <h1 className="text-4xl font-black text-gray-800">Welcome Headmaster!</h1>
              <p className="text-gray-600 text-lg">Let's get your dashboard ready to track school finances</p>
            </motion.div>

            {/* Setup Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/30 shadow-lg p-8 space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-800">3 Quick Steps to Get Started</h2>
              
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Create Academic Terms",
                    desc: "Define your school's academic calendar (e.g., Term 1, Term 2, Term 3)",
                    icon: Calendar,
                    action: "Start Setup"
                  },
                  {
                    step: "2",
                    title: "Set Up Schools",
                    desc: "If managing multiple schools, configure each one in your system",
                    icon: Building2,
                    action: "Go to Settings"
                  },
                  {
                    step: "3",
                    title: "View Analytics",
                    desc: "Monitor student payments, collection rates, and financial reports",
                    icon: BarChart3,
                    action: "Dashboard"
                  }
                ].map(({ step, title, desc, icon: Icon }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex gap-4 p-4 bg-white/40 rounded-xl border border-white/20 group hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 flex-shrink-0 group-hover:bg-orange-500/30 transition-all">
                      <span className="font-black text-orange-600 text-lg">{step}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-gray-800">{title}</h3>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <Icon size={20} className="text-orange-500 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Preview Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">You'll See This Once Set Up:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Total Students", value: "---" },
                  { label: "Collection Rate", value: "---" },
                  { label: "Amount Collected", value: "---" },
                  { label: "Outstanding Fees", value: "---" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="backdrop-blur-md bg-white/40 rounded-xl p-4 border border-white/20 text-center"
                  >
                    <p className="text-xs text-gray-600 font-bold uppercase">{item.label}</p>
                    <p className="text-2xl font-black text-gray-400 mt-2">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center"
            >
              <button 
                onClick={() => navigate('/settings')} 
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Go to Settings
              </button>
            </motion.div>
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
          className="backdrop-blur-md bg-white/50 rounded-xl p-4 border border-white/30 flex items-end gap-4"
        >
          <div className="flex-1">
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
          </div>
          <motion.button
            onClick={() => setIsCustomizerOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            <Settings size={18} />
            Customize
          </motion.button>
        </motion.div>

        {data && (
          <>
            {/* Network Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Schools Managed</p>
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-4xl font-black text-gray-800">{data.number_of_schools}</p>
                <p className="text-xs text-gray-600 mt-2">Active institutions</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Network Collection Rate</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-4xl font-black text-gray-800">{data.overall_collection_rate}%</p>
                <p className="text-xs text-gray-600 mt-2">Average across all schools</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Total Network Revenue</p>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-black text-gray-800">UGX {(data.total_collected / 1000000).toLocaleString()}M</p>
                <p className="text-xs text-gray-600 mt-2">Collected this term</p>
              </motion.div>
            </div>

            {/* Individual School Performance */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">School Performance Breakdown</h2>
                <p className="text-gray-600">Detailed metrics for each school in your network</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {data.schools && data.schools.map((school, idx) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + idx * 0.1 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">{school.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{school.total_students} Students Enrolled</p>
                    </div>
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-2xl font-black text-orange-500">{school.total_students}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Total</p>
                    </div>
                    <div className="text-center border-l border-r border-white/10">
                      <p className="text-2xl font-black text-emerald-500">{school.students_with_payments}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-red-500">{school.students_without_payments}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Unpaid</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-600">Collection Rate</span>
                      <span className="text-lg font-black text-orange-600">{school.collection_rate_percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${school.collection_rate_percent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-bold text-blue-900">Revenue</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">UGX {(school.total_collected / 1000000).toLocaleString()}M</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Top Performers & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-gray-800">Top Performer</h3>
                  <span className="text-orange-600 font-black text-lg">🏆</span>
                </div>
                
                {data.top_school && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="font-bold text-gray-800 mb-2">{data.top_school.name}</p>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Collection Rate:</span>
                        <span className="font-bold text-orange-600">{data.top_school.collection_rate_percent}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.top_school.collection_rate_percent}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Leading performance this term</p>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="lg:col-span-2 backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg"
              >
                <h3 className="text-xl font-bold tracking-tight text-gray-800 mb-4">Attention Required</h3>
                {data.underperforming_schools && data.underperforming_schools.length > 0 ? (
                  <div className="space-y-3">
                    {data.underperforming_schools.map((school, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{school.name}</p>
                          <p className="text-xs text-gray-600">{school.students_without_payments} students with pending fees</p>
                        </div>
                        <span className="text-sm font-bold text-red-600">{school.collection_rate_percent}%</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">All schools performing well ✓</p>
                )}
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

        {/* Dashboard Customizer Modal */}
        <DashboardCustomizer 
          isOpen={isCustomizerOpen} 
          onClose={() => setIsCustomizerOpen(false)} 
          role="HEADMASTER"
        />
      </div>
    </div>
  );
};

export default HeadmasterDashboard;
