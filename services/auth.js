// services/auth.js
import api from '@/lib/api/api-client';

const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login/', credentials);
      const { user, tokens } = response;
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register a new user
  register: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/register/', credentials);
      const { user, tokens } = response;
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Log out user
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/v1/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  },

  // Reset password
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/api/v1/auth/password-reset/', resetData);
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (changeData) => {
    try {
      const response = await api.put('/api/v1/auth/password/change/', changeData);
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/v1/auth/me/');
      return response;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },
};

export default AuthService;