import { useState, useEffect } from 'react';
import { 
  LineChart as LucideLineChart, 
  TrendingUp, 
  CalendarDays,
  PieChart as LucidePieChart,
  Activity,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  ComposedChart, Line
} from 'recharts';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboard } from '../context/DashboardContext';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, subtitle, icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-primary/10 text-primary rounded-xl ring-1 ring-white/10">
        {icon}
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-white">{value}</h3>
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{title}</p>
      {subtitle && <p className="text-xs text-emerald-400 mt-2 font-medium">{subtitle}</p>}
    </div>
  </motion.div>
);

const Analytics = () => {
  const { selectedTerm, setSelectedTerm } = useDashboard();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState(null);
  
  const [analyticsData, setAnalyticsData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [methodData, setMethodData] = useState([]);
  
  useEffect(() => {
    const init = async () => {
      try {
        const [schoolRes, termRes] = await Promise.all([
          api.get('/schools/'),
          api.get('/terms/')
        ]);
        const schools = schoolRes.data.results || schoolRes.data || [];
        if (schools.length > 0) {
          setSchoolId(schools[0].id);
        }
        
        const fetchedTerms = termRes.data.results || termRes.data || [];
        setTerms(fetchedTerms);
        
        if (fetchedTerms.length > 0 && !selectedTerm) {
          setSelectedTerm(fetchedTerms[0].id);
        } else if (fetchedTerms.length === 0) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch initial config", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (schoolId && selectedTerm) {
      fetchAnalytics();
    }
  }, [schoolId, selectedTerm]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, forecastRes, methodRes] = await Promise.all([
        api.get(`/payment-analytics/summary/?school=${schoolId}&term=${selectedTerm}`),
        api.get(`/payment-forecasts/?school=${schoolId}&term=${selectedTerm}`),
        api.get(`/payment-method-trends/?school=${schoolId}&term=${selectedTerm}`)
      ]);
      
      // Sort analytics sequentially by date (oldest first for charts)
      const sortedAnalytics = (analyticsRes.data.data || []).sort((a,b) => new Date(a.date) - new Date(b.date));
      setAnalyticsData(sortedAnalytics);
      
      const sortedForecasts = (forecastRes.data.results || forecastRes.data || []).sort((a,b) => new Date(a.forecast_date) - new Date(b.forecast_date));
      setForecastData(sortedForecasts);
      
      const sortedMethods = (methodRes.data.results || methodRes.data || []).sort((a,b) => new Date(a.date) - new Date(b.date));
      setMethodData(sortedMethods);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load advanced analytics');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-morphism p-4 border border-white/10 rounded-xl shadow-2xl">
          <p className="text-xs font-bold text-text-muted mb-2">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-bold">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white">UGX {Number(entry.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight gradient-text inline-flex items-center gap-4">
              <LucideLineChart className="text-primary w-10 h-10" />
              Advanced Analytics
            </h1>
            <p className="text-text-muted font-medium ml-14">Data-driven insights, revenue forecasting, and payment trends.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-3 glass-morphism rounded-xl border border-white/5 min-w-[200px]">
            <CalendarDays size={18} className="text-primary" />
            <select 
              value={selectedTerm || ''}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-8 flex-1"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
              <option value="" disabled className="bg-surface text-text-muted">Select Academic Term</option>
              {terms.map(t => (
                <option key={t.id} value={t.id} className="bg-surface">{t.name}</option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">Computing Analytics...</p>
          </div>
        ) : !analyticsData.length ? (
           <div className="glass-card p-20 text-center space-y-4">
             <Activity size={64} className="text-text-muted mx-auto opacity-20" strokeWidth={1} />
             <div className="space-y-1">
               <p className="text-xl font-bold">No Analytics Available</p>
               <p className="text-xs text-text-muted">Insufficient payment data for this term to generate insights.</p>
             </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="30-Day Revenue" 
                value={`UGX ${analyticsData.reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString()}`}
                subtitle="Total collected in viewed period"
                icon={<TrendingUp size={24} />} 
                delay={0.1} 
              />
              <StatCard 
                title="Peak Collection Day" 
                value={analyticsData.length > 0 ? new Date([...analyticsData].sort((a,b) => b.total_amount - a.total_amount)[0].date).toLocaleDateString() : 'N/A'}
                subtitle="Highest performing date"
                icon={<CalendarDays size={24} />} 
                delay={0.2} 
              />
              <StatCard 
                title="Forecast 30-Day" 
                value={forecastData.length > 0 ? `UGX ${forecastData.reduce((acc, curr) => acc + Number(curr.predicted_amount), 0).toLocaleString()}` : 'Calculating...'}
                subtitle="Predicted upcoming revenue"
                icon={<Activity size={24} />} 
                delay={0.3} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Trend */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card p-6 space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Revenue Trend</h3>
                  <p className="text-xs text-text-muted font-medium">Daily collection amounts over time</p>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => `UGX ${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="total_amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Payment Method Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card p-6 space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Payment Methods</h3>
                  <p className="text-xs text-text-muted font-medium">Cash vs Mobile Money vs Bank</p>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => `UGX ${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="cash_amount" name="Cash" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="mobile_money_amount" name="Mobile Money" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="bank_amount" name="Bank Transfer" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              {/* Revenue Forecast (Full Width) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="col-span-1 lg:col-span-2 glass-card p-6 space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Revenue Projections (AI Forecast)</h3>
                  <p className="text-xs text-text-muted font-medium">Predicted upcoming collections based on historical data</p>
                </div>
                <div className="h-80 w-full relative">
                  {!forecastData.length ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm font-bold text-text-muted">Not enough historical data to generate a forecast.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="forecast_date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} tickFormatter={(val) => `UGX ${val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="confidence_upper" name="Upper Confidence" fill="#8B5CF6" fillOpacity={0.1} stroke="none" />
                        <Area type="monotone" dataKey="confidence_lower" name="Lower Confidence" fill="#8B5CF6" fillOpacity={0.1} stroke="none" />
                        <Line type="monotone" dataKey="predicted_amount" name="Predicted Revenue" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
