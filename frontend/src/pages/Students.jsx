import { useEffect, useState } from 'react';
import { 
  Search, 
  UserPlus, 
  X,
  Filter,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  MoreVertical,
  Eye,
  MessageSquare,
  Send,
  FileText,
  AlertOctagon,
  Calendar,
  CheckSquare,
  Square,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import BulkImportModal from '../components/BulkImportModal';
import NotificationBadge from '../components/NotificationBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

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
              <p className="text-xs font-semibold text-red-700">This action cannot be undone</p>
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
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-600/30'
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

// StudentStatsCard Component
const StudentStatsCard = ({ icon: Icon, label, value, color, trend, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    transition={{ type: "spring", damping: 20 }}
    className={`backdrop-blur-md ${color} shadow-lg border border-white/20 relative overflow-hidden rounded-2xl p-6 space-y-3 group cursor-default`}
  >
    <div className="absolute top-0 right-0 w-24 h-24 opacity-10 -mr-8 -mt-8 group-hover:scale-110 transition-transform">
      <Icon size={128} />
    </div>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-3xl font-black mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white opacity-80`}>
        <Icon size={24} />
      </div>
    </div>
    {trend && (
      <div className="relative z-10 flex items-center gap-2 text-xs font-bold opacity-75">
        <TrendingUp size={14} />
        <span>{trend}</span>
      </div>
    )}
    {subtext && (
      <p className="relative z-10 text-xs opacity-70">{subtext}</p>
    )}
  </motion.div>
);

// Payment History Modal
const PaymentHistoryModal = ({ isOpen, student, onClose }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      api.get(`/payments/?student_id=${student.id}`)
        .then(res => setPayments(res.data.results || res.data || []))
        .catch(err => {
          console.error(err);
          toast.error('Failed to load payment history');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-2xl p-8 rounded-3xl border border-gray-200 space-y-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Payment History</h2>
            <p className="text-sm text-gray-600 mt-1">{student?.first_name} {student?.last_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <AlertCircle size={48} className="mx-auto mb-2" />
            <p className="font-bold">No payments recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-bold text-gray-800">Receipt #{payment.receipt_number}</p>
                  <p className="text-xs text-gray-600">
                    <Calendar size={12} className="inline mr-1" />
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600">UGX {(payment.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{payment.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Send SMS Modal
const SendSMSModal = ({ isOpen, student, onClose }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      await api.post('/notifications/', {
        notification_type: 'OUTSTANDING_FEES',
        channel: 'SMS',
        message: message,
        recipient: student?.parent_phone
      });
      toast.success('SMS sent successfully!');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const suggestedMessages = [
    `Dear ${student?.parent_name}, your child ${student?.first_name} has an outstanding balance of UGX ${student?.balance || 0}. Please settle at your earliest convenience.`,
    `Reminder: School fees payment outstanding for ${student?.first_name}. Balance: UGX ${student?.balance || 0}. Contact us for payment options.`,
    `Payment reminder for ${student?.first_name}. Amount due: UGX ${student?.balance || 0}. Thank you.`
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-md p-8 rounded-3xl border border-gray-200 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800">Send SMS</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Phone: {student?.parent_phone}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32 resize-none"
          />
          <p className="text-xs text-gray-500">{message.length} characters</p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Suggested messages:</label>
            {suggestedMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(msg)}
                className="w-full p-2 text-left text-xs bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 transition-colors text-xs line-clamp-2"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendSMS}
            disabled={sending || !message.trim()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Send SMS
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Student Details Modal (Fee Breakdown)
const StudentDetailsModal = ({ isOpen, student, onClose }) => {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      api.get(`/students/${student.id}/`)
        .then(res => setFeeData(res.data))
        .catch(err => {
          console.error(err);
          toast.error('Failed to load student details');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-2xl p-8 rounded-3xl border border-gray-200 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800">Student Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Full Name</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{feeData?.first_name} {feeData?.last_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Student ID</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{feeData?.student_id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Class</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{feeData?.class_level_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Outstanding Balance</p>
                <p className={`text-lg font-black mt-1 ${feeData?.balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  UGX {(feeData?.balance || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Parent Name</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{feeData?.parent_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Parent Phone</p>
                <a href={`tel:${feeData?.parent_phone}`} className="text-lg font-bold text-blue-600 hover:underline mt-1">
                  {feeData?.parent_phone}
                </a>
              </div>
            </div>

            <div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AddStudentModal = ({ isOpen, onClose, onSuccess, classes }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    parent_name: '',
    parent_phone: '',
    class_level: ''
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newStudent) => api.post('/students/', newStudent),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student added successfully!');
      setForm({
        first_name: '',
        last_name: '',
        student_id: '',
        parent_name: '',
        parent_phone: '',
        class_level: ''
      });
      onClose();
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || err.response?.data?.student_id?.[0] || 'Failed to add student';
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-md p-8 rounded-3xl border border-gray-200 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal content begins */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">First Name</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Last Name</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Student ID</label>
            <input
              type="text"
              required
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              placeholder="e.g., STU001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Class Level</label>
            <div className="relative">
              <select
                required
                value={form.class_level}
                onChange={(e) => setForm({ ...form, class_level: e.target.value })}
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer pr-10 font-medium"
              >
                <option value="">
                  {classes.length === 0 ? 'No classes available' : 'Select a class'}
                </option>
                {classes && classes.length > 0 ? (
                  classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                ) : null}
              </select>
              <div className="pointer-events-none absolute right-3 top-3 text-gray-600 text-xs">▼</div>
            </div>
            {classes.length === 0 && (
              <p className="text-xs text-accent mt-2">⚠️ No classes created yet. Go to Settings → Classes to add one.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Parent Name</label>
            <input
              type="text"
              required
              value={form.parent_name}
              onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              placeholder="Parent/Guardian name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Parent Phone</label>
            <input
              type="tel"
              required
              value={form.parent_phone}
              onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
              className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              placeholder="+256701234567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <UserPlus className="inline mr-2" size={18} />}
              Add Student
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Students = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showActions, setShowActions] = useState(null);
  
  // Filter and modal states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'owing'
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkSMSMode, setBulkSMSMode] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  
  // Action modals
  const [paymentHistoryStudent, setPaymentHistoryStudent] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [smsStudent, setSmsStudent] = useState(null);
  const [detailsStudent, setDetailsStudent] = useState(null);

  // Reset page when search or class changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedClass]);

  // Debug mode toggle with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/class-levels/');
      return res.data?.results || res.data || [];
    }
  });

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', selectedClass, search, page],
    queryFn: async () => {
      let url = `/students/?page=${page}&`;
      if (selectedClass) url += `class_level_id=${selectedClass}&`;
      if (search) url += `search=${search}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const students = studentsData?.results || (Array.isArray(studentsData) ? studentsData : []);
  const totalCount = studentsData?.count || students.length || 0;
  const totalPages = Math.ceil(totalCount / 10);

  // Calculate student statistics
  const stats = {
    total: totalCount,
    fullyPaid: students.filter(s => s.balance === 0 || !s.balance).length,
    partiallypaid: students.filter(s => s.balance && s.balance > 0).length,
    totalOutstanding: students.reduce((sum, s) => sum + (s.balance || 0), 0)
  };

  // Apply status filter
  const filteredByStatus = students.filter(s => {
    if (statusFilter === 'paid') return s.balance === 0 || !s.balance;
    if (statusFilter === 'owing') return s.balance && s.balance > 0;
    return true; // 'all'
  });

  // Sort students based on current sort settings
  const sortedStudents = [...filteredByStatus].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    } else if (sortBy === 'balance') {
      comparison = (a.balance || 0) - (b.balance || 0);
    } else if (sortBy === 'status') {
      const getStatus = (student) => {
        if (!student.balance || student.balance === 0) return 2; // Paid
        return 1; // Owing
      };
      comparison = getStatus(a) - getStatus(b);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate risk flag (simple logic: estimate if owing for long time based on amount)
  const getRiskFlag = (student) => {
    const balance = student.balance || 0;
    if (balance === 0) return null;
    if (balance > 500000) return { level: 'high', text: 'High Risk', color: 'bg-red-100 text-red-700' };
    if (balance > 200000) return { level: 'medium', text: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700' };
    return { level: 'low', text: 'Low Risk', color: 'bg-blue-100 text-blue-700' };
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === sortedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(sortedStudents.map(s => s.id)));
    }
  };

  const handleBulkSMS = async () => {
    if (!bulkMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const selectedList = sortedStudents.filter(s => selectedStudents.has(s.id));
    if (selectedList.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const toastId = toast.loading(`Sending SMS to ${selectedList.length} student${selectedList.length !== 1 ? 's' : ''}...`);
    
    try {
      let successCount = 0;
      for (const student of selectedList) {
        try {
          await api.post('/notifications/', {
            notification_type: 'OUTSTANDING_FEES',
            channel: 'SMS',
            message: bulkMessage,
            recipient: student.parent_phone
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send SMS to ${student.first_name}:`, err);
        }
      }
      toast.success(`SMS sent to ${successCount} student${successCount !== 1 ? 's' : ''}!`, { id: toastId });
      setBulkSMSMode(false);
      setBulkMessage('');
      setSelectedStudents(new Set());
    } catch (err) {
      toast.error('Error sending bulk SMS', { id: toastId });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}/`),
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteConfirm({ isOpen: false, studentId: null, studentName: '' });
    },
    onError: () => toast.error('Failed to delete student')
  });

  // Get payment status and styling
  const getPaymentStatus = (balance) => {
    if (!balance || balance === 0) {
      return { status: 'Paid', icon: CheckCircle2, color: 'bg-green-100 text-green-700', badge: '✅' };
    } else {
      return { status: 'Owing', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700', badge: '⚠️' };
    }
  };

  const handleDeleteStudent = (id, name) => {
    setDeleteConfirm({ isOpen: true, studentId: id, studentName: name });
  };

  const confirmDelete = () => {
    if (deleteConfirm.studentId) {
      deleteMutation.mutate(deleteConfirm.studentId);
    }
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading('Preparing CSV export...');
    try {
      let url = '/students/?no_paginate=true&';
      if (selectedClass) url += `class_level_id=${selectedClass}&`;
      if (search) url += `search=${search}`;
      
      const res = await api.get(url);
      const dataToExport = res.data;
      
      if (!dataToExport || dataToExport.length === 0) {
        toast.error('No records found to export', { id: toastId });
        return;
      }

      const headers = ['First Name', 'Last Name', 'Student ID', 'Class Level', 'Parent Name', 'Parent Phone', 'Outstanding Balance'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(s => [
          `"${s.first_name}"`,
          `"${s.last_name}"`,
          `"${s.student_id}"`,
          `"${s.class_level_name || 'N/A'}"`,
          `"${s.parent_name}"`,
          `"${s.parent_phone}"`,
          s.balance || 0
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `students_export_${new Date().getTime()}.csv`);
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
            <h1 className="text-4xl font-black tracking-tight text-gray-800">Student Directory</h1>
            <p className="text-gray-600 font-medium">Manage records and monitor fee status across all students.</p>
          </div>
          
          <div className="flex items-center gap-4">
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
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={20} />
              Add New Student
            </motion.button>

            <NotificationBadge />
          </div>
        </header>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StudentStatsCard 
            icon={Users} 
            label="Total Students" 
            value={stats.total}
            color="bg-gradient-to-br from-blue-600 to-blue-700 text-white"
          />
          <StudentStatsCard 
            icon={CheckCircle2} 
            label="Fully Paid" 
            value={stats.fullyPaid}
            color="bg-gradient-to-br from-green-600 to-green-700 text-white"
            trend={`${Math.round((stats.fullyPaid / stats.total) * 100) || 0}% of total`}
          />
          <StudentStatsCard 
            icon={Clock} 
            label="Outstanding" 
            value={stats.partiallypaid}
            color="bg-gradient-to-br from-amber-500 to-amber-600 text-white"
            trend={`${Math.round((stats.partiallypaid / stats.total) * 100) || 0}% of total`}
          />
          <StudentStatsCard 
            icon={DollarSign} 
            label="Total Balance" 
            value={`UGX ${(stats.totalOutstanding || 0).toLocaleString()}`}
            color="bg-gradient-to-br from-purple-600 to-purple-700 text-white"
            subtext={`${stats.partiallypaid} student${stats.partiallypaid !== 1 ? 's' : ''} owing fees`}
          />
        </div>

        {/* DEBUG INFO - Press Ctrl+Shift+D to toggle */}
        {debugMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-900 border border-gray-700 rounded-xl text-xs font-mono text-green-400 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-500 font-bold">🔧 DEBUG MODE ENABLED</span>
              <button 
                onClick={() => setDebugMode(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Classes Loaded:</span> <span className="text-blue-400 font-bold">{classes.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Page Loading:</span> <span className="text-blue-400 font-bold">{studentsLoading ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-500">Sort By:</span> <span className="text-blue-400 font-bold">{sortBy} ({sortOrder})</span>
              </div>
              <div>
                <span className="text-gray-500">Students Count:</span> <span className="text-blue-400 font-bold">{students.length}</span>
              </div>
              {classes.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Class Names:</span> <span className="text-emerald-400">{classes.map(c => c.name).join(', ')}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by name or registration ID..."
              className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-medium placeholder:text-gray-600/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {classes.length > 0 && (
            <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-gray-200 min-w-fit">
              <div className="flex items-center gap-2 px-4 py-3">
                <Filter size={18} className="text-blue-600" />
                <div className="relative">
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-6 text-gray-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-white text-gray-800 text-gray-800">{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-0 top-0 text-gray-600 text-xs">▼</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STATUS FILTERS */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-600 uppercase">Filter:</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All Students', count: students.length },
              { value: 'paid', label: 'Fully Paid', count: stats.fullyPaid },
              { value: 'owing', label: 'Owing', count: stats.partiallypaid }
            ].map(filter => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  statusFilter === filter.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
                }`}
              >
                {filter.label}
                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${statusFilter === filter.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {filter.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedStudents.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between"
          >
            <p className="font-bold text-blue-900">{selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected</p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBulkSMSMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                <MessageSquare size={16} />
                Send SMS
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStudents(new Set())}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </motion.button>
            </div>
          </motion.div>
        )}

        <div className="backdrop-blur-md bg-white/60 shadow-lg border border-gray-200 relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  <th className="px-4 py-6 w-12">
                    <input 
                      type="checkbox"
                      checked={selectedStudents.size === sortedStudents.length && sortedStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-8 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Student 
                      {sortBy === 'name' && <ArrowUpDown size={12} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="px-8 py-6">ID Number</th>
                  <th className="px-8 py-6">Academic Class</th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-8 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortBy === 'status' && <ArrowUpDown size={12} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('balance')}
                    className="px-8 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Balance
                      {sortBy === 'balance' && <ArrowUpDown size={12} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="px-8 py-6">Contact</th>
                  <th className="px-8 py-6 w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-medium">
                {studentsLoading ? (
                  <TableSkeleton rows={5} />
                ) : sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center text-gray-600">
                      <div className="flex flex-col items-center gap-4 py-10 opacity-40">
                        <GraduationCap size={64} strokeWidth={1} />
                        <div className="space-y-1">
                          <p className="text-lg font-bold">No Students Found</p>
                          <p className="text-xs">Click "Add New Student" to register your first student.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student, idx) => {
                    const paymentStatus = getPaymentStatus(student.balance);
                    const StatusIcon = paymentStatus.icon;
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        key={student.id} 
                        className="hover:bg-gray-50 transition-all border-b border-gray-200 group relative"
                      >
                        <td className="px-4 py-5">
                          <input 
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-blue-700 bg-blue-100 ring-2 ring-white/50 uppercase">
                              {student?.first_name?.charAt(0) || ''}{student?.last_name?.charAt(0) || ''}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{student?.first_name || 'Unknown'} {student?.last_name || ''}</p>
                              <p className="text-xs text-gray-600">{student?.parent_name || 'No Parent Listed'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-mono text-xs font-bold text-blue-600">{student?.student_id}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{student?.class_level_name || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${paymentStatus.color}`}>
                            <StatusIcon size={14} />
                            {paymentStatus.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className={`font-black text-sm ${!student.balance || student.balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              UGX {(student.balance || 0).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">{!student.balance || student.balance === 0 ? 'Settled' : 'Owing'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm">
                          {student?.parent_phone ? (
                            <a 
                              href={`tel:${student.parent_phone}`}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              <span>📱</span>
                              {student.parent_phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No phone</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowActions(showActions === student.id ? null : student.id)}
                            className="p-2.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 font-bold"
                            title="More actions"
                          >
                            <MoreVertical size={20} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} records
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

      {/* ACTIONS MENU - Rendered outside table to avoid clipping */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden w-56 top-1/3 right-1/4"
        >
          <div className="p-2 space-y-1.5">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setPaymentHistoryStudent(sortedStudents.find(s => s.id === showActions));
                setShowActions(null);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-gray-800 font-bold flex items-center gap-3 rounded-lg transition-all hover:text-blue-600"
            >
              <Eye size={18} className="text-blue-600" />
              <span>View Payment History</span>
            </motion.button>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setSmsStudent(sortedStudents.find(s => s.id === showActions));
                setShowActions(null);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-gray-800 font-bold flex items-center gap-3 rounded-lg transition-all hover:text-blue-600"
            >
              <MessageSquare size={18} className="text-blue-600" />
              <span>Send SMS</span>
            </motion.button>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setDetailsStudent(sortedStudents.find(s => s.id === showActions));
                setShowActions(null);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-gray-800 font-bold flex items-center gap-3 rounded-lg transition-all hover:text-blue-600"
            >
              <FileText size={18} className="text-blue-600" />
              <span>View Details</span>
            </motion.button>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                const student = sortedStudents.find(s => s.id === showActions);
                handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`);
                setShowActions(null);
              }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-bold flex items-center gap-3 rounded-lg transition-all hover:text-red-700"
            >
              <Trash2 size={18} />
              <span>Delete Student</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Close menu when clicking outside */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowActions(null)}
        />
      )}

      {/* BULK SMS MODAL */}
      {bulkSMSMode && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-md p-8 rounded-3xl border border-gray-200 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-800">Send SMS to {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}</h2>
              <button onClick={() => { setBulkSMSMode(false); setBulkMessage(''); }} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32 resize-none"
              />
              <p className="text-xs text-gray-500">{bulkMessage.length} characters</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { setBulkSMSMode(false); setBulkMessage(''); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSMS}
                disabled={!bulkMessage.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Send to {selectedStudents.size}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ACTION MODALS */}
      <BulkImportModal 
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        type="students"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['students'] });
          setShowBulkImport(false);
          toast.success('Students imported successfully!');
        }}
      />
      <PaymentHistoryModal 
        isOpen={paymentHistoryStudent !== null}
        student={paymentHistoryStudent}
        onClose={() => setPaymentHistoryStudent(null)}
      />
      <SendSMSModal 
        isOpen={smsStudent !== null}
        student={smsStudent}
        onClose={() => setSmsStudent(null)}
      />
      <StudentDetailsModal 
        isOpen={detailsStudent !== null}
        student={detailsStudent}
        onClose={() => setDetailsStudent(null)}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Student?"
        message={`Are you sure you want to delete ${deleteConfirm.studentName}? All associated payment records will remain in the system.`}
        icon={Trash2}
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, studentId: null, studentName: '' })}
        confirmText="Delete Student"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default Students;
