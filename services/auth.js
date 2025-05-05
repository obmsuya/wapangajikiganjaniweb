// services/auth.js
import axios from 'axios';

const API_URL = 'https://backend.wapangaji.com';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken
        });
        
        const { access } = response.data;
        
        // Save the new token
        localStorage.setItem('access_token', access);
        
        // Update the header and retry the request
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login/', credentials);
      const { user, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/api/v1/auth/register/', userData);
      const { user, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
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
      await api.post('/api/v1/auth/logout/', { refresh: refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  // Reset password
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/api/v1/auth/password-reset/', resetData);
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (changeData) => {
    try {
      const response = await api.put('/api/v1/auth/password/change/', changeData);
      return response.data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/v1/auth/me/');
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default AuthService;
export { api };