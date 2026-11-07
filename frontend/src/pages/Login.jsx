import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, GraduationCap, Layers3, Loader2, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import authService from '../services/auth';
import './Login.css';

const features = [
  { icon: WalletCards, title: 'Every payment, accounted for', detail: 'A clearer picture of collections, balances and school finances.' },
  { icon: GraduationCap, title: 'One connected school', detail: 'Thoughtful tools for bursars, headmasters, teachers and parents.' },
  { icon: ShieldCheck, title: 'Confidence in every decision', detail: 'Relevant reports and transparent records at your fingertips.' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  async function handleLogin(event) {
    event.preventDefault();
    if (!username.trim()) { toast.error('Username is required'); return; }
    if (!password.trim()) { toast.error('Password is required'); return; }
    setLoading(true);
    try {
      await authService.login(username, password);
      toast.success('Successfully logged in!');
      const role = localStorage.getItem('userRole');
      if (role === 'HEADMASTER') navigate('/headmaster-dashboard');
      else if (role === 'TEACHER') navigate('/teacher-dashboard');
      else navigate('/dashboard');
    } catch (error) {
      let message;
      if (!error.response) message = 'Cannot connect to the server. Check that the backend is running.';
      else if (error.response.status === 401) message = 'Invalid username or password.';
      else message = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail : 'Login failed. Please verify your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bp-login-page">
      <div className="bp-login-glow bp-login-glow-one" aria-hidden="true" />
      <div className="bp-login-glow bp-login-glow-two" aria-hidden="true" />
      <motion.div className="bp-login-shell"
        initial={reducedMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}>
        <aside className="bp-login-story">
          <Link to="/" className="bp-login-logo" aria-label="BursarPro homepage">
            <span className="bp-login-logo-icon"><Layers3 size={23} strokeWidth={2.2} /></span>
            <span>Bursar<span className="bp-login-logo-accent">Pro</span></span>
          </Link>
          <div className="bp-login-story-content">
            <div className="bp-login-chip"><span className="bp-login-chip-dot" /> THE SMARTER WAY TO MANAGE SCHOOL FINANCES</div>
            <h1>Welcome back to <em>better school finance.</em></h1>
            <p className="bp-login-story-lead">Less paperwork. More clarity. Everything your school needs to keep fee management moving forward.</p>
            <div className="bp-login-feature-list">
              {features.map(({ icon: Icon, title, detail }) => (
                <div className="bp-login-feature" key={title}>
                  <span className="bp-login-feature-icon"><Icon size={20} strokeWidth={1.9} /></span>
                  <div><strong>{title}</strong><p>{detail}</p></div>
                  <Check size={16} className="bp-login-feature-check" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          <div className="bp-login-story-footer"><span className="bp-login-status-dot" /> Built for the schools shaping tomorrow.</div>
        </aside>

        <section className="bp-login-form-panel" aria-labelledby="bp-login-title">
          <div className="bp-login-mobile-brand"><Layers3 size={22} /> BursarPro</div>
          <div className="bp-login-form-inner">
            <div className="bp-login-form-symbol"><LockKeyhole size={23} strokeWidth={1.9} /></div>
            <p className="bp-login-eyebrow">YOUR SCHOOL WORKSPACE</p>
            <h2 id="bp-login-title">Good to have you back.</h2>
            <p className="bp-login-form-subtitle">Sign in to continue managing your school with confidence.</p>

            <form onSubmit={handleLogin} className="bp-login-form">
              <div className="bp-login-field">
                <label htmlFor="bp-login-username">Staff username</label>
                <input id="bp-login-username" name="username" type="text" autoComplete="username"
                  spellCheck="false" placeholder="Enter your username" required disabled={loading}
                  value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="bp-login-field">
                <div className="bp-login-label-row"><label htmlFor="bp-login-password">Password</label></div>
                <div className="bp-login-password-wrap">
                  <input id="bp-login-password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Enter your password" required disabled={loading}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button className="bp-login-eye" type="button" disabled={loading}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
              <motion.button className="bp-login-submit" type="submit" disabled={loading}
                whileHover={reducedMotion || loading ? undefined : { y: -2 }}
                whileTap={reducedMotion || loading ? undefined : { scale: 0.985 }}>
                {loading ? <><Loader2 size={19} className="bp-login-spinner" /> Signing you in…</>
                  : <>Sign in to your workspace <ArrowRight size={19} /></>}
              </motion.button>
            </form>

            <div className="bp-login-separator"><span /> NEW TO BURSARPRO? <span /></div>
            <Link to="/register" className="bp-login-register">Create a school account <ArrowRight size={17} /></Link>
            <Link to="/parent-login" className="bp-login-parent"><GraduationCap size={19} /> Access the parent portal</Link>
            <p className="bp-login-security-note"><ShieldCheck size={16} /> Sign in only on your school's trusted BursarPro website.</p>
          </div>
          <div className="bp-login-form-bottom">© {new Date().getFullYear()} BursarPro · School finance, simplified.</div>
        </section>
      </motion.div>
    </main>
  );
}
