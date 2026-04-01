import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, UserPlus, Loader2, AlertCircle, School, ArrowRight, CheckCircle2, Briefcase, Crown, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    school_name: '',
    role: 'BURSAR'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'BURSAR', label: 'Bursar / School Admin', desc: 'Manage fees, students, and accounts', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { value: 'HEADMASTER', label: 'Headmaster', desc: 'View reports and oversight', icon: Crown, color: 'from-purple-500 to-purple-600' },
    { value: 'TEACHER', label: 'Teacher', desc: 'View student information', icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      toast.success('Registration successful! Redirecting to login...');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(
        err.response?.data?.username?.[0] || 
        err.response?.data?.email?.[0] || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6 font-outfit">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="backdrop-blur-md bg-white/60 shadow-lg max-w-md w-full p-12 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-400/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-400/30 shadow-2xl shadow-emerald-400/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-800">Account Created!</h2>
          <p className="text-gray-600 font-medium">Your school profile is ready. Redirecting you to login...</p>
          <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              className="bg-emerald-400 h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/30 shadow-2xl w-full max-w-2xl p-16 space-y-12 relative z-10 border border-white/40 rounded-4xl"
      >
        <div className="text-center space-y-5">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-2 shadow-2xl shadow-blue-500/30 ring-1 ring-blue-400/50"
          >
            <School className="w-12 h-12 text-white" />
          </motion.div>
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black tracking-tight text-gray-900"
            >
              Register Your School
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 font-bold uppercase tracking-[0.15em] text-[10px]"
            >
              Start managing fees professionally
            </motion.p>
          </div>
        </div>

        <motion.form 
          onSubmit={handleRegister} 
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 text-red-600 text-sm font-bold"
            >
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Preferred Username</label>
              <input
                type="text"
                required
                className="w-full px-6 py-5 bg-white/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/70 border border-white/40 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-600/40 hover:border-white/60"
                placeholder="e.g. greenhill_admin"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </motion.div>
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Official Email</label>
              <input
                type="email"
                required
                className="w-full px-6 py-5 bg-white/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/70 border border-white/40 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-600/40 hover:border-white/60"
                placeholder="admin@school.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </motion.div>
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Strong Password</label>
              <input
                type="password"
                required
                className="w-full px-6 py-5 bg-white/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/70 border border-white/40 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-600/40 hover:border-white/60"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </motion.div>
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Full School Name</label>
              <input
                type="text"
                required
                className="w-full px-6 py-5 bg-white/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/70 border border-white/40 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-600/40 hover:border-white/60"
                placeholder="e.g. St. Peters SS"
                value={formData.school_name}
                onChange={(e) => setFormData({...formData, school_name: e.target.value})}
              />
            </motion.div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Your Role</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roleOptions.map((option, idx) => {
                  const Icon = option.icon;
                  const isSelected = formData.role === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, role: option.value})}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`relative p-6 rounded-3xl border-2 transition-all text-center group overflow-hidden ${
                        isSelected
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-2xl shadow-blue-200/50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50'
                      }`}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-gray-400 to-transparent transition-opacity duration-300" />
                      <div className="relative z-10 space-y-3">
                        <div className={`inline-flex p-3 rounded-2xl transition-all ${
                          isSelected 
                            ? `bg-gradient-to-br ${option.color} text-white shadow-lg` 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`font-black text-sm transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{option.desc}</p>
                        </div>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="pt-2"
                          >
                            <div className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              Selected
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative py-5 btn-primary text-gray-800 font-black rounded-3xl transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center gap-3 w-full justify-center">
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Create Professional Account
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <ArrowRight size={22} />
                  </motion.div>
                </>
              )}
            </div>
          </motion.button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600 font-medium">
            Already registered? <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors font-black underline underline-offset-4 hover:underline-offset-2">Sign in to your school</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
