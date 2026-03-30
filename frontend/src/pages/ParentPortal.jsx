import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Download, AlertCircle, Loader2, TrendingDown, CreditCard, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parent Portal</h1>
            <p className="text-gray-600 text-sm font-medium">Hello, {parentName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg transition border border-gray-200"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </motion.div>

        {/* Student Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-md bg-white/60 rounded-xl p-6 space-y-3 border border-white/30 shadow-lg"
        >
          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Viewing Student</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-800">{balance.student_name}</p>
              <p className="text-sm text-gray-600">Class: {balance.class} | Term: {balance.term}</p>
            </div>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-md rounded-2xl p-8 space-y-4 border-2 shadow-lg ${statusColors[balance.payment_status]}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/30 rounded-lg">
              <StatusIcon size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-75">Payment Status</p>
              <p className="text-lg font-bold capitalize">{(balance.payment_status || 'unknown').replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold opacity-75">Expected Amount</p>
              <p className="text-2xl font-black">UGX {Number(balance.expected_amount || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold opacity-75">Amount Paid</p>
              <p className="text-2xl font-black text-green-700">UGX {Number(balance.amount_paid || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-xs font-bold opacity-75 mb-2">Outstanding Balance</p>
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black">UGX {Number(balance.balance_outstanding || 0).toLocaleString()}</p>
                {(balance.balance_outstanding || 0) > 0 && (
                  <p className="text-sm font-bold opacity-75 mb-1">to be paid</p>
                )}
              </div>
              {(balance.balance_outstanding || 0) > 0 && (
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="px-6 py-3 bg-white text-blue-900 rounded-xl font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <CreditCard size={20} /> Pay Now
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-md bg-white/60 rounded-xl p-6 space-y-4 border border-white/30 shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800">Payment History</h2>
          
          {payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 font-medium">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, idx) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Receipt {payment.receipt_number}</p>
                    <p className="text-xs text-gray-600">{payment.term} • {payment.payment_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-green-600 text-lg">UGX {Number(payment.amount).toLocaleString()}</p>
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

        {/* Footer Info */}
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
