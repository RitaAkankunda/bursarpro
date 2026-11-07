import { useEffect, useState } from 'react';
import { 
  Search, 
  X,
  Filter, 
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowUpDown,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  BellRing,
  AlertTriangle,
  CheckSquare,
  Square,
  Clock,
  XCircle,
  Send,
  MoreVertical,
  Eye,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import BulkImportModal from '../components/BulkImportModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';
import '../design-system/payment-recording.css';

// Improved Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, title, message, icon: Icon = AlertTriangle, isDangerous = false, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20 }}
          className="backdrop-blur-md bg-white/90 shadow-2xl w-full max-w-sm p-8 rounded-2xl border border-white/20 space-y-6"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isDangerous ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <Icon className={`w-8 h-8 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
          </motion.div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-gray-900">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Warning Badge */}
          {isDangerous && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700">This will send SMS to all eligible students</p>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                isDangerous
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-orange-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const PaymentDrawer = ({ isOpen, students, terms, selectedTerm, onPaymentSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ student: '', term: selectedTerm || '', amount: '', payment_date: new Date().toLocaleDateString('en-CA'), payment_method: 'CASH' });
  const [billing, setBilling] = useState({ loading: false, fee: null, balance: null, error: '' });
  const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { setForm(f => ({ ...f, term: selectedTerm || f.term, amount: '' })); setError(''); } }, [isOpen, selectedTerm]);
  useEffect(() => {
    if (!isOpen || !form.student || !form.term) { setBilling({ loading: false, fee: null, balance: null, error: '' }); return; }
    let active = true;
    const student = students.find(s => String(s.id) === String(form.student));
    if (!student?.class_level) { setBilling({ loading: false, fee: null, balance: null, error: 'Student has no assigned class.' }); return; }
    setBilling({ loading: true, fee: null, balance: null, error: '' });
    Promise.all([
      api.get(`/fee-structures/?term_id=${encodeURIComponent(form.term)}&class_level_id=${encodeURIComponent(student.class_level)}`),
      api.get(`/students/?term_id=${encodeURIComponent(form.term)}&no_paginate=true`)
    ]).then(([feesResponse, studentsResponse]) => {
      if (!active) return;
      const fees = Array.isArray(feesResponse.data) ? feesResponse.data : feesResponse.data?.results || [];
      const studentsForTerm = Array.isArray(studentsResponse.data) ? studentsResponse.data : studentsResponse.data?.results || [];
      const fee = fees.find(f => String(f.class_level) === String(student.class_level) && String(f.term) === String(form.term));
      const billedStudent = studentsForTerm.find(s => String(s.id) === String(form.student));
      const feeNumber = fee ? Number(fee.amount) : null;
      const balanceNumber = billedStudent?.balance == null ? null : Number(billedStudent.balance);
      setBilling({ loading: false, fee: Number.isFinite(feeNumber) ? feeNumber : null, balance: Number.isFinite(balanceNumber) ? balanceNumber : null, error: fee ? '' : 'No fee structure for this class and term.' });
    }).catch(() => { if (active) setBilling({ loading: false, fee: null, balance: null, error: 'Unable to load student billing. Check your connection.' }); });
    return () => { active = false; };
  }, [isOpen, form.student, form.term, students]);

  const money = value => `UGX ${Number(value).toLocaleString('en-UG', { maximumFractionDigits: 2 })}`;
  const parsedAmount = Number(form.amount);
  const valid = form.student && form.term && !billing.loading && billing.fee !== null && billing.balance !== null && billing.balance > 0 && form.amount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0 && Number.isInteger(parsedAmount * 100) && parsedAmount <= billing.balance;
  const mutation = useMutation({
    mutationFn: payload => api.post('/payments/', payload),
    onSuccess: res => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onPaymentSuccess?.(res.data);
      toast.success('Payment saved. Verify the receipt in Payment Tracker.');
      onClose?.();
      setForm(f => ({ ...f, student: '', amount: '' }));
    },
    onError: err => {
      const details = err.response?.data;
      const message = typeof details?.detail === 'string' ? details.detail : (details && typeof details === 'object' ? Object.values(details).flat().join(' ') : null);
      setError(message || 'Could not record payment. No success has been confirmed.');
    }
  });
  const handleSubmit = e => {
    e.preventDefault();
    if (mutation.isPending || !valid) return;
    setError('');
    mutation.mutate({ ...form, amount: parsedAmount.toFixed(2), receipt_number: `REC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}` });
  };
  if (!isOpen) return null;
  return (
    <div className="bp-payment-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !mutation.isPending) onClose?.(); }}>
      <section className="bp-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="bp-payment-title">
        <header className="bp-payment-header">
          <div><span className="bp-payment-eyebrow">SCHOOL FINANCE</span><h2 id="bp-payment-title">Record student payment</h2><p>Review the outstanding fee before recording money received.</p></div>
          <button type="button" className="bp-payment-close" aria-label="Close payment form" disabled={mutation.isPending} onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={handleSubmit} className="bp-payment-body">
          <div className="bp-payment-grid">
            <label>Student <select required value={form.student} onChange={e => { setForm(f => ({ ...f, student: e.target.value, amount: '' })); setError(''); }}><option value="">Select a student</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}</select></label>
            <label>Academic term <select required value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value, amount: '' }))}><option value="">Select a term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          </div>
          <div className="bp-payment-summary" aria-live="polite">
            <div><span>Assigned term fee</span><strong>{billing.loading ? 'Loading…' : billing.fee == null ? 'Not available' : money(billing.fee)}</strong></div>
            <div><span>Outstanding before payment</span><strong>{billing.loading ? 'Loading…' : billing.balance == null ? 'Not available' : money(billing.balance)}</strong></div>
            {billing.error && <p className="bp-payment-error">{billing.error}</p>}
          </div>
          <div className="bp-payment-grid">
            <label>Amount received (UGX) <input type="number" min="0.01" step="0.01" required inputMode="decimal" placeholder="Enter actual amount paid" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></label>
            <label>Payment date <input type="date" required value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} /></label>
          </div>
          <fieldset className="bp-payment-methods"><legend>Payment method</legend>{[['CASH','Cash'], ['MOBILE_MONEY','Mobile money'], ['BANK_TRANSFER','Bank transfer']].map(([id,label]) => <label key={id} className={form.payment_method === id ? 'active' : ''}><input type="radio" name="payment-method" value={id} checked={form.payment_method === id} onChange={() => setForm(f => ({ ...f, payment_method: id }))} />{label}</label>)}</fieldset>
          <div className="bp-payment-result"><span>Estimated balance after payment</span><strong>{valid ? money(Math.max(0, billing.balance - parsedAmount)) : '—'}</strong><small>Preview only; the server confirms the final balance.</small></div>
          {form.amount && billing.balance !== null && parsedAmount > billing.balance && <p className="bp-payment-error">Amount exceeds the outstanding balance.</p>}
          {error && <p role="alert" className="bp-payment-error">{error}</p>}
          <footer className="bp-payment-footer"><button type="button" className="bp-payment-cancel" onClick={onClose} disabled={mutation.isPending}>Cancel</button><button type="submit" className="bp-payment-submit" disabled={!valid || mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Confirm payment'}</button></footer>
        </form>
      </section>
    </div>
  );
};

const Payments = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [smsConfirm, setSmsConfirm] = useState({ isOpen: false });
  
  // New state for enhancements
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all', 'verified', 'pending'
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'method'
  const [sortOrder, setSortOrder] = useState('desc');
  const [bulkVerifyMode, setBulkVerifyMode] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Reset page relative to search or term changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedTerm]);

  const { data: initialData } = useQuery({
    queryKey: ['initialPaymentData'],
    queryFn: async () => {
      const [termsRes, studentsRes] = await Promise.all([
        api.get('/terms/'),
        api.get('/students/?no_paginate=true')
      ]);
      return { terms: termsRes.data, students: studentsRes.data };
    }
  });

  const terms = initialData?.terms || [];
  const students = initialData?.students || [];

  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms, selectedTerm]);

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', selectedTerm, search, page],
    queryFn: async () => {
      let url = `/payments/?term_id=${selectedTerm}&page=${page}`;
      if (search) url += `&search=${search}`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!selectedTerm
  });

  const payments = paymentsData?.results || [];
  const totalCount = paymentsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const reminderMutation = useMutation({
    mutationFn: () => api.post('/students/send_reminders/', { term_id: selectedTerm }),
    onSuccess: (res) => {
      toast.success(res.data.detail || 'Reminders dispatched smoothly!');
    },
    onError: () => toast.error('Failed to send reminders')
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: async (paymentIds) => {
      const updates = paymentIds.map(id => ({
        id,
        verified: true,
        verification_notes: verificationNotes
      }));
      
      // Send PATCH requests for each payment
      const promises = updates.map(update =>
        api.patch(`/payments/${update.id}/`, {
          verified: update.verified,
          verification_notes: update.verification_notes
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: (res) => {
      const count = res.length;
      toast.success(`${count} payment${count !== 1 ? 's' : ''} verified successfully!`);
      
      // Invalidate queries to refresh the payment list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      // Reset state
      setBulkVerifyMode(false);
      setSelectedPayments(new Set());
      setVerificationNotes('');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || 'Failed to verify payments';
      toast.error(errorMsg);
    }
  });

  const handleBulkVerify = () => {
    if (selectedPayments.size === 0) {
      toast.error('No payments selected');
      return;
    }
    bulkVerifyMutation.mutate(Array.from(selectedPayments));
  };

  const handleSendReminders = () => {
    setSmsConfirm({ isOpen: true });
  };

  const handleSmsConfirm = () => {
    setSmsConfirm({ isOpen: false });
    const toastId = toast.loading('Dispatching SMS alerts...');
    reminderMutation.mutate(undefined, {
      onSuccess: (res) => toast.success(res.data.detail, { id: toastId }),
      onError: () => toast.error('Failed to send alerts', { id: toastId })
    });
  };

  const handleSmsCancel = () => {
    setSmsConfirm({ isOpen: false });
  };

  const handlePaymentSuccess = () => {
    // Invalidate immediately instead of manual prepend for accuracy
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading receipt:', err);
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'CASH': return <Banknote size={16} className="text-emerald-400" />;
      case 'MOBILE_MONEY': return <Smartphone size={16} className="text-orange-400" />;
      case 'BANK_TRANSFER': return <CreditCard size={16} className="text-blue-400" />;
      default: return <CreditCard size={16} />;
    }
  };

  // Toggle payment selection for bulk operations
  const togglePaymentSelection = (paymentId) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPayments.size === sortedPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(sortedPayments.map(p => p.id)));
    }
  };

  // Get verification status stats
  const paymentStats = {
    total: payments.length,
    verified: payments.filter(p => p.verified).length,
    pending: payments.filter(p => !p.verified).length
  };

  // Filter and sort payments
  const filteredPayments = payments.filter(p => {
    if (verificationFilter === 'verified') return p.verified;
    if (verificationFilter === 'pending') return !p.verified;
    return true;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.payment_date) - new Date(b.payment_date);
    } else if (sortBy === 'amount') {
      comparison = parseFloat(a.amount) - parseFloat(b.amount);
    } else if (sortBy === 'method') {
      comparison = a.payment_method.localeCompare(b.payment_method);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExportCSV = async () => {
    const toastId = toast.loading('Preparing CSV export...');
    try {
      let url = `/payments/?no_paginate=true&term_id=${selectedTerm}`;
      if (search) url += `&search=${search}`;
      
      const res = await api.get(url);
      const dataToExport = res.data;
      
      if (!dataToExport || dataToExport.length === 0) {
        toast.error('No payments found to export', { id: toastId });
        return;
      }

      const headers = ['Receipt #', 'Student Name', 'Term', 'Payment Method', 'Amount', 'Date', 'Recorded By'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(p => [
          `"${p.receipt_number}"`,
          `"${p.student_name}"`,
          `"${p.term_name}"`,
          `"${p.payment_method}"`,
          `"${p.amount}"`,
          `"${p.payment_date}"`,
          `"${p.recorded_by}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `payments_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV Export downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Export failed', { id: toastId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-800">Payment Tracker</h1>
            <p className="text-gray-600 font-medium">Record collections and verify payment history.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendReminders}
              disabled={reminderMutation.isPending}
              className="flex items-center gap-2 px-6 py-4 bg-orange-50 border border-orange-200 text-orange-600 shadow-sm hover:shadow-md hover:bg-orange-100 font-bold rounded-2xl transition-all whitespace-nowrap disabled:opacity-50"
            >
              <BellRing size={20} className={reminderMutation.isPending ? "animate-bounce" : ""} />
              {reminderMutation.isPending ? "Sending..." : "Send Reminders"}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-6 py-4 bg-amber-50 border border-amber-200 shadow-sm hover:shadow-md hover:bg-amber-100 text-amber-700 font-bold rounded-2xl transition-all whitespace-nowrap"
            >
              <Upload size={20} />
              Bulk Import
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-800 font-bold rounded-2xl transition-all whitespace-nowrap"
            >
              <Download size={20} />
              Export CSV
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDrawer(!showDrawer)}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap"
            >
              <CreditCard size={20} />
              Record Payment
            </motion.button>
          </div>
        </header>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 w-fit">
          <div className="flex items-center gap-2 px-3 text-gray-600">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Filter Term</span>
          </div>
          <div className="relative">
            <select 
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold pr-6 cursor-pointer hover:text-blue-600 transition-colors appearance-none text-gray-800"
            >
              {terms.map(t => (
                <option key={t.id} value={t.id} className="bg-white text-gray-800 text-gray-800">{t.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-0 top-0 text-gray-600 text-xs">▼</div>
          </div>
        </div>

        {/* VERIFICATION STATUS FILTERS */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-600 uppercase">Verification:</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All', count: paymentStats.total, icon: CreditCard },
              { value: 'verified', label: 'Verified', count: paymentStats.verified, icon: CheckCircle2 },
              { value: 'pending', label: 'Pending', count: paymentStats.pending, icon: Clock }
            ].map(filter => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setVerificationFilter(filter.value); setPage(1); }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    verificationFilter === filter.value
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <Icon size={16} />
                  {filter.label}
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${verificationFilter === filter.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {filter.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedPayments.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between"
          >
            <p className="font-bold text-blue-900">{selectedPayments.size} payment{selectedPayments.size !== 1 ? 's' : ''} selected</p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBulkVerifyMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                <CheckCircle2 size={16} />
                Verify ({selectedPayments.size})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPayments(new Set())}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </motion.button>
            </div>
          </motion.div>
        )}

        <div className="backdrop-blur-md bg-white/60 shadow-lg border border-gray-200 relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-primary" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  <th className="px-4 py-6 w-12">
                    <input 
                      type="checkbox"
                      checked={selectedPayments.size === sortedPayments.length && sortedPayments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-8 py-6">Receipt</th>
                  <th className="px-8 py-6">Student</th>
                  <th className="px-8 py-6">Method</th>
                  <th 
                    onClick={() => setSortBy('date') || (sortBy === 'date' ? setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') : setSortOrder('desc'))}
                    className="px-8 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortBy === 'date' && <ArrowUpDown size={12} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th 
                    onClick={() => setSortBy('amount') || (sortBy === 'amount' ? setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') : setSortOrder('desc'))}
                    className="px-8 py-6 text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Amount
                      {sortBy === 'amount' && <ArrowUpDown size={12} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-medium text-gray-800/90">
                {paymentsLoading ? (
                  <TableSkeleton rows={4} />
                ) : sortedPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center text-gray-600">
                      <div className="flex flex-col items-center gap-4 py-10 opacity-40">
                        <CreditCard size={64} strokeWidth={1} />
                        <div className="space-y-1">
                          <p className="text-lg font-bold">No Transactions Found</p>
                          <p className="text-xs">Click "Record Payment" to add the first payment.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedPayments.map((p, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      key={p.id} 
                      className="hover:bg-gray-50 transition-all group"
                    >
                      <td className="px-4 py-5">
                        <input 
                          type="checkbox"
                          checked={selectedPayments.has(p.id)}
                          onChange={() => togglePaymentSelection(p.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-8 py-5">
                        <button
                          onClick={() => handleDownloadReceipt(p.id)}
                          className="flex items-center gap-3 hover:text-blue-600 transition-colors group"
                        >
                          <div className={`p-2 ${p.verified ? 'bg-green-400/10 text-green-400' : 'bg-orange-400/10 text-orange-400'} rounded-lg group-hover:bg-blue-400/10 group-hover:text-blue-400 transition-colors`}>
                            {p.verified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          </div>
                          <span className="font-mono text-xs font-bold tracking-widest underline decoration-dotted underline-offset-2">{p.receipt_number}</span>
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-bold group-hover:text-blue-600 transition-colors">{p.student_name}</p>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{p.term_name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl w-fit">
                          {getMethodIcon(p.payment_method)}
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.payment_method.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-gray-600 font-bold text-xs">
                        {new Date(p.payment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-lg font-black text-gray-800">
                          UGX {parseInt(p.amount).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${
                          p.verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {p.verified ? (
                            <>
                              <CheckCircle2 size={14} />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} verified records
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-800" />
                </button>
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-blue-600 shadow-sm">
                  Page {page} of {totalPages}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-800" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Drawer */}
      <PaymentDrawer 
        isOpen={showDrawer}
        students={students}
        terms={terms}
        selectedTerm={selectedTerm}
        onPaymentSuccess={handlePaymentSuccess}
        onClose={() => setShowDrawer(false)}
      />


      {/* SMS Reminders Confirmation Dialog */}
      <ConfirmDialog
        isOpen={smsConfirm.isOpen}
        title="Send SMS Reminders?"
        message="Are you sure you want to dispatch SMS reminders to all students with outstanding balances for this term?"
        icon={AlertTriangle}
        isDangerous={true}
        onConfirm={handleSmsConfirm}
        onCancel={handleSmsCancel}
        confirmText="Send Reminders"
        cancelText="Cancel"
        isLoading={reminderMutation.isPending}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        type="payments"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          setShowBulkImport(false);
          toast.success('Payments imported successfully!');
        }}
      />

      {/* Bulk Verify Modal */}
      {bulkVerifyMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!bulkVerifyMutation.isPending) {
              setBulkVerifyMode(false);
            }
          }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-md flex items-center justify-center z-50"
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
            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
              <div className="absolute inset-0 bp-gradient opacity-20" />
              <div className="relative flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Verify Payments</h3>
                  <p className="text-xs text-green-50 opacity-80 mt-1">Mark selected payments as verified</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-gray-800">
                  Verifying <span className="text-green-600 text-lg">{selectedPayments.size}</span> payment{selectedPayments.size !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  These payments will be marked as verified in the system. This action can be reversed by changing the status back to pending.
                </p>
              </div>

              {/* Verification Notes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                  Verification Notes <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes about these verifications... e.g., 'Confirmed via bank statement'"
                  disabled={bulkVerifyMutation.isPending}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50 transition-all"
                  rows="3"
                />
              </div>

              {/* Selected Payments List */}
              <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-3 space-y-1.5">
                {Array.from(selectedPayments).map(paymentId => {
                  const payment = sortedPayments.find(p => p.id === paymentId);
                  return payment ? (
                    <div key={payment.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-bold text-gray-800">{payment.receipt_number}</p>
                        <p className="text-gray-600">{payment.student_name}</p>
                      </div>
                      <p className="font-black text-gray-800">UGX {parseInt(payment.amount).toLocaleString()}</p>
                    </div>
                  ) : null;
                })}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setBulkVerifyMode(false);
                    setVerificationNotes('');
                  }}
                  disabled={bulkVerifyMutation.isPending}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBulkVerify}
                  disabled={bulkVerifyMutation.isPending}
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkVerifyMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Verify All
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Payments;
