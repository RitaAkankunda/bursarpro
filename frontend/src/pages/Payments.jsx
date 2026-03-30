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
  BellRing
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const PaymentDrawer = ({ isOpen, students, terms, selectedTerm, onPaymentSuccess }) => {
  const { addPayment } = useDashboard();
  const [form, setForm] = useState({
    student: '',
    term: selectedTerm,
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    receipt_number: `REC-${Date.now()}`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successSteps, setSuccessSteps] = useState({
    payment: false,
    dashboard: false,
    sms: false
  });

  // Update term when selectedTerm changes
  useEffect(() => {
    setForm(f => ({ ...f, term: selectedTerm }));
  }, [selectedTerm]);

  // Auto-populate amount when student and term are selected
  useEffect(() => {
    if (form.student && form.term) {
      const selectedStudent = students.find(s => s.id == form.student);
      if (selectedStudent && selectedStudent.class_level) {
        // Fetch the fee structure for this student's class and term
        api.get(`/fee-structures/?term_id=${form.term}&class_level_id=${selectedStudent.class_level}`)
          .then(res => {
            if (res.data && res.data.length > 0) {
              const fee = res.data[0];
              setForm(f => ({ ...f, amount: fee.amount }));
            }
          })
          .catch(err => console.error('Error fetching fee:', err));
      }
    }
  }, [form.student, form.term, students]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (paymentForm) => api.post('/payments/', paymentForm),
    onSuccess: (res) => {
      onPaymentSuccess(res.data);
      setSuccessSteps(s => ({ ...s, payment: true }));
      
      setTimeout(() => {
        addPayment(form.amount);
        setSuccessSteps(s => ({ ...s, dashboard: true }));
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      }, 400);

      setTimeout(() => setSuccessSteps(s => ({ ...s, sms: true })), 800);
      
      setSuccess(true);
      toast.success('Payment recorded successfully!');
      
      setTimeout(() => {
        setForm({
          student: '',
          term: selectedTerm,
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'CASH',
          receipt_number: `REC-${Date.now()}`
        });
        setSuccess(false);
      }, 2000);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to record payment';
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);
    setSuccessSteps({ payment: false, dashboard: false, sms: false });
    mutation.mutate(form);
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: isOpen ? 0 : 400 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-screen w-96 bg-gradient-to-b from-white to-gray-50 border-l border-gray-300 z-40 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 px-8 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-800">Record Payment</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Replaced generic error block with toast */}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl space-y-3"
          >
            <div className="flex items-center gap-3 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Payment Successfully Processed!</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 text-emerald-400">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0 }}
                  className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-gray-800 text-xs"
                >
                  ✓
                </motion.div>
                <span className="font-medium">Payment recorded to database</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-400">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.3 }}
                  className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-gray-800 text-xs"
                >
                  ✓
                </motion.div>
                <span className="font-medium">Dashboard stats updated live</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-400">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.6 }}
                  className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-gray-800 text-xs"
                >
                  ✓
                </motion.div>
                <span className="font-medium">SMS notification sent to parent</span>
              </div>
            </div>
          </motion.div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Student</label>
          <div className="relative">
            <select
              required
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none cursor-pointer pr-10 text-gray-800"
            >
              <option value="" className="bg-white text-gray-800 text-gray-800">Select a student</option>
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-white text-gray-800 text-gray-800">{s.first_name} {s.last_name} ({s.student_id})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-3 text-gray-600 text-xs">▼</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Term</label>
          <div className="relative">
            <select
              required
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none cursor-pointer pr-10 text-gray-800"
            >
              {terms.map(t => (
                <option key={t.id} value={t.id} className="bg-white text-gray-800 text-gray-800">{t.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-3 text-gray-600 text-xs">▼</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Amount (UGX)</label>
            {form.amount && form.student && (
              <span className="text-[10px] text-emerald-400 font-bold">✓ Auto-calculated</span>
            )}
          </div>
          <input
            type="number"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            placeholder="Select a student and term to auto-populate"
          />
          {form.amount && (
            <p className="text-xs text-gray-600 mt-2">
              Expected fee: <span className="text-emerald-400 font-bold">UGX {Number(form.amount).toLocaleString()}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Payment Date</label>
          <input
            type="date"
            required
            value={form.payment_date}
            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'CASH', label: 'Cash', icon: <Banknote size={16} /> },
              { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone size={16} /> },
              { value: 'BANK_TRANSFER', label: 'Bank', icon: <CreditCard size={16} /> }
            ].map(method => (
              <button
                key={method.value}
                type="button"
                onClick={() => setForm({ ...form, payment_method: method.value })}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 font-bold text-xs ${
                  form.payment_method === method.value
                    ? 'border-primary bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-primary/50'
                }`}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-4 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 text-lg"
        >
          {mutation.isPending ? <Loader2 className="animate-spin inline mr-2" size={20} /> : <CheckCircle2 className="inline mr-2" size={20} />}
          Record Payment
        </button>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
          <p className="text-gray-600"><span className="font-bold">Receipt #:</span> {form.receipt_number}</p>
          <p className="text-gray-600 font-mono">{form.payment_date}</p>
        </div>
      </form>
    </motion.div>
  );
};

const Payments = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [page, setPage] = useState(1);

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

  const handleSendReminders = () => {
    if (window.confirm("Are you sure you want to dispatch SMS reminders to all students with outstanding balances for this term?")) {
      const toastId = toast.loading('Dispatching SMS alerts...');
      reminderMutation.mutate(undefined, {
        onSuccess: (res) => toast.success(res.data.detail, { id: toastId }),
        onError: () => toast.error('Failed to send alerts', { id: toastId })
      });
    }
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

        <div className="backdrop-blur-md bg-white/60 shadow-lg border border-gray-200 relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-primary" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  <th className="px-8 py-6">Receipt #</th>
                  <th className="px-8 py-6">Student</th>
                  <th className="px-8 py-6">Method</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6 text-right">Amount</th>
                  <th className="px-8 py-6 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-medium text-gray-800/90">
                {paymentsLoading ? (
                  <TableSkeleton rows={4} />
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-gray-600">
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
                  payments.map((p, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      key={p.id} 
                      className="hover:bg-gray-50 transition-all group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-400/10 text-emerald-400 rounded-lg">
                            <CheckCircle2 size={14} />
                          </div>
                          <span className="font-mono text-xs font-bold tracking-widest">{p.receipt_number}</span>
                        </div>
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
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleDownloadReceipt(p.id)}
                          className="inline-flex items-center justify-center p-3 hover:bg-primary/20 hover:text-blue-600 rounded-2xl transition-all border border-transparent hover:border-primary/20 group/btn"
                        >
                          <FileText size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
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
      />

      {/* Backdrop for drawer */}
      {showDrawer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDrawer(false)}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30"
        />
      )}
    </DashboardLayout>
  );
};

export default Payments;
