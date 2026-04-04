import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Download, AlertCircle, Loader2, TrendingDown, CreditCard, CheckCircle2, ShieldCheck, X, Send, MessageCircle, Bell, Settings, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create a separate axios instance for parent API calls with parent token
const createParentApi = (parentToken) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${parentToken}`,
      'Content-Type': 'application/json',
    }
  });
};

const ParentPortal = () => {
  const [balance, setBalance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, messages, preferences
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '', type: 'GENERAL' });
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();

  const parentToken = localStorage.getItem('parent_access_token');
  const studentName = localStorage.getItem('parent_student_name');
  const parentName = localStorage.getItem('parent_name');
  const studentId = localStorage.getItem('parent_student_id');

  useEffect(() => {
    if (!parentToken) {
      navigate('/parent-login');
      return;
    }
    fetchData();
  }, [parentToken, navigate]);

  const fetchData = async () => {
    try {
      const parentApi = createParentApi(parentToken);

      // Fetch balance
      const balanceRes = await parentApi.get('/student-balance/');
      setBalance(balanceRes.data);

      // Fetch payment history
      const paymentsRes = await parentApi.get('/student-balance/payment_history/');
      setPayments(paymentsRes.data.payments || paymentsRes.data || []);

      setError('');
    } catch (err) {
      console.error('Failed to load balance information:', err);
      if (err.response?.status === 401) {
        setError('🔐 Session expired - Please login again');
        setTimeout(() => {
          localStorage.removeItem('parent_access_token');
          localStorage.removeItem('parent_refresh_token');
          navigate('/parent-login');
        }, 2000);
      } else if (err.response?.status === 404) {
        setError('👤 Student information not found');
      } else {
        setError('⚠️ Failed to load balance information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('parent_refresh_token');
    localStorage.removeItem('parent_student_id');
    localStorage.removeItem('parent_student_name');
    localStorage.removeItem('parent_name');
    localStorage.removeItem('user_role');
    navigate('/parent-login');
  };

  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    try {
      const parentApi = createParentApi(parentToken);
      const response = await parentApi.get(`/student-balance/receipt/${paymentId}/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt:', err);
      alert('Failed to download receipt');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
      const parentApi = createParentApi(parentToken);
      await parentApi.post('/parent-messages/', {
        student: studentId,
        sender_role: 'PARENT',
        message_type: newMessage.type,
        subject: newMessage.subject,
        message: newMessage.message
      });
      setNewMessage({ subject: '', message: '', type: 'GENERAL' });
      setShowMessageForm(false);
      fetchMessages();
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const parentApi = createParentApi(parentToken);
      const res = await parentApi.get(`/parent-messages/?student=${studentId}`);
      setMessages(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const parentApi = createParentApi(parentToken);
      const res = await parentApi.get('/notification-preferences/');
      setNotificationPrefs(res.data);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const updateNotificationPrefs = async (field, value) => {
    try {
      const parentApi = createParentApi(parentToken);
      const updated = { ...notificationPrefs, [field]: value };
      await parentApi.patch(`/notification-preferences/${notificationPrefs.id}/`, { [field]: value });
      setNotificationPrefs(updated);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const processOnlinePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const parentApi = createParentApi(parentToken);
      await parentApi.post('/student-balance/pay_online/', {
        amount: balance.balance_outstanding
      });
      // Payment successful, close modal and refresh data
      setIsCheckoutOpen(false);
      fetchData();
      alert('Payment processed successfully! Your balance has been updated.');
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Failed to process payment. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 font-outfit">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-700 font-bold">Loading your balance...</p>
        </motion.div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 font-outfit">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/60 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 text-center space-y-4"
        >
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">{error || 'Unable to Load'}</h2>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  const statusColors = {
    fully_paid: 'bg-green-100 border-green-300 text-green-800',
    partially_paid: 'bg-amber-100 border-amber-300 text-amber-800',
    unpaid: 'bg-orange-100 border-orange-300 text-orange-800'
  };

  const statusIcons = {
    fully_paid: CheckCircle2,
    partially_paid: CreditCard,
    unpaid: TrendingDown
  };

  const StatusIcon = statusIcons[balance.payment_status] || CreditCard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-outfit pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parent Portal</h1>
            <p className="text-gray-600 text-sm font-medium">Welcome, {parentName}! 👋</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg transition border border-gray-200"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </motion.div>

        {/* Student Info & Balance at Top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-md bg-white/60 rounded-xl p-6 space-y-3 border border-white/30 shadow-lg"
          >
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Viewing Student</p>
            <div>
              <p className="text-lg font-bold text-gray-800">{balance.student_name}</p>
              <p className="text-sm text-gray-600">Class: {balance.class} | Term: {balance.term}</p>
            </div>
          </motion.div>

          {/* Balance Card - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-md lg:col-span-2 rounded-2xl p-8 space-y-4 border-2 shadow-lg ${statusColors[balance.payment_status]}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/30 rounded-lg">
                  <StatusIcon size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold opacity-75">Payment Status</p>
                  <p className="text-lg font-bold capitalize">{(balance.payment_status || 'unknown').replace('_', ' ')}</p>
                </div>
              </div>
              {(balance.balance_outstanding || 0) > 0 && (
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="px-6 py-3 bg-white text-blue-900 rounded-xl font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap"
                >
                  <CreditCard size={20} /> Pay Now
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-xs font-bold opacity-75 mb-2">Outstanding Balance</p>
              <p className="text-4xl font-black">UGX {Number(balance.balance_outstanding || 0).toLocaleString()}</p>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 bg-white/60 backdrop-blur-md rounded-2xl p-2 border border-white/30 shadow-lg"
        >
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'history', label: 'Payment History', icon: '📜' },
            { id: 'messages', label: 'Messages', icon: '💬', count: messages.length },
            { id: 'preferences', label: 'Preferences', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'messages') fetchMessages();
                if (tab.id === 'preferences') fetchNotificationPrefs();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-800 hover:bg-white/40'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count && <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{tab.count}</span>}
            </button>
          ))}
        </motion.div>

        {/* Overview Tab */}
        <AnimatePresence>
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Quick Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all"
                >
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Expected Amount</p>
                  <p className="text-2xl font-black text-gray-800 mt-2">UGX {Number(balance.expected_amount).toLocaleString()}</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all"
                >
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Amount Paid</p>
                  <p className="text-2xl font-black text-green-600 mt-2">UGX {Number(balance.amount_paid).toLocaleString()}</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all"
                >
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Collection Progress</p>
                  <div className="mt-2 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${(balance.amount_paid / balance.expected_amount * 100) || 0}%` }}
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-700">{Math.round((balance.amount_paid / balance.expected_amount * 100) || 0)}%</p>
                  </div>
                </motion.div>
              </div>

              {/* Alert Banner if Outstanding */}
              {(balance.balance_outstanding || 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="backdrop-blur-md bg-orange-100/60 border-l-4 border-orange-600 rounded-xl p-6 border border-orange-200 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <AlertTriangle className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-orange-900 mb-1">Outstanding Balance Alert</h3>
                      <p className="text-sm text-orange-800">Your student has an outstanding balance of <span className="font-black">UGX {Number(balance.balance_outstanding).toLocaleString()}</span>. Please make payment to avoid any inconvenience.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="backdrop-blur-md bg-white/60 rounded-xl p-6 space-y-4 border border-white/30 shadow-lg"
            >
              <h2 className="text-lg font-bold text-gray-800">Payment Timeline</h2>
              
              {payments.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock size={40} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {payments.map((payment, idx) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Receipt {payment.receipt_number}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-black text-green-600">UGX {Number(payment.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{payment.term}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadReceipt(payment.id, payment.receipt_number)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300"
                          title="Download receipt"
                        >
                          <Download size={16} className="text-blue-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">School Communications</h2>
                <button
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>

              {/* Message Form */}
              {showMessageForm && (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onSubmit={handleSendMessage}
                  className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg space-y-4"
                >
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Message Type</label>
                    <select 
                      value={newMessage.type} 
                      onChange={(e) => setNewMessage({...newMessage, type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GENERAL">General Inquiry</option>
                      <option value="FEES">Fees Related</option>
                      <option value="PAYMENT">Payment Issue</option>
                      <option value="STUDENT">Student Related</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Subject</label>
                    <input 
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                      placeholder="Brief subject"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Message</label>
                    <textarea 
                      value={newMessage.message}
                      onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                      placeholder="Your message here..."
                      required
                      rows="4"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(false)}
                      className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingMessage ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Messages List */}
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="backdrop-blur-md bg-white/60 rounded-xl p-12 border border-white/30 shadow-lg text-center">
                    <MessageCircle size={40} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg transition-all ${
                        msg.sender_role === 'PARENT' ? 'bg-blue-50/60 border-blue-200' : 'bg-green-50/60 border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{msg.subject}</p>
                          <p className="text-xs text-gray-500">{msg.sender_role === 'PARENT' ? 'You' : 'School'} • {new Date(msg.created_at).toLocaleDateString()}</p>
                        </div>
                        {msg.status !== 'READ' && msg.sender_role !== 'PARENT' && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{msg.message}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Bell size={20} />
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {notificationPrefs && [
                    { key: 'payment_sms', label: 'Payment Confirmation via SMS', icon: '💬' },
                    { key: 'payment_email', label: 'Payment Confirmation via Email', icon: '📧' },
                    { key: 'outstanding_fees_email', label: 'Outstanding Fees Alerts', icon: '⚠️' },
                    { key: 'weekly_summary_email', label: 'Weekly Summary Report', icon: '📊' },
                    { key: 'report_email', label: 'General Reports', icon: '📄' },
                  ].map(pref => (
                    <motion.div
                      key={pref.key}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-white/40 rounded-lg border border-white/50 hover:border-blue-300 transition-all"
                    >
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <span className="text-2xl">{pref.icon}</span>
                        <span className="font-bold text-gray-800">{pref.label}</span>
                      </label>
                      <input
                        type="checkbox"
                        checked={notificationPrefs[pref.key] || false}
                        onChange={(e) => updateNotificationPrefs(pref.key, e.target.checked)}
                        className="w-6 h-6 cursor-pointer"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/30">
                <h3 className="font-bold text-gray-800 mb-4">School Contact Information</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700"><strong>Bursar's Office:</strong> +256 700 123 456</p>
                  <p className="text-sm text-gray-700"><strong>Email:</strong> bursar@school.ug</p>
                  <p className="text-sm text-gray-700"><strong>Website:</strong> www.school.ug</p>
                  <p className="text-sm text-gray-700"><strong>Office Hours:</strong> Monday - Friday, 8AM - 4PM</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-gray-600 py-4"
        >
          <p>Questions? Contact your school's Bursar office</p>
        </motion.div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2 opacity-80 text-sm font-bold tracking-widest uppercase">
                  <ShieldCheck size={16} /> Secure Checkout
                </div>
                <h2 className="text-2xl font-black">Complete Payment</h2>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="relative z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={processOnlinePayment} className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-bold mb-1">Total Due</p>
                  <p className="text-2xl font-black text-gray-800">UGX {balance.balance_outstanding.toLocaleString()}</p>
                </div>
                <CreditCard className="text-blue-300" size={40} />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Payment Method</label>
                  <select className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors cursor-pointer">
                    <option>Mobile Money (MTN / Airtel)</option>
                    <option>Debit / Credit Card</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Phone Number / Card</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 077 123 4567"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-70 disabled:hover:scale-100"
              >
                {isProcessing ? (
                  <><Loader2 size={20} className="animate-spin" /> Processing...</>
                ) : (
                  <>Pay UGX {Number(balance.balance_outstanding || 0).toLocaleString()}</>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 font-medium">Secured by Stripe & Flutterwave Test APIs</p>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
