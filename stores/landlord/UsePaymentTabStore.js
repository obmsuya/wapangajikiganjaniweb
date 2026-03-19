// stores/landlord/usePaymentTabStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'https://backend.wapangaji.com/api/v1/payments';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const usePaymentTabStore = create((set, get) => ({
  loading: false,
  error: null,
  payments: [],
  summary: {
    totalAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  },
  unitBreakdown: [],
  filters: {
    status: 'all',
    search: '',
    startDate: null,
    endDate: null,
  },

  // ── Cycle balance for a unit (NEW) ────────────────────────────────
  cycleBalance: null,
  cycleBalanceLoading: false,
  cycleBalanceError: null,

  // ── Record payment form state (NEW) ───────────────────────────────
  recordLoading: false,
  recordError: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  fetchPaymentHistory: async (propertyId) => {
    if (!propertyId) return;
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      params.append('property_id', propertyId);
      const { filters } = get();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await axios.get(`${API_BASE}/rent/history/?${params}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        set({ payments: response.data.payments || [], loading: false });
      }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to load payments',
        loading: false,
      });
    }
  },

  fetchPaymentSummary: async (propertyId) => {
    if (!propertyId) return;
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      params.append('property_id', propertyId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await axios.get(`${API_BASE}/rent/summary/?${params}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        const s = response.data.summary;
        set({
          summary: {
            totalAmount: s.total_amount || 0,
            paidCount: s.payment_count || 0,
            pendingCount: s.pending_count || 0,
            overdueCount: s.overdue_count || 0,
          },
        });
      }
    } catch (error) {
      set({ error: 'Failed to load summary' });
    }
  },

  fetchUnitBreakdown: async (propertyId) => {
    if (!propertyId) return;
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await axios.get(
        `${API_BASE}/rent/property/${propertyId}/units/?${params}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        set({ unitBreakdown: response.data.unit_breakdown || [] });
      }
    } catch (error) {
      set({ error: 'Failed to load unit data' });
    }
  },

  // Fetch current billing cycle balance for a unit (NEW)
  // Called when landlord selects a unit in the record-payment dialog
  fetchCycleBalance: async (unitId) => {
    if (!unitId) return null;
    try {
      set({ cycleBalanceLoading: true, cycleBalance: null, cycleBalanceError: null });
      const response = await axios.get(
        `${API_BASE}/rent/cycle-balance/?unit_id=${unitId}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        set({ cycleBalance: response.data.cycle, cycleBalanceLoading: false });
        return response.data;
      }
      throw new Error('Failed to load balance');
    } catch (error) {
      set({
        cycleBalanceLoading: false,
        cycleBalanceError:
          error.response?.data?.message || 'Could not load balance for this unit',
      });
      return null;
    }
  },

  clearCycleBalance: () =>
    set({ cycleBalance: null, cycleBalanceError: null, cycleBalanceLoading: false }),

  // Landlord records a cash/manual payment for a tenant (NEW)
  // notifyTenant: bool — whether tenant gets an SMS
  recordLandlordPayment: async ({ unitId, amount, notes, notifyTenant, propertyId }) => {
    try {
      set({ recordLoading: true, recordError: null });
      const response = await axios.post(
        `${API_BASE}/rent/landlord/record/`,
        {
          unit_id: unitId,
          amount: parseFloat(amount),
          notes: notes || '',
          notify_tenant: notifyTenant,
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Refresh payment list for this property
        if (propertyId) await get().fetchPaymentHistory(propertyId);
        set({ recordLoading: false });
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.message || 'Failed to record payment');
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || 'Failed to record payment';
      set({ recordLoading: false, recordError: msg });
      return { success: false, error: msg };
    }
  },

  confirmPayment: async (paymentId, action, rejectionReason = '') => {
    try {
      set({ loading: true, error: null });
      const response = await axios.put(
        `${API_BASE}/rent/confirmation/${paymentId}/`,
        { action, rejection_reason: rejectionReason },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const { payments } = get();
        set({
          payments: payments.map((p) =>
            p.id === paymentId
              ? { ...p, status: action === 'accept' ? 'completed' : 'failed' }
              : p
          ),
          loading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update payment',
        loading: false,
      });
      return false;
    }
  },

  getFilteredPayments: () => {
    const { payments, filters } = get();
    return payments.filter((payment) => {
      const matchesStatus =
        filters.status === 'all' || payment.status === filters.status;
      const matchesSearch =
        !filters.search ||
        payment.tenant_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.unit_name?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  },

  getPendingPayments: () =>
    get().payments.filter((p) => p.status === 'pending'),

  getRecentPayments: (limit = 5) =>
    get()
      .payments.filter((p) => p.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit),

  formatCurrency,

  getStatusColor: (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':    return 'bg-red-100 text-red-800 border-red-200';
      default:          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },

  initializeTab: async (propertyId) => {
    if (!propertyId) return;
    await Promise.all([
      get().fetchPaymentHistory(propertyId),
      get().fetchPaymentSummary(propertyId),
      get().fetchUnitBreakdown(propertyId),
    ]);
  },

  refreshData: async (propertyId) => {
    await get().initializeTab(propertyId);
  },
}));