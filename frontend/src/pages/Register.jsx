import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    school_name: '',
    role: 'BURSAR',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'BURSAR', label: 'Bursar / Admin' },
    { value: 'HEADMASTER', label: 'Headmaster' },
    { value: 'TEACHER', label: 'Teacher' },
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
      <div style={styles.page}>
        <div style={styles.blobTL} />
        <div style={styles.blobBR} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ ...styles.card, textAlign: 'center', padding: '56px 40px' }}
        >
          <div style={styles.successIcon}>
            <CheckCircle2 size={44} color="#22c55e" />
          </div>
          <h2 style={{ color: '#f0f9ff', fontSize: '24px', fontWeight: '800', margin: '0 0 10px' }}>Account Created!</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Your school profile is ready. Redirecting to login…
          </p>
          <div style={styles.progressBg}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              style={styles.progressFill}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.blobTL} />
      <div style={styles.blobBR} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ ...styles.card, maxWidth: '480px' }}
      >
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <Layers size={26} color="#38bdf8" strokeWidth={2} />
          </div>
        </div>

        <h1 style={styles.title}>CREATE ACCOUNT</h1>
        <p style={styles.subtitle}>Register your school on BursarPro</p>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <form onSubmit={handleRegister} style={styles.form}>
          {/* 2-column grid for username + email */}
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text" required disabled={loading}
                style={styles.input}
                placeholder="e.g. admin123"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Official Email</label>
              <input
                type="email" required disabled={loading}
                style={styles.input}
                placeholder="admin@school.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required disabled={loading}
                style={{ ...styles.input, paddingRight: '44px' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={17} color="#64748b" /> : <Eye size={17} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* School Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full School Name</label>
            <input
              type="text" required disabled={loading}
              style={styles.input}
              placeholder="e.g. St. Peters Secondary School"
              value={formData.school_name}
              onChange={e => setFormData({ ...formData, school_name: e.target.value })}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
            />
          </div>

          {/* Role selector */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Your Role</label>
            <div style={styles.roleRow}>
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: opt.value })}
                  style={{
                    ...styles.roleBtn,
                    ...(formData.role === opt.value ? styles.roleBtnActive : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
            ) : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ ...styles.footerText, marginTop: '20px' }}>
          Already registered?{' '}
          <Link to="/login" style={styles.link}>Sign in to your school</Link>
        </p>

        <p style={styles.version}>Secure connection • v1.0.0</p>
      </motion.div>

      <p style={styles.pageFooter}>© 2025 BursarPro School Management System. All Data Protected.</p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::placeholder { color: #475569; opacity: 1; }
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
    minHeight: '100vh', width: '100%',
    background: 'linear-gradient(135deg, #0a1628 0%, #062236 50%, #0a1f2e 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px', fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute', top: '-80px', right: '-80px', width: '420px', height: '420px',
    background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  blobBR: {
    position: 'absolute', bottom: '-80px', left: '-80px', width: '380px', height: '380px',
    background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 10,
    background: CARD_BG, border: '1px solid rgba(56,189,248,0.18)', borderRadius: '20px',
    padding: '40px 36px 32px', width: '100%',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08)',
    backdropFilter: 'blur(20px)', textAlign: 'center',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '16px' },
  logoCircle: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0c2d4a, #0e3a5c)',
    border: '2px solid rgba(56,189,248,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(56,189,248,0.25)',
  },
  title: { fontSize: '20px', fontWeight: '800', letterSpacing: '3px', color: '#f0f9ff', margin: '0 0 6px' },
  subtitle: { fontSize: '12px', color: '#38bdf8', letterSpacing: '0.5px', marginBottom: '24px', opacity: 0.85 },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '12px 16px', color: '#fca5a5',
    fontSize: '13px', marginBottom: '16px', textAlign: 'left',
  },
  form: { textAlign: 'left' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  fieldGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '7px', letterSpacing: '0.5px' },
  input: {
    width: '100%', padding: '11px 14px',
    background: INPUT_BG, border: BORDER, borderRadius: '10px',
    outline: 'none', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit',
    transition: 'border 0.2s, box-shadow 0.2s',
  },
  inputFocus: { border: BORDER_FOCUS, boxShadow: '0 0 0 3px rgba(56,189,248,0.12)' },
  inputBlur: { border: BORDER, boxShadow: 'none' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  roleRow: { display: 'flex', gap: '8px' },
  roleBtn: {
    flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
    background: INPUT_BG, border: BORDER, color: '#94a3b8', cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  roleBtnActive: {
    background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(56,189,248,0.55)',
    color: '#38bdf8', boxShadow: '0 0 12px rgba(56,189,248,0.15)',
  },
  submitBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    border: 'none', borderRadius: '10px', color: '#fff',
    fontWeight: '700', fontSize: '15px', cursor: 'pointer', letterSpacing: '0.5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginTop: '4px', boxShadow: '0 4px 20px rgba(14,165,233,0.4)', fontFamily: 'inherit',
  },
  footerText: { fontSize: '13px', color: '#64748b', marginBottom: '6px' },
  link: { color: '#38bdf8', textDecoration: 'none', fontWeight: '600' },
  version: { fontSize: '11px', color: '#334155', marginTop: '14px' },
  pageFooter: {
    position: 'absolute', bottom: '18px',
    fontSize: '12px', color: '#334155', zIndex: 10, textAlign: 'center',
  },
  successIcon: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
  },
  progressBg: { width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', height: '6px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: '8px' },
};

export default Register;
