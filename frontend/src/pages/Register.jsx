import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, UserPlus, Loader2, AlertCircle, School, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import authService from '../services/auth';

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
    { value: 'BURSAR', label: 'Bursar / School Admin', desc: 'Manage fees, students, and accounts' },
    { value: 'HEADMASTER', label: 'Headmaster', desc: 'View reports and oversight' },
    { value: 'ACCOUNTANT', label: 'Accountant', desc: 'Record payments and view records' },
    { value: 'TEACHER', label: 'Teacher', desc: 'View student information' },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
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
    <div className="min-h-screen w-full gradient-bg flex items-center justify-center p-6 font-outfit">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-2xl p-12 space-y-10 relative z-10 border border-gray-300"
      >
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-5 bg-primary/20 rounded-3xl mb-2 shadow-2xl shadow-primary/20 ring-1 ring-blue-200"
          >
            <School className="w-12 h-12 text-blue-600" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-gray-800">Register Your School</h1>
            <p className="text-gray-600 font-bold uppercase tracking-[0.2em] text-[10px]">Start managing fees professionally</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-4 text-accent text-sm font-bold"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Preferred Username</label>
              <input
                type="text"
                required
                className="w-full px-6 py-5 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-bold placeholder:text-gray-600/30"
                placeholder="e.g. greenhill_admin"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Official Email</label>
              <input
                type="email"
                required
                className="w-full px-6 py-5 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-bold placeholder:text-gray-600/30"
                placeholder="admin@school.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Strong Password</label>
              <input
                type="password"
                required
                className="w-full px-6 py-5 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-bold placeholder:text-gray-600/30"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Full School Name</label>
              <input
                type="text"
                required
                className="w-full px-6 py-5 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-bold placeholder:text-gray-600/30"
                placeholder="e.g. St. Peters SS"
                value={formData.school_name}
                onChange={(e) => setFormData({...formData, school_name: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Your Role</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({...formData, role: option.value})}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.role === option.value
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-white/20'
                    }`}
                  >
                    <p className="font-black text-sm text-gray-800">{option.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 btn-primary text-gray-800 font-black rounded-2xl transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Create Professional Account
                <ArrowRight size={22} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-medium">
            Already registered? <Link to="/login" className="text-blue-600 hover:text-gray-800 transition-colors font-black underline underline-offset-4">Sign in to your school</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
