import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Overview from './pages/Overview';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Fees from './pages/Fees';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import HeadmasterDashboard from './pages/HeadmasterDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentLogin from './pages/ParentLogin';
import ParentPortal from './pages/ParentPortal';
import Refunds from './pages/Refunds';
import Analytics from './pages/Analytics';
import Phase8Dashboard from './components/Phase8Dashboard';
import AuditLogs from './pages/AuditLogs';
import { DashboardProvider } from './context/DashboardContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/parent-login" element={<ParentLogin />} />
          <Route path="/parent-portal" element={<ParentPortal />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['BURSAR', 'ACCOUNTANT']}><Overview /></ProtectedRoute>} />
          <Route path="/headmaster-dashboard" element={<ProtectedRoute allowedRoles={['HEADMASTER']}><HeadmasterDashboard /></ProtectedRoute>} />
          <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/phase8-dashboard" element={<ProtectedRoute allowedRoles={['BURSAR']}><Phase8Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute allowedRoles={['BURSAR']}><Students /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute allowedRoles={['BURSAR']}><Payments /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute allowedRoles={['BURSAR']}><Fees /></ProtectedRoute>} />
          <Route path="/refunds" element={<ProtectedRoute allowedRoles={['BURSAR']}><Refunds /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['BURSAR', 'HEADMASTER']}><Analytics /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['BURSAR', 'HEADMASTER']}><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['BURSAR']}><Settings /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['BURSAR', 'HEADMASTER']}><AuditLogs /></ProtectedRoute>} />

          {/* Wildcard Redirect to Landing */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
    </QueryClientProvider>
  );
}

const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
    <div className="glass-card p-12 text-center space-y-4">
      <h1 className="text-4xl font-bold gradient-text">{title}</h1>
      <p className="text-text-muted italic">Component implementation in progress...</p>
    </div>
  </div>
);

export default App;
