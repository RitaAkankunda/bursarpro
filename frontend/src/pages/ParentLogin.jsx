import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, Loader2, Users, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ParentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!studentId.trim()) {
      toast.error('Student ID is required');
      setLoading(false);
      return;
    }
    if (!pinCode) {
      toast.error('PIN is required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/parent-pin/`, {
        student_id: studentId.trim(),
        pin_code: pinCode,
      });

      const { access, refresh, student_name, parent_name, student_id } = response.data;
      
      // Store tokens and parent info
      localStorage.setItem('parent_access_token', access);
      localStorage.setItem('parent_refresh_token', refresh);
      localStorage.setItem('parent_student_id', student_id);
      localStorage.setItem('parent_student_name', student_name);
      localStorage.setItem('parent_name', parent_name);
      localStorage.setItem('user_role', 'PARENT');

      setStudentInfo({ student_name, parent_name });
      setSuccess(true);
      toast.success('Login successful!');
      
      setTimeout(() => {
        navigate('/parent-portal');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMsg = 'Login failed - Please try again';
      if (err.response?.status === 401) {
        errorMsg = 'Invalid Student ID or PIN';
      } else if (err.response?.status === 404) {
        errorMsg = 'Student not found';
      } else if (err.response?.status === 400) {
        const data = err.response?.data;
        if (typeof data === 'object' && !Array.isArray(data)) {
          errorMsg = Object.values(data)[0];
        } else {
          errorMsg = 'Invalid request';
        }
      } else if (err.response?.status === 500) {
        errorMsg = 'Server error - Please try again later';
      } else if (err.message === 'Network Error') {
        errorMsg = 'Network error - Cannot connect to server';
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success && studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 font-outfit">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="backdrop-blur-md bg-white/80 border border-white/30 rounded-2xl max-w-md w-full p-12 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-300 shadow-lg">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-800">Welcome Back!</h2>
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Viewing: <span className="text-blue-600 font-black">{studentInfo.student_name}</span></p>
            <p className="text-sm text-gray-600">Taking you to the portal...</p>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5 }}
              className="bg-emerald-500 h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 font-outfit">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/80 border border-white/30 rounded-2xl w-full max-w-md p-10 space-y-8 relative z-10 shadow-2xl"
      >
        <div className="text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-4 bg-blue-100 rounded-3xl mb-2 shadow-lg ring-1 ring-white/20"
          >
            <Users className="w-10 h-10 text-blue-600" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-gray-800">Parent Portal</h1>
            <p className="text-gray-600 font-bold uppercase tracking-[0.2em] text-[10px]">View your child's balance & payments</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">
              Student ID
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 1"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">
              PIN Code (4-6 digits)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••"
                maxLength="6"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold placeholder:text-gray-400 tracking-widest"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600">You received this PIN from your school</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Access Portal
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-600">
            Trouble logging in? Contact your school's Bursar office
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentLogin;
