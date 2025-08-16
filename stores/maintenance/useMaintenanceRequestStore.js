import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'https://backend.wapangaji.com/api/v1/notifications/maintenance';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useMaintenanceRequestStore = create((set, get) => ({
  loading: false,
  error: null,
  requests: [],
  summary: {
    total_requests: 0,
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    urgent_count: 0
  },
  filters: {
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  },
  selectedRequest: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  submitMaintenanceRequest: async (requestData) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.post(`${API_BASE}/submit/`, requestData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        set({ loading: false });
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to submit request',
        loading: false 
      });
      return { success: false, error: error.response?.data?.error || 'Failed to submit request' };
    }
  },

  fetchMaintenanceRequests: async (statusFilter = 'all') => {
    try {
      set({ loading: true, error: null });
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = params.toString() ? `${API_BASE}/requests/?${params}` : `${API_BASE}/requests/`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        set({ 
          requests: response.data.requests || [],
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch requests',
        loading: false 
      });
    }
  },

  respondToMaintenanceRequest: async (requestId, responseData) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.post(`${API_BASE}/respond/${requestId}/`, responseData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        await get().fetchMaintenanceRequests();
        set({ loading: false });
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to send response',
        loading: false 
      });
      return { success: false, error: error.response?.data?.error || 'Failed to send response' };
    }
  },

  fetchMaintenanceRequestDetail: async (requestId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get(`${API_BASE}/requests/${requestId}/`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        set({ 
          selectedRequest: response.data.request,
          loading: false 
        });
        return response.data.request;
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch request detail',
        loading: false 
      });
    }
  },

  fetchMaintenanceSummary: async () => {
    try {
      const response = await axios.get(`${API_BASE}/summary/`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        set({ summary: response.data.summary || {} });
      }
    } catch (error) {
      console.error('Failed to fetch maintenance summary:', error);
    }
  },

  getFilteredRequests: () => {
    const { requests, filters } = get();
    return requests.filter(request => {
      const matchesStatus = filters.status === 'all' || request.status === filters.status;
      const matchesCategory = filters.category === 'all' || request.category === filters.category;
      const matchesPriority = filters.priority === 'all' || request.priority === filters.priority;
      const matchesSearch = !filters.search || 
        request.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.message.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
    });
  },

  getPendingRequests: () => {
    const { requests } = get();
    return requests.filter(request => request.status === 'pending');
  },

  getRequestsByStatus: (status) => {
    const { requests } = get();
    return requests.filter(request => request.status === status);
  },

  refreshData: async (statusFilter = 'all') => {
    await Promise.all([
      get().fetchMaintenanceRequests(statusFilter),
      get().fetchMaintenanceSummary()
    ]);
  },

  getMaintenanceCategoryIcon: (category) => {
    const icons = {
      plumbing: 'Droplets',
      electrical: 'Zap',
      appliances: 'Home',
      hvac: 'Wind',
      structural: 'Home',
      security: 'Shield',
      cleaning: 'Sparkles',
      other: 'MoreHorizontal'
    };
    return icons[category] || 'MoreHorizontal';
  },

  getMaintenancePriorityColor: (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  getMaintenanceStatusColor: (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  formatMaintenanceDate: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString();
  }
}));