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
  FileText,
  CheckSquare,
  Square,
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRefunds, setSelectedRefunds] = useState(new Set());
  const [selectedReversals, setSelectedReversals] = useState(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(null); // 'approve', 'reject', null
  const [bulkReason, setBulkReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch refunds with React Query
  const { data: refundsData, isLoading: refundsLoading } = useQuery({
    queryKey: ['refunds'],
    queryFn: () => api.get('/refunds/').then(res => res.data.results || res.data)
  });

  // Fetch reversals with React Query
  const { data: reversalsData, isLoading: reversalsLoading } = useQuery({
    queryKey: ['reversals'],
    queryFn: () => api.get('/payment-reversals/').then(res => res.data.results || res.data)
  });

  const refunds = refundsData || [];
  const reversals = reversalsData || [];
  const loading = activeTab === 'refunds' ? refundsLoading : reversalsLoading;

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ items, action, endpoint }) => {
      const updates = items.map(id => ({
        op: action,
        id,
        endpoint
      }));

      return Promise.all(
        updates.map(update =>
          api.patch(`/${update.endpoint}/${update.id}/`, {
            status: action === 'approve' ? 'APPROVED' : 'REJECTED',
            reason_for_rejection: bulkReason || undefined
          })
        )
      );
    },
    onSuccess: (res) => {
      const count = res.length;
      const action = bulkActionMode === 'approve' ? 'Approved' : 'Rejected';
      toast.success(`${count} item${count !== 1 ? 's' : ''} ${action.toLowerCase()} successfully!`);
      
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['reversals'] });
      
      setBulkActionMode(null);
      setSelectedRefunds(new Set());
      setSelectedReversals(new Set());
      setBulkReason('');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || 'Failed to process action';
      toast.error(errorMsg);
    }
  });

  // Filter and search logic
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (r.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredReversals = reversals.filter(r => {
    const matchesSearch = (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.original_receipt || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (r.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const calculateStats = (items) => {
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'PENDING').length,
      approved: items.filter(i => i.status === 'APPROVED').length,
      rejected: items.filter(i => i.status === 'REJECTED').length
    };
  };

  const refundStats = calculateStats(refunds);
  const reversalStats = calculateStats(reversals);
  const currentStats = activeTab === 'refunds' ? refundStats : reversalStats;

  // Handlers
  const toggleRefundSelection = (id) => {
    const newSet = new Set(selectedRefunds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRefunds(newSet);
  };

  const toggleReversalSelection = (id) => {
    const newSet = new Set(selectedReversals);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReversals(newSet);
  };

  const toggleSelectAll = () => {
    if (activeTab === 'refunds') {
      if (selectedRefunds.size === filteredRefunds.length) {
        setSelectedRefunds(new Set());
      } else {
        setSelectedRefunds(new Set(filteredRefunds.map(r => r.id)));
      }
    } else {
      if (selectedReversals.size === filteredReversals.length) {
        setSelectedReversals(new Set());
      } else {
        setSelectedReversals(new Set(filteredReversals.map(r => r.id)));
      }
    }
  };

  const handleBulkAction = async () => {
    const items = activeTab === 'refunds' ? selectedRefunds : selectedReversals;
    if (items.size === 0) {
      toast.error('No items selected');
      return;
    }

    const endpoint = activeTab === 'refunds' ? 'refunds' : 'payment-reversals';
    bulkActionMutation.mutate({
      items: Array.from(items),
      action: bulkActionMode === 'approve' ? 'APPROVED' : 'REJECTED',
      endpoint
    });
  };

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
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="backdrop-blur-md bg-blue-600/10 border border-blue-300/20 rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-gray-600">Total</p>
              <Zap size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-800">{currentStats.total}</p>
            <p className="text-xs text-gray-600">Total {activeTab}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-md bg-amber-600/10 border border-amber-300/20 rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-gray-600">Pending</p>
              <Clock size={18} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-gray-800">{currentStats.pending}</p>
            <p className="text-xs text-gray-600">Awaiting action</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-md bg-green-600/10 border border-green-300/20 rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-gray-600">Approved</p>
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-800">{currentStats.approved}</p>
            <p className="text-xs text-gray-600">Processed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-md bg-red-600/10 border border-red-300/20 rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-gray-600">Rejected</p>
              <XCircle size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-black text-gray-800">{currentStats.rejected}</p>
            <p className="text-xs text-gray-600">Declined</p>
          </motion.div>
        </div>

        {/* Tabs, Filters & Search */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center glass-morphism p-4 rounded-2xl border border-white/5">
            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={() => {
                  setActiveTab('refunds');
                  setStatusFilter('all');
                }}
                className={`flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                  activeTab === 'refunds' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-text-muted hover:bg-white/5'
                }`}
              >
                Refund Requests
              </button>
              <button
                onClick={() => {
                  setActiveTab('reversals');
                  setStatusFilter('all');
                }}
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

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Items' : status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {(selectedRefunds.size > 0 || selectedReversals.size > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl"
          >
            <p className="font-bold text-gray-800">
              {activeTab === 'refunds' ? selectedRefunds.size : selectedReversals.size} item{(activeTab === 'refunds' ? selectedRefunds.size : selectedReversals.size) !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBulkActionMode('approve')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                <CheckCircle size={16} />
                Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBulkActionMode('reject')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                <XCircle size={16} />
                Reject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedRefunds(new Set());
                  setSelectedReversals(new Set());
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Data Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-5 w-12">
                    <input 
                      type="checkbox"
                      checked={activeTab === 'refunds' ? (selectedRefunds.size === filteredRefunds.length && filteredRefunds.length > 0) : (selectedReversals.size === filteredReversals.length && filteredReversals.length > 0)}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Date</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">
                    {activeTab === 'refunds' ? 'Student' : 'Receipt ID'}
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                  {(!selectedRefunds.size && !selectedReversals.size) && (
                    <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-widest text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={selectedRefunds.size || selectedReversals.size ? 6 : 7} className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading Records...</p>
                      </td>
                    </tr>
                  ) : activeTab === 'refunds' && filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan={selectedRefunds.size ? 6 : 7} className="px-6 py-20 text-center text-text-muted">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No refund requests found.</p>
                      </td>
                    </tr>
                  ) : activeTab === 'reversals' && filteredReversals.length === 0 ? (
                    <tr>
                      <td colSpan={selectedReversals.size ? 6 : 7} className="px-6 py-20 text-center text-text-muted">
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
                          <input 
                            type="checkbox"
                            checked={selectedRefunds.has(refund.id)}
                            onChange={() => toggleRefundSelection(refund.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm">{new Date(refund.requested_at).toLocaleDateString()}</p>
                          <p className="text-xs text-text-muted">{new Date(refund.requested_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm">{refund.student_name || 'N/A'}</p>
                          <p className="text-xs text-text-muted">{refund.refund_method}</p>
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
                        {!selectedRefunds.size && (
                          <td className="px-6 py-5 text-right">
                            {refund.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-2">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedRefunds(new Set([refund.id]));
                                    setBulkActionMode('approve');
                                  }}
                                  className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedRefunds(new Set([refund.id]));
                                    setBulkActionMode('reject');
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </motion.button>
                              </div>
                            )}
                          </td>
                        )}
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
                          <input 
                            type="checkbox"
                            checked={selectedReversals.has(reversal.id)}
                            onChange={() => toggleReversalSelection(reversal.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm">{new Date(reversal.requested_at).toLocaleDateString()}</p>
                          <p className="text-xs text-text-muted">{new Date(reversal.requested_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-mono text-sm font-bold text-primary">{reversal.original_receipt}</p>
                          <p className="text-xs text-text-muted">{reversal.student_name || 'N/A'}</p>
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
                        {!selectedReversals.size && (
                          <td className="px-6 py-5 text-right">
                            {reversal.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-2">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedReversals(new Set([reversal.id]));
                                    setBulkActionMode('approve');
                                  }}
                                  className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Approve Reversal"
                                >
                                  <CheckCircle size={18} />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedReversals(new Set([reversal.id]));
                                    setBulkActionMode('reject');
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Reject Reversal"
                                >
                                  <XCircle size={18} />
                                </motion.button>
                              </div>
                            )}
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Action Modal */}
        {bulkActionMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!bulkActionMutation.isPending) {
                setBulkActionMode(null);
                setBulkReason('');
              }
            }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className={`relative overflow-hidden bg-gradient-to-r ${bulkActionMode === 'approve' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-rose-600'} px-8 py-6`}>
                <div className="absolute inset-0 opacity-20" />
                <div className="relative flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    {bulkActionMode === 'approve' ? <CheckCircle size={24} className="text-white" /> : <XCircle size={24} className="text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{bulkActionMode === 'approve' ? 'Approve' : 'Reject'} Items</h3>
                    <p className="text-xs text-white/80 opacity-80 mt-1">
                      {bulkActionMode === 'approve' ? 'Mark selected items as approved' : 'Mark selected items as rejected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 space-y-6">
                <div className={`p-4 border rounded-2xl ${bulkActionMode === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-sm font-bold text-gray-800">
                    {bulkActionMode === 'approve' ? 'Approving' : 'Rejecting'} <span className={`text-lg ${bulkActionMode === 'approve' ? 'text-green-600' : 'text-red-600'}`}>{activeTab === 'refunds' ? selectedRefunds.size : selectedReversals.size}</span> item{(activeTab === 'refunds' ? selectedRefunds.size : selectedReversals.size) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-2">
                    {bulkActionMode === 'approve' 
                      ? 'These items will be marked as approved and processed.' 
                      : 'These items will be marked as rejected and the requester will be notified.'}
                  </p>
                </div>

                {/* Reason Field */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    {bulkActionMode === 'approve' ? 'Approval Notes' : 'Rejection Reason'} <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder={bulkActionMode === 'approve' ? 'Add notes about this approval...' : 'Explain why these items are being rejected...'}
                    disabled={bulkActionMutation.isPending}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 transition-all"
                    rows="3"
                  />
                </div>

                {/* Selected Items List */}
                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-3 space-y-1.5">
                  {activeTab === 'refunds' ? (
                    Array.from(selectedRefunds).map(refundId => {
                      const refund = filteredRefunds.find(r => r.id === refundId);
                      return refund ? (
                        <div key={refund.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-bold text-gray-800">{refund.student_name}</p>
                            <p className="text-gray-600">{refund.refund_method}</p>
                          </div>
                          <p className="font-black text-gray-800">UGX {parseInt(refund.amount).toLocaleString()}</p>
                        </div>
                      ) : null;
                    })
                  ) : (
                    Array.from(selectedReversals).map(reversalId => {
                      const reversal = filteredReversals.find(r => r.id === reversalId);
                      return reversal ? (
                        <div key={reversal.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-bold text-gray-800">{reversal.original_receipt}</p>
                            <p className="text-gray-600">{reversal.student_name || 'N/A'}</p>
                          </div>
                          <p className="font-black text-gray-800">UGX {parseInt(reversal.original_amount).toLocaleString()}</p>
                        </div>
                      ) : null;
                    })
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setBulkActionMode(null);
                      setBulkReason('');
                    }}
                    disabled={bulkActionMutation.isPending}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBulkAction}
                    disabled={bulkActionMutation.isPending}
                    className={`px-4 py-3 hover:opacity-90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      bulkActionMode === 'approve'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                        : 'bg-gradient-to-r from-red-600 to-rose-600'
                    }`}
                  >
                    {bulkActionMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {bulkActionMode === 'approve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {bulkActionMode === 'approve' ? 'Approve All' : 'Reject All'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Refunds;
