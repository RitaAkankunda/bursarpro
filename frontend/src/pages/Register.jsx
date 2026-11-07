import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers3,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  BellRing,
  FileText,
} from 'lucide-react';
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

  const featureList = [
    {
      icon: <ShieldCheck size={18} />,
      title: 'Accurate fee management',
      text: 'Track payments, balances, arrears and reconciliations with clarity.',
    },
    {
      icon: <BellRing size={18} />,
      title: 'Parent communication',
      text: 'Send timely reminders and payment updates through integrated messaging.',
    },
    {
      icon: <FileText size={18} />,
      title: 'Reports & visibility',
      text: 'Generate financial reports and stay informed about school collections.',
    },
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
        <div style={styles.glowTop} />
        <div style={styles.glowBottom} />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          style={styles.successCard}
        >
          <div style={styles.successBadge}>
            <CheckCircle2 size={42} color="#0f7a43" />
          </div>

          <p style={styles.eyebrow}>WELCOME TO BURSARPRO</p>
          <h2 style={styles.successTitle}>School account created successfully</h2>
          <p style={styles.successText}>
            Your institution profile is ready. We’re redirecting you to sign in.
          </p>

          <div style={styles.progressTrack}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              style={styles.progressFill}
            />
          </div>
        </motion.div>

        <style>{globalStyles}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={styles.shell}
      >
        {/* Left brand panel */}
        <div style={styles.brandPanel}>
          <div style={styles.brandBadge}>Institutional Finance • School Edition</div>

          <div style={styles.brandLogoWrap}>
            <div style={styles.brandLogoCircle}>
              <Layers3 size={24} color="#0f7a43" />
            </div>
            <div>
              <h1 style={styles.brandName}>BursarPro</h1>
              <p style={styles.brandSub}>
                Smart, secure fee management for Ugandan schools
              </p>
            </div>
          </div>

          <h2 style={styles.brandHeadline}>
            Register your school on a platform designed for{' '}
            <span style={styles.brandHeadlineAccent}>clarity, trust and growth</span>.
          </h2>

          <p style={styles.brandCopy}>
            Bring payment tracking, account balances, parent reminders and financial
            reporting into one elegant workflow your school can rely on.
          </p>

          <div style={styles.featureStack}>
            {featureList.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                style={styles.featureCard}
              >
                <div style={styles.featureIcon}>{item.icon}</div>
                <div>
                  <h3 style={styles.featureTitle}>{item.title}</h3>
                  <p style={styles.featureText}>{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div style={styles.formPanel}>
          <div style={styles.formHeader}>
            <div style={styles.formLogoCircle}>
              <Layers3 size={22} color="#0f7a43" />
            </div>

            <p style={styles.eyebrow}>CREATE ACCOUNT</p>
            <h2 style={styles.formTitle}>Set up your school workspace</h2>
            <p style={styles.formSubtitle}>
              Create your institution account and start managing fees beautifully.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.grid2}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  style={styles.input}
                  placeholder="e.g. bursar_admin"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.inputBlur)}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Official Email</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  style={styles.input}
                  placeholder="admin@school.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.inputBlur)}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  style={{ ...styles.input, paddingRight: '48px' }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.inputBlur)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6b7280" />
                  ) : (
                    <Eye size={18} color="#6b7280" />
                  )}
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full School Name</label>
              <input
                type="text"
                required
                disabled={loading}
                style={styles.input}
                placeholder="e.g. St. Peter’s Secondary School"
                value={formData.school_name}
                onChange={(e) =>
                  setFormData({ ...formData, school_name: e.target.value })
                }
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Your Role</label>
              <div style={styles.roleRow}>
                {roleOptions.map((opt) => (
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
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <p style={styles.footerText}>
            Already registered?{' '}
            <Link to="/login" style={styles.link}>
              Sign in to your school
            </Link>
          </p>

          <p style={styles.version}>Secure connection • v1.0.0</p>
        </div>
      </motion.div>

      <style>{globalStyles}</style>
    </div>
  );
};

const BORDER = '1px solid rgba(15,122,67,0.16)';
const BORDER_FOCUS = '1px solid rgba(15,122,67,0.48)';
const INPUT_BG = '#fcfdfb';

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background:
      'linear-gradient(135deg, #f6f8f2 0%, #f2f6ec 35%, #eef5ea 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 18px',
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',
    top: '-140px',
    right: '-120px',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(16,124,70,0.16) 0%, rgba(16,124,70,0.02) 55%, transparent 72%)',
    pointerEvents: 'none',
  },

  glowBottom: {
    position: 'absolute',
    bottom: '-160px',
    left: '-120px',
    width: '460px',
    height: '460px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(129,199,132,0.18) 0%, rgba(129,199,132,0.03) 55%, transparent 72%)',
    pointerEvents: 'none',
  },

  shell: {
    width: '100%',
    maxWidth: '1120px',
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    borderRadius: '30px',
    overflow: 'hidden',
    border: '1px solid rgba(15,122,67,0.08)',
    boxShadow: '0 28px 90px rgba(31,41,35,0.12)',
    background: '#ffffff',
    position: 'relative',
    zIndex: 2,
  },

  brandPanel: {
    padding: '56px 48px',
    background:
      'linear-gradient(160deg, #fcfdf9 0%, #f4f8ef 52%, #eef5ea 100%)',
    borderRight: '1px solid rgba(15,122,67,0.08)',
  },

  brandBadge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(15,122,67,0.09)',
    color: '#0f7a43',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    marginBottom: '22px',
  },

  brandLogoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },

  brandLogoCircle: {
    width: '58px',
    height: '58px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #e5f3e8, #d7ebdc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(15,122,67,0.12)',
  },

  brandName: {
    margin: '0 0 4px',
    fontSize: '28px',
    fontWeight: '800',
    color: '#13281d',
    letterSpacing: '-0.03em',
  },

  brandSub: {
    margin: 0,
    color: '#557164',
    fontSize: '14px',
    lineHeight: 1.6,
  },

  brandHeadline: {
    fontSize: '36px',
    lineHeight: 1.14,
    letterSpacing: '-0.04em',
    color: '#14271c',
    margin: '0 0 18px',
    maxWidth: '540px',
  },

  brandHeadlineAccent: {
    color: '#0f7a43',
  },

  brandCopy: {
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#5c6f63',
    maxWidth: '520px',
    marginBottom: '28px',
  },

  featureStack: {
    display: 'grid',
    gap: '14px',
    marginTop: '14px',
  },

  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(15,122,67,0.08)',
    borderRadius: '18px',
  },

  featureIcon: {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    borderRadius: '12px',
    background: 'rgba(15,122,67,0.10)',
    color: '#0f7a43',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureTitle: {
    margin: '0 0 5px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#183122',
  },

  featureText: {
    margin: 0,
    color: '#607466',
    fontSize: '13px',
    lineHeight: 1.65,
  },

  formPanel: {
    padding: '52px 42px 36px',
    background: '#ffffff',
  },

  formHeader: {
    textAlign: 'left',
    marginBottom: '24px',
  },

  formLogoCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #e6f4e9, #dbeee0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(15,122,67,0.12)',
    marginBottom: '18px',
  },

  eyebrow: {
    margin: '0 0 8px',
    color: '#0f7a43',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.14em',
  },

  formTitle: {
    margin: '0 0 8px',
    fontSize: '30px',
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    color: '#17261d',
    fontWeight: '800',
  },

  formSubtitle: {
    margin: 0,
    color: '#617368',
    fontSize: '14px',
    lineHeight: 1.7,
  },

  errorBox: {
    background: 'rgba(220,38,38,0.06)',
    border: '1px solid rgba(220,38,38,0.16)',
    borderRadius: '14px',
    padding: '12px 14px',
    color: '#b42318',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'left',
  },

  form: {
    textAlign: 'left',
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },

  fieldGroup: {
    marginBottom: '16px',
  },

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#436154',
    marginBottom: '8px',
    letterSpacing: '0.02em',
  },

  input: {
    width: '100%',
    padding: '13px 14px',
    background: INPUT_BG,
    border: BORDER,
    borderRadius: '14px',
    outline: 'none',
    color: '#16261c',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
  },

  inputFocus: {
    border: BORDER_FOCUS,
    boxShadow: '0 0 0 4px rgba(15,122,67,0.10)',
    background: '#ffffff',
  },

  inputBlur: {
    border: BORDER,
    boxShadow: 'none',
    background: INPUT_BG,
  },

  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },

  roleRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },

  roleBtn: {
    padding: '12px 10px',
    borderRadius: '14px',
    fontSize: '13px',
    fontWeight: '700',
    background: '#fbfcfa',
    border: BORDER,
    color: '#567166',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },

  roleBtnActive: {
    background: 'linear-gradient(135deg, #edf7ef, #e1f1e5)',
    border: '1px solid rgba(15,122,67,0.42)',
    color: '#0f7a43',
    boxShadow: '0 8px 20px rgba(15,122,67,0.08)',
  },

  submitBtn: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(90deg, #0f7a43, #1b9b57)',
    border: 'none',
    borderRadius: '15px',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '15px',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '6px',
    boxShadow: '0 16px 28px rgba(15,122,67,0.18)',
    fontFamily: 'inherit',
  },

  footerText: {
    fontSize: '14px',
    color: '#6b7a71',
    marginTop: '20px',
    marginBottom: '6px',
    textAlign: 'center',
  },

  link: {
    color: '#0f7a43',
    textDecoration: 'none',
    fontWeight: '700',
  },

  version: {
    fontSize: '11px',
    color: '#96a39b',
    marginTop: '14px',
    textAlign: 'center',
  },

  successCard: {
    width: '100%',
    maxWidth: '520px',
    background: '#ffffff',
    borderRadius: '26px',
    padding: '54px 34px',
    boxShadow: '0 28px 80px rgba(31,41,35,0.12)',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
    border: '1px solid rgba(15,122,67,0.08)',
  },

  successBadge: {
    width: '82px',
    height: '82px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e5f4e7, #d7ecdc)',
    border: '1px solid rgba(15,122,67,0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },

  successTitle: {
    margin: '0 0 10px',
    color: '#17271d',
    fontSize: '28px',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },

  successText: {
    margin: '0 0 24px',
    color: '#66766c',
    fontSize: '14px',
    lineHeight: 1.7,
  },

  progressTrack: {
    width: '100%',
    height: '8px',
    background: '#eef2ec',
    borderRadius: '999px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0f7a43, #35b46a)',
    borderRadius: '999px',
  },
};

const globalStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; }
  ::placeholder { color: #9aa79f; opacity: 1; }

  @media (max-width: 960px) {
    .dummy {}
  }

  @media (max-width: 960px) {
    body {
      overflow-x: hidden;
    }
  }

  @media (max-width: 960px) {
    div[style*="grid-template-columns: 1.05fr 0.95fr"] {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 960px) {
    div[style*="padding: 56px 48px"] {
      padding: 40px 28px !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(15,122,67,0.08) !important;
    }

    div[style*="padding: 52px 42px 36px"] {
      padding: 40px 28px 30px !important;
    }
  }

  @media (max-width: 640px) {
    div[style*="grid-template-columns: 1fr 1fr"] {
      grid-template-columns: 1fr !important;
    }

    div[style*="grid-template-columns: repeat(3, 1fr)"] {
      grid-template-columns: 1fr !important;
    }

    h2[style*="font-size: 36px"] {
      font-size: 28px !important;
    }

    h2[style*="font-size: 30px"] {
      font-size: 24px !important;
    }
  }
`;

export default Register;