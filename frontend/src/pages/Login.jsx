import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Eye, EyeOff, Loader2 } from 'lucide-react';
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

    if (!username.trim()) { toast.error('Username is required'); return; }
    if (!password.trim()) { toast.error('Password is required'); return; }

    setLoading(true);
    try {
      await authService.login(username, password);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Successfully logged in!');
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'HEADMASTER') navigate('/headmaster-dashboard');
      else if (userRole === 'TEACHER') navigate('/teacher-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      let errorMsg = '';
      if (!err.response) errorMsg = 'Network error - Cannot connect to server.';
      else if (err.response.status === 401) errorMsg = 'Invalid username or password.';
      else errorMsg = err.response?.data?.detail || 'Login failed. Please verify your credentials.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blobTL} />
      <div style={styles.blobBR} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={styles.card}
      >
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <Layers size={26} color="#38bdf8" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>BURSAR PRO</h1>
        <p style={styles.subtitle}>Secure School Fees Management System</p>

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Username */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Staff Username</label>
            <div style={styles.inputWrap}>
              <input
                type="text"
                autoComplete="off"
                spellCheck="false"
                required
                disabled={loading}
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Password</label>
              <Link to="/forgot-password" style={styles.forgotLink}>Forgot Password?</Link>
            </div>
            <div style={{ ...styles.inputWrap, position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={loading}
                style={{ ...styles.input, paddingRight: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={17} color="#64748b" /> : <Eye size={17} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Validating…</>
            ) : 'Sign In to Portal'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>Quick Access</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Quick access icons */}
        <div style={styles.quickRow}>
          {['🏫', '📅', '🕐'].map((icon, i) => (
            <button key={i} style={styles.quickBtn}>{icon}</button>
          ))}
        </div>

        {/* Footer links */}
        <p style={styles.footerText}>
          New to the system?{' '}
          <Link to="/register" style={styles.link}>Request Access</Link>
        </p>
        <p style={styles.footerText}>
          <Link to="/parent-login" style={styles.link}>👨‍👩‍👧 Parent Portal Access</Link>
        </p>

        <p style={styles.version}>Secure connection • v1.0.0</p>
      </motion.div>

      {/* Page footer */}
      <p style={styles.pageFooter}>© 2025 BursarPro School Management System. All Data Protected.</p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

const INPUT_BG = 'rgba(15,23,42,0.55)';
const CARD_BG = 'rgba(10,22,40,0.82)';
const BORDER = '1px solid rgba(56,189,248,0.15)';
const BORDER_FOCUS = '1px solid rgba(56,189,248,0.6)';

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #0a1628 0%, #062236 50%, #0a1f2e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '420px', height: '420px',
    background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  blobBR: {
    position: 'absolute', bottom: '-80px', left: '-80px',
    width: '380px', height: '380px',
    background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 10,
    background: CARD_BG,
    border: '1px solid rgba(56,189,248,0.18)',
    borderRadius: '20px',
    padding: '40px 36px 32px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08)',
    backdropFilter: 'blur(20px)',
    textAlign: 'center',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '18px' },
  logoCircle: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0c2d4a, #0e3a5c)',
    border: '2px solid rgba(56,189,248,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(56,189,248,0.25)',
  },
  title: {
    fontSize: '22px', fontWeight: '800', letterSpacing: '3px',
    color: '#f0f9ff', margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '12px', color: '#38bdf8', letterSpacing: '0.5px',
    marginBottom: '28px', opacity: 0.85,
  },
  form: { textAlign: 'left' },
  fieldGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '7px', letterSpacing: '0.5px' },
  inputWrap: {},
  input: {
    width: '100%', padding: '11px 14px',
    background: INPUT_BG, border: BORDER,
    borderRadius: '10px', outline: 'none', color: '#e2e8f0',
    fontSize: '14px', fontFamily: 'inherit',
    transition: 'border 0.2s, box-shadow 0.2s',
  },
  inputFocus: { border: BORDER_FOCUS, boxShadow: '0 0 0 3px rgba(56,189,248,0.12)' },
  inputBlur: { border: BORDER, boxShadow: 'none' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  forgotLink: { fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' },
  submitBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    border: 'none', borderRadius: '10px',
    color: '#fff', fontWeight: '700', fontSize: '15px',
    cursor: 'pointer', letterSpacing: '0.5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginTop: '6px',
    boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
    fontFamily: 'inherit',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0 16px' },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' },
  dividerText: { fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' },
  quickRow: { display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' },
  quickBtn: {
    width: '48px', height: '44px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  footerText: { fontSize: '13px', color: '#64748b', marginBottom: '6px', marginTop: '4px' },
  link: { color: '#38bdf8', textDecoration: 'none', fontWeight: '600' },
  version: { fontSize: '11px', color: '#334155', marginTop: '16px' },
  pageFooter: {
    position: 'absolute', bottom: '18px',
    fontSize: '12px', color: '#334155', zIndex: 10, textAlign: 'center',
  },
};

export default Login;
