import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Receipt,
  BookOpen,
  Settings,
  LogOut,
  Layers,
  BarChart3,
  FileText,
  ShieldAlert,
  ArrowLeftRight,
  CheckCircle,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import authService from '../services/auth';
import useMobile from '../hooks/useMobile';

const Sidebar = () => {
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    const role = authService.getCurrentUserRole();
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const baseNavItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview', roles: ['BURSAR', 'HEADMASTER'] },
  ];

  const bursarItems = [
    { to: '/students',       icon: <Users size={18} />,         label: 'Students',       roles: ['BURSAR'] },
    { to: '/payments',       icon: <Receipt size={18} />,       label: 'Payments',       roles: ['BURSAR'] },
    { to: '/fees',           icon: <BookOpen size={18} />,      label: 'Fee Structures', roles: ['BURSAR'] },
    { to: '/refunds',        icon: <ArrowLeftRight size={18} />,label: 'Refunds',        roles: ['BURSAR'] },
    { to: '/reconciliation', icon: <CheckCircle size={18} />,   label: 'Reconciliation', roles: ['BURSAR'] },
    { to: '/sms-reminders',  icon: <MessageSquare size={18} />, label: 'SMS Reminders',  roles: ['BURSAR'] },
    { to: '/reports',        icon: <FileText size={18} />,      label: 'Reports',        roles: ['BURSAR'] },
    { to: '/settings',       icon: <Settings size={18} />,      label: 'Setup',          roles: ['BURSAR'] },
  ];

  const headmasterItems = [
    { to: '/headmaster-dashboard', icon: <BarChart3 size={18} />,      label: 'System Dashboard', roles: ['HEADMASTER'] },
    { to: '/refunds',              icon: <ArrowLeftRight size={18} />, label: 'Refunds',           roles: ['HEADMASTER'] },
    { to: '/reports',              icon: <FileText size={18} />,       label: 'Reports',           roles: ['HEADMASTER'] },
  ];

  const teacherItems = [
    { to: '/teacher-dashboard', icon: <LayoutDashboard size={18} />, label: 'My Classes', roles: ['TEACHER'] },
  ];

  const adminItems = [
    { to: '/audit-logs', icon: <ShieldAlert size={18} />, label: 'Audit Logs', roles: ['HEADMASTER'] },
  ];

  const allItems = [...baseNavItems, ...bursarItems, ...headmasterItems, ...teacherItems, ...adminItems];
  const navItems = userRole ? allItems.filter(item => item.roles.includes(userRole)) : baseNavItems;

  const roleBadgeColors = {
    BURSAR:     'rgba(14,165,233,0.15)',
    HEADMASTER: 'rgba(139,92,246,0.15)',
    TEACHER:    'rgba(234,179,8,0.15)',
    PARENT:     'rgba(236,72,153,0.15)',
  };
  const roleBadgeBorder = {
    BURSAR:     'rgba(14,165,233,0.4)',
    HEADMASTER: 'rgba(139,92,246,0.4)',
    TEACHER:    'rgba(234,179,8,0.4)',
    PARENT:     'rgba(236,72,153,0.4)',
  };
  const roleBadgeText = {
    BURSAR:     '#38bdf8',
    HEADMASTER: '#a78bfa',
    TEACHER:    '#fde047',
    PARENT:     '#f9a8d4',
  };

  const sidebarContent = (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}>
          <Layers size={22} color="#38bdf8" strokeWidth={2} />
        </div>
        <div>
          <span style={styles.logoName}>BursarPro</span>
          <span style={styles.logoSub}>Admin Portal</span>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setSidebarOpen(false)}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <span style={{ opacity: 0.85 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {(authService.getCurrentUser() || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={styles.userName}>{authService.getCurrentUser() || 'Administrator'}</p>
            {userRole && (
              <span style={{
                ...styles.roleBadge,
                background: roleBadgeColors[userRole] || 'rgba(56,189,248,0.1)',
                border: `1px solid ${roleBadgeBorder[userRole] || 'rgba(56,189,248,0.3)'}`,
                color: roleBadgeText[userRole] || '#38bdf8',
              }}>
                {userRole}
              </span>
            )}
          </div>
        </div>

        <button onClick={() => authService.logout()} style={styles.signOutBtn}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.hamburger}>
          {sidebarOpen ? <X size={22} color="#38bdf8" /> : <Menu size={22} color="#38bdf8" />}
        </button>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={styles.overlay}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: isMobile && !sidebarOpen ? -300 : 0 }}
        transition={{ type: 'tween', duration: 0.28 }}
        style={isMobile ? styles.sidebarMobile : styles.sidebarDesktop}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};

const styles = {
  sidebarDesktop: {
    width: '256px',
    minWidth: '256px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  sidebarMobile: {
    width: '256px',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 50,
  },
  sidebar: {
    height: '100%',
    background: 'rgba(8,18,36,0.92)',
    borderRight: '1px solid rgba(56,189,248,0.12)',
    backdropFilter: 'blur(24px)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', 'Outfit', sans-serif",
    boxShadow: '4px 0 30px rgba(0,0,0,0.4)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '24px 20px 18px',
  },
  logoIcon: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #0c2d4a, #0e3a5c)',
    border: '1px solid rgba(56,189,248,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 16px rgba(56,189,248,0.2)',
    flexShrink: 0,
  },
  logoName: {
    display: 'block', fontSize: '17px', fontWeight: '800',
    color: '#f0f9ff', letterSpacing: '0.3px', lineHeight: 1.2,
  },
  logoSub: {
    display: 'block', fontSize: '9px', fontWeight: '700',
    color: '#38bdf8', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8,
  },
  divider: {
    height: '1px', background: 'rgba(56,189,248,0.1)', margin: '0 16px 12px',
  },
  nav: {
    flex: 1, padding: '4px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px',
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', borderRadius: '10px',
    color: '#94a3b8', fontWeight: '600', fontSize: '13.5px',
    textDecoration: 'none', transition: 'all 0.18s',
    border: '1px solid transparent',
  },
  navLinkActive: {
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.3)',
    color: '#38bdf8',
    boxShadow: '0 0 12px rgba(56,189,248,0.1)',
  },
  footer: {
    padding: '12px 14px 16px',
    borderTop: '1px solid rgba(56,189,248,0.1)',
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(56,189,248,0.05)',
    border: '1px solid rgba(56,189,248,0.1)',
    borderRadius: '12px', padding: '10px 12px', marginBottom: '10px',
  },
  userAvatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0c2d4a, #0ea5e9)',
    border: '1px solid rgba(56,189,248,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '800', color: '#f0f9ff', flexShrink: 0,
  },
  userName: {
    fontSize: '13px', fontWeight: '700', color: '#e2e8f0',
    margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: '130px',
  },
  roleBadge: {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px',
  },
  signOutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    color: '#fca5a5', fontWeight: '600', fontSize: '13px',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
  },
  hamburger: {
    position: 'fixed', top: '14px', left: '14px', zIndex: 60,
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(8,18,36,0.9)', border: '1px solid rgba(56,189,248,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backdropFilter: 'blur(12px)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 45,
  },
};

export default Sidebar;
