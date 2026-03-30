import { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Search,
  RefreshCcw,
  Loader2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    APPROVED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PROCESSING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    FAILED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    REVERSED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  const icons = {
    PENDING: <Clock size={12} />,
    APPROVED: <CheckCircle size={12} />,
    PROCESSING: <RefreshCcw size={12} className="animate-spin" />,
    COMPLETED: <CheckCircle size={12} />,
    REJECTED: <XCircle size={12} />,
    FAILED: <AlertTriangle size={12} />,
    REVERSED: <ArrowLeftRight size={12} />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status] || styles.PENDING}`}>
      {icons[status]} {status}
    </span>
  );
};

const Refunds = () => {
  const [activeTab, setActiveTab] = useState('refunds'); // 'refunds' or 'reversals'
  const [refunds, setRefunds] = useState([]);
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'refunds') {
        const res = await api.get('/refunds/');
        setRefunds(res.data.results || res.data);
      } else {
        const res = await api.get('/payment-reversals/');
        setReversals(res.data.results || res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, endpoint) => {
    try {
      await api.patch(`/${endpoint}/${id}/`, { status: action });
      toast.success(`Successfully updated status to ${action}`);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Failed to perform action');
    }
  };

  const filteredRefunds = refunds.filter(r => 
    (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReversals = reversals.filter(r => 
    (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.original_receipt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight gradient-text inline-flex items-center gap-4">
              <ArrowLeftRight className="text-primary w-10 h-10" />
              Returns & Reversals
            </h1>
            <p className="text-text-muted font-medium ml-14">Manage student refunds, payment corrections, and transaction reversals.</p>
          </div>
          
          <button className="flex items-center gap-3 px-8 py-4 btn-primary text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap">
            <RefreshCcw size={20} />
            Initiate Request
          </button>
        </header>

        {/* Tabs & Search */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-center glass-morphism p-2 rounded-2xl border border-white/5">
          <div className="flex gap-2 w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('refunds')}
              className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                activeTab === 'refunds' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-text-muted hover:bg-white/5'
              }`}
            >
              Refund Requests
            </button>
            <button
              onClick={() => setActiveTab('reversals')}
              className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                activeTab === 'reversals' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'text-text-muted hover:bg-white/5'
              }`}
            >
              Payment Reversals
            </button>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium placeholder:text-text-muted/30"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Date</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">
                    {activeTab === 'refunds' ? 'Refund Type' : 'Receipt ID'}
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading Records...</p>
                      </td>
                    </tr>
                  ) : activeTab === 'refunds' && filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-text-muted">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No refund requests found.</p>
                      </td>
                    </tr>
                  ) : activeTab === 'reversals' && filteredReversals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-text-muted">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No payment reversals found.</p>
                      </td>
                    </tr>
                  ) : activeTab === 'refunds' ? (
                    filteredRefunds.map((refund, idx) => (
                      <motion.tr
                        key={refund.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/5 border-b border-white/5 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm">{new Date(refund.requested_at).toLocaleDateString()}</p>
                          <p className="text-xs text-text-muted">{new Date(refund.requested_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm text-primary">{refund.refund_method}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-white">UGX {parseFloat(refund.amount).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-5 max-w-xs truncate text-sm text-text-muted">
                          {refund.reason}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StatusBadge status={refund.status} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          {refund.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleAction(refund.id, 'APPROVED', 'refunds')}
                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleAction(refund.id, 'REJECTED', 'refunds')}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    filteredReversals.map((reversal, idx) => (
                      <motion.tr
                        key={reversal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/5 border-b border-white/5 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm">{new Date(reversal.requested_at).toLocaleDateString()}</p>
                          <p className="text-xs text-text-muted">{new Date(reversal.requested_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-mono text-sm font-bold text-primary">{reversal.original_receipt}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-white">UGX {parseFloat(reversal.original_amount).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-5 max-w-xs truncate text-sm text-text-muted">
                          {reversal.reason}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StatusBadge status={reversal.status} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          {reversal.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleAction(reversal.id, 'APPROVED', 'payment-reversals')}
                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Approve Reversal"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleAction(reversal.id, 'FAILED', 'payment-reversals')}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Reject Reversal"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Refunds;
