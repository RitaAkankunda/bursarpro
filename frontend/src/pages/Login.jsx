import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, LogIn, Loader2, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      await authService.login(username, password);
      
      // Wait a moment for role to be set, then check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Successfully logged in!');
      
      // Get user role and redirect accordingly
      const userRole = localStorage.getItem('userRole');
      console.log('User role after login:', userRole);
      
      if (userRole === 'HEADMASTER') {
        navigate('/headmaster-dashboard');
      } else if (userRole === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else if (userRole === 'BURSAR' || userRole === 'ACCOUNTANT') {
        navigate('/students');
      } else {
        // Fallback: if role not found, redirect to students page anyway
        console.warn('User role not found, redirecting to students');
        navigate('/students');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Extract better error messages
      let errorMsg = '';
      
      if (!err.response) {
        // Network error
        errorMsg = 'Network error - Cannot connect to server. Check your connection.';
      } else if (err.response.status === 401) {
        // Authentication failed
        errorMsg = 'Invalid username or password. Please check and try again.';
      } else if (err.response.status === 400) {
        // Bad request - field errors
        const data = err.response.data;
        if (data.username) {
          errorMsg = data.username[0] || 'Invalid username format';
        } else if (data.password) {
          errorMsg = data.password[0] || 'Invalid password format';
        } else if (data.detail) {
          errorMsg = data.detail;
        } else {
          errorMsg = 'Invalid input. Please check your entries.';
        }
      } else if (err.response.status === 404) {
        errorMsg = 'User not found. Please check your username.';
      } else if (err.response.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else {
        errorMsg = err.response?.data?.detail || 
                   err.response?.data?.non_field_errors?.[0] ||
                   'Login failed. Please verify your credentials.';
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 opacity-10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 w-full max-w-md p-8 space-y-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex p-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl mb-2 shadow-lg"
          >
            <Wallet className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-white">Welcome Back</h1>
            <p className="text-blue-200 font-semibold uppercase tracking-wider text-xs">Secure Admin Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-blue-100 uppercase tracking-widest block">Staff Username</label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-white/10 backdrop-blur border border-white/30 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-sm font-medium placeholder:text-gray-400 text-white caret-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-blue-100 uppercase tracking-widest block">Secure Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-white/10 backdrop-blur border border-white/30 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-sm font-medium placeholder:text-gray-400 text-white caret-blue-400 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl transition-all shadow-xl active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </motion.button>
        </form>

        {/* Security Info */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
            <ShieldCheck size={14} className="text-blue-400" strokeWidth={2.5} />
            End-to-End Encrypted Session
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-300 font-medium">
              New school manager? <Link to="/register" className="text-blue-300 hover:text-blue-200 transition-colors font-bold">Register here</Link>
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">
              👨‍👩‍👧 <Link to="/parent-login" className="text-blue-300 hover:text-blue-200 transition-colors font-bold">Parent Portal Access</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
