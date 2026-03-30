import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  BookOpen, 
  Settings, 
  LogOut,
  Wallet,
  BarChart3,
  FileText,
  ShieldAlert,
  ArrowLeftRight,
  LineChart
} from 'lucide-react';
import authService from '../services/auth';

const Sidebar = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = authService.getCurrentUserRole();
    setUserRole(role);
  }, []);

  // Base navigation items available to specified roles
  const baseNavItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview', roles: ['BURSAR', 'HEADMASTER', 'ACCOUNTANT'] },
  ];

  // Bursar-specific items
  const bursarItems = [
    { to: '/students', icon: <Users size={20} />, label: 'Students', roles: ['BURSAR'] },
    { to: '/payments', icon: <Receipt size={20} />, label: 'Payments', roles: ['BURSAR'] },
    { to: '/fees', icon: <BookOpen size={20} />, label: 'Fee Structures', roles: ['BURSAR'] },
    { to: '/refunds', icon: <ArrowLeftRight size={20} />, label: 'Refunds', roles: ['BURSAR'] },
    { to: '/reports', icon: <FileText size={20} />, label: 'Reports', roles: ['BURSAR'] },
    { to: '/settings', icon: <Settings size={20} />, label: 'Setup', roles: ['BURSAR'] },
  ];

  // Headmaster-specific items
  const headmasterItems = [
    { to: '/headmaster-dashboard', icon: <BarChart3 size={20} />, label: 'System Dashboard', roles: ['HEADMASTER'] },
  ];

  // Teacher-specific items
  const teacherItems = [
    { to: '/teacher-dashboard', icon: <LayoutDashboard size={20} />, label: 'My Classes', roles: ['TEACHER'] },
  ];

  // Admin items (Bursar & Headmaster)
  const adminItems = [
    { to: '/analytics', icon: <LineChart size={20} />, label: 'Analytics', roles: ['BURSAR', 'HEADMASTER'] },
    { to: '/audit-logs', icon: <ShieldAlert size={20} />, label: 'Audit Logs', roles: ['BURSAR', 'HEADMASTER'] },
  ];

  // Filter nav items based on user role
  const allItems = [...baseNavItems, ...bursarItems, ...headmasterItems, ...teacherItems, ...adminItems];
  const navItems = userRole 
    ? allItems.filter(item => item.roles.includes(userRole))
    : baseNavItems;

  // Get role badge styling
  const getRoleBadgeStyle = () => {
    const roleStyles = {
      'BURSAR': 'bg-blue-100 text-blue-700 border-blue-200',
      'HEADMASTER': 'bg-purple-100 text-purple-700 border-purple-200',
      'ACCOUNTANT': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'TEACHER': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'PARENT': 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return roleStyles[userRole] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col h-screen sticky top-0 z-10 font-outfit">
      <div className="p-8 flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-2xl">
          <Wallet className="text-blue-600 w-6 h-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-2xl font-black tracking-tighter text-blue-600 leading-tight">BursarPro</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <div className={`transition-transform duration-300 group-hover:scale-110`}>
              {item.icon}
            </div>
            <span className="font-bold tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Authenticated As</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold ring-2 ring-white text-blue-700">
                {(authService.getCurrentUser() || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold truncate max-w-[120px] text-gray-800">{authService.getCurrentUser() || 'Administrator'}</p>
              </div>
            </div>
            {userRole && (
              <div className={`text-xs px-3 py-1 rounded-full font-bold border ${getRoleBadgeStyle()} text-center`}>
                {userRole.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => authService.logout()}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all font-bold group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
