// lib/api.ts
import axios from 'axios';
import { refreshToken } from '@/services/auth';

// Create an axios instance with custom config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage only on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      // If token exists, add it to the headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      // Only attempt token refresh for authenticated routes, not login/register
      if (typeof window !== 'undefined' && 
          !error.config.url.includes('/login') && 
          !error.config.url.includes('/register')) {
        try {
          // Try to refresh the token
          const newTokens = await refreshToken();
          
          // If successful, update the Authorization header and retry the request
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear storage and redirect
          if (typeof window !== 'undefined') {
            localStorage.clear();
            // Only redirect to login if we're not already on the login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          console.error('Token refresh failed:', refreshError); 
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;