import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/token/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', username);
      // Fetch and store user role
      try {
        const userRoleResponse = await api.get('/user-roles/');
        if (userRoleResponse.data && Array.isArray(userRoleResponse.data) && userRoleResponse.data.length > 0) {
          localStorage.setItem('userRole', userRoleResponse.data[0].role);
          localStorage.setItem('userId', userRoleResponse.data[0].id);
        }
      } catch (error) {
        console.warn('Could not fetch user role:', error);
      }
    }
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    return localStorage.getItem('username');
  },

  getCurrentUserRole: () => {
    return localStorage.getItem('userRole');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};

export default authService;
