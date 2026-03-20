// stores/maintenance/useMaintenanceRequestStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'https://backend.wapangaji.com/api/v1/notifications/maintenance';

// Use the same auth header pattern as the rest of the app
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useMaintenanceRequestStore = create((set, get) => ({
  loading:  false,
  error:    null,
  requests: [],
  selectedRequest: null,

  // ── Filters — used by getFilteredRequests if needed ──────────────────────────
  filters: {
    status:   'all',
    category: 'all',
    priority: 'all',
    search:   '',
  },

  setLoading:     (loading) => set({ loading }),
  setError:       (error)   => set({ error }),
  clearError:     ()        => set({ error: null }),
  updateFilters:  (f)       => set(s => ({ filters: { ...s.filters, ...f } })),

  // ── Submit maintenance request ─────────────────────────────────────────────
  // Sends: { unit_id, title, description, category, priority }
  // Returns: { success, data } or { success: false, error }
  submitMaintenanceRequest: async (payload) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/submit/`, payload, {
        headers: getAuthHeaders(),
      });
      set({ loading: false });
      if (res.data.success) return { success: true, data: res.data };
      return { success: false, error: res.data.error ?? 'Submission failed' };
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Failed to submit request';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // ── Fetch all requests for this tenant ────────────────────────────────────
  // The backend returns ALL requests for the tenant — we filter by unit client-side.
  // statusFilter: 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'
  fetchMaintenanceRequests: async (statusFilter = 'all') => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const qs  = params.toString();
      const url = qs ? `${API_BASE}/requests/?${qs}` : `${API_BASE}/requests/`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      if (res.data.success) {
        set({ requests: res.data.requests ?? [], loading: false });
      } else {
        set({ error: res.data.error ?? 'Failed to load requests', loading: false });
      }
    } catch (err) {
      set({
        error:   err.response?.data?.error ?? 'Failed to fetch requests',
        loading: false,
      });
    }
  },

  // ── Fetch single request with full responses thread ───────────────────────
  // Called by DetailDialog when it opens to get the full landlord reply thread.
  fetchMaintenanceRequestDetail: async (requestId) => {
    try {
      const res = await axios.get(`${API_BASE}/requests/${requestId}/`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        const detail = res.data.request;
        set({ selectedRequest: detail });
        return detail;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch request detail:', err);
      return null;
    }
  },

  // ── Landlord respond ──────────────────────────────────────────────────────
  respondToMaintenanceRequest: async (requestId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_BASE}/respond/${requestId}/`, payload, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        await get().fetchMaintenanceRequests();
        set({ loading: false });
        return { success: true, data: res.data };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Failed to send response';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // ── Summary (optional — used by landlord dashboard) ───────────────────────
  fetchMaintenanceSummary: async () => {
    try {
      const res = await axios.get(`${API_BASE}/summary/`, { headers: getAuthHeaders() });
      if (res.data.success) set({ summary: res.data.summary ?? {} });
    } catch (err) {
      console.error('Maintenance summary fetch failed:', err);
    }
  },

  // ── Refresh — re-fetches requests (and optionally summary) ────────────────
  refreshData: async (statusFilter = 'all') => {
    await get().fetchMaintenanceRequests(statusFilter);
  },

  // ── Selectors ──────────────────────────────────────────────────────────────

  // Filter store requests by the store's own filter state (used by landlord view)
  getFilteredRequests: () => {
    const { requests, filters } = get();
    return requests.filter(r => {
      if (filters.status   !== 'all' && r.status   !== filters.status)   return false;
      if (filters.category !== 'all' && r.category !== filters.category) return false;
      if (filters.priority !== 'all' && r.priority !== filters.priority) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !r.title?.toLowerCase().includes(q) &&
          !r.message?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  },

  getPendingRequests:    () => get().requests.filter(r => r.status === 'pending'),
  getRequestsByStatus:   (s) => get().requests.filter(r => r.status === s),

  // ── Colour helpers (used by landlord components) ───────────────────────────
  getMaintenancePriorityColor: (priority) => ({
    low:    'bg-primary/5  text-primary  border-primary/20',
    medium: 'bg-secondary  text-secondary-foreground border-border',
    high:   'bg-destructive/10 text-destructive border-destructive/20',
    urgent: 'bg-destructive/20 text-destructive border-destructive/30',
  }[priority] ?? 'bg-muted text-muted-foreground border-border'),

  getMaintenanceStatusColor: (status) => ({
    pending:     'bg-muted       text-muted-foreground border-border',
    in_progress: 'bg-primary/10  text-primary           border-primary/20',
    completed:   'bg-primary/10  text-primary           border-primary/20',
    rejected:    'bg-destructive/10 text-destructive    border-destructive/20',
  }[status] ?? 'bg-muted text-muted-foreground border-border'),

  formatMaintenanceDate: (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const diffH = Math.floor((Date.now() - date) / 3600000);
    if (diffH < 1)  return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffH < 48) return 'Yesterday';
    return date.toLocaleDateString('en-TZ', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  },
}));