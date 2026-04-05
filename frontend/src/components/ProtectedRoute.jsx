import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('access_token');
  const userRole = authService.getCurrentUserRole();

  if (!token || !authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If authenticated but unauthorized mapped route based on their actual role
    const roleRoutes = {
      'BURSAR': '/dashboard',
      'HEADMASTER': '/headmaster-dashboard',
      'TEACHER': '/teacher-dashboard',
      'PARENT': '/parent-portal',
    };
    const redirectPath = roleRoutes[userRole] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
