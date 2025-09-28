// stores/admin/adminStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { customToast } from '@/components/ui/custom-toast';

const ERROR_TYPES = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error',
  SERVER: 'server_error',
  TIMEOUT: 'timeout_error'
};

const classifyError = (error) => {
  if (!error) return { type: ERROR_TYPES.SERVER, message: 'Unknown error occurred' };
  
  const errorMessage = error.message || error.toString().toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, message: 'Network connection failed' };
  }
  if (errorMessage.includes('validation') || errorMessage.includes('required')) {
    return { type: ERROR_TYPES.VALIDATION, message: 'Please check your input' };
  }
  if (errorMessage.includes('timeout')) {
    return { type: ERROR_TYPES.TIMEOUT, message: 'Request timed out' };
  }
  
  return { type: ERROR_TYPES.SERVER, message: errorMessage };
};

export const useAdminStore = create((set, get) => ({
  loading: false,
  error: null,
  dashboard: null,
  users: [],
  currentUser: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchDashboard: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/auth/admin/dashboard/');
      
      if (response && !response.error) {
        set({
          dashboard: response,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load dashboard');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Dashboard Error", {
        description: classified.message
      });
    }
  },

  fetchUsers: async (sortBy = '-date_joined') => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get(`/api/v1/auth/admin/users/?sort_by=${sortBy}`);
      
      if (response && !response.error) {
        set({
          users: response,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load users');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Users Error", {
        description: classified.message
      });
    }
  },

  fetchUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get(`/api/v1/auth/admin/users/${userId}/`);
      
      if (response && !response.error) {
        set({
          currentUser: response,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load user details');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("User Error", {
        description: classified.message
      });
    }
  },

  deleteUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.delete(`/api/v1/auth/admin/users/${userId}/`);
      
      if (response && !response.error) {
        customToast.success("User Deleted", {
          description: "The user has been successfully deleted."
        });
        
        set({ loading: false });
        // Refetch users after delete
        get().fetchUsers();
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to delete user');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Delete Failed", {
        description: classified.message
      });
      
      return { success: false, error: classified.message };
    }
  },

  resetPassword: async (userId, newPassword) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post(`/api/v1/auth/admin/users/${userId}/reset-password/`, {
        new_password: newPassword
      });
      
      if (response && !response.error) {
        customToast.success("Password Reset", {
          description: "The user's password has been successfully reset."
        });
        
        set({ loading: false });
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to reset password');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Reset Failed", {
        description: classified.message
      });
      
      return { success: false, error: classified.message };
    }
  },

  reset: () => {
    set({
      loading: false,
      error: null,
      dashboard: null,
      users: [],
      currentUser: null
    });
  }
}));