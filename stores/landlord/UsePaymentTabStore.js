// stores/landlord/usePaymentTabStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_BASE    = 'https://backend.wapangaji.com/api/v1/payments';
const TENANT_BASE = 'https://backend.wapangaji.com/api/v1/tenants';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style:                 'currency',
    currency:              'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const usePaymentTabStore = create((set, get) => ({

  // ── Global loading / error ─────────────────────────────────────────────────
  loading: false,
  error:   null,

  // ── Payment history ────────────────────────────────────────────────────────
  payments: [],

  // ── Tenant list (owned by the store so it stays fresh after payments) ──────
  tenants:        [],
  tenantsLoading: false,
  tenantsError:   null,

  // ── Summary / unit breakdown ───────────────────────────────────────────────
  summary: {
    totalAmount:  0,
    paidCount:    0,
    pendingCount: 0,
    overdueCount: 0,
  },
  unitBreakdown: [],

  // ── Filters ────────────────────────────────────────────────────────────────
  filters: {
    status:    'all',
    search:    '',
    startDate: null,
    endDate:   null,
  },

  // ── Cycle balance ──────────────────────────────────────────────────────────
  cycleBalance:        null,
  cycleBalanceLoading: false,
  cycleBalanceError:   null,

  // ── Record payment form ────────────────────────────────────────────────────
  recordLoading: false,
  recordError:   null,

  // ── Setters ────────────────────────────────────────────────────────────────
  setLoading:   (loading) => set({ loading }),
  setError:     (error)   => set({ error }),
  clearError:   ()        => set({ error: null }),
  updateFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  // ── Fetch tenant list for a property ──────────────────────────────────────
  // This is the single source of truth for "Needs Attention" cards.
  // Called on init and after every payment so the list is always fresh.
  fetchPropertyTenants: async (propertyId) => {
    if (!propertyId) return;
    try {
      set({ tenantsLoading: true, tenantsError: null });
      const response = await axios.get(
        `${TENANT_BASE}/property/${propertyId}/tenants/`,
        { headers: getAuthHeaders() }
      );
      if (response.data?.tenants) {
        set({ tenants: response.data.tenants, tenantsLoading: false });
      } else {
        set({ tenantsLoading: false });
      }
    } catch (err) {
      set({
        tenantsLoading: false,
        tenantsError: err.response?.data?.message || 'Failed to load tenants',
      });
    }
  },

  // ── Fetch payment history ──────────────────────────────────────────────────
  fetchPaymentHistory: async (propertyId) => {
    if (!propertyId) return;
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      params.append('property_id', propertyId);
      const { filters } = get();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate)   params.append('end_date',   filters.endDate);

      const response = await axios.get(
        `${API_BASE}/rent/history/?${params}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        set({ payments: response.data.payments || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({
        error:   err.response?.data?.message || 'Failed to load payments',
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
      if (filters.endDate)   params.append('end_date',   filters.endDate);

      const response = await axios.get(
        `${API_BASE}/rent/summary/?${params}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        const s = response.data.summary;
        set({
          summary: {
            totalAmount:  s.total_amount  || 0,
            paidCount:    s.payment_count || 0,
            pendingCount: s.pending_count || 0,
            overdueCount: s.overdue_count || 0,
          },
        });
      }
    } catch {
      // non-critical — silent fail
    }
  },

  fetchUnitBreakdown: async (propertyId) => {
    if (!propertyId) return;
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate)   params.append('end_date',   filters.endDate);

      const response = await axios.get(
        `${API_BASE}/rent/property/${propertyId}/units/?${params}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        set({ unitBreakdown: response.data.unit_breakdown || [] });
      }
    } catch {
      // non-critical — silent fail
    }
  },

  // ── Cycle balance ──────────────────────────────────────────────────────────
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
    } catch (err) {
      set({
        cycleBalanceLoading: false,
        cycleBalanceError:
          err.response?.data?.message || 'Could not load balance for this unit',
      });
      return null;
    }
  },

  clearCycleBalance: () =>
    set({ cycleBalance: null, cycleBalanceError: null, cycleBalanceLoading: false }),

  // ── Record landlord payment ────────────────────────────────────────────────
  // After success: refresh both payment history AND tenant list so that
  // "Needs Attention" cards update immediately without a full page reload.
  recordLandlordPayment: async ({ unitId, amount, notes, notifyTenant, propertyId }) => {
    try {
      set({ recordLoading: true, recordError: null });
      const response = await axios.post(
        `${API_BASE}/rent/landlord/record/`,
        {
          unit_id:       unitId,
          amount:        parseFloat(amount),
          notes:         notes || '',
          notify_tenant: notifyTenant,
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Refresh payment history AND tenant statuses in parallel so both
        // the table and the "Needs Attention" section update immediately.
        if (propertyId) {
          await Promise.all([
            get().fetchPaymentHistory(propertyId),
            get().fetchPropertyTenants(propertyId),
          ]);
        }
        set({ recordLoading: false });
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.message || 'Failed to record payment');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record payment';
      set({ recordLoading: false, recordError: msg });
      return { success: false, error: msg };
    }
  },

  // ── Confirm / reject pending payment ──────────────────────────────────────
  confirmPayment: async (paymentId, action, rejectionReason = '') => {
    try {
      set({ loading: true, error: null });
      const response = await axios.put(
        `${API_BASE}/rent/confirmation/${paymentId}/`,
        { action, rejection_reason: rejectionReason },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Optimistically update the payment row status in the table
        const newStatus = action === 'accept' ? 'completed' : 'failed';
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId ? { ...p, status: newStatus } : p
          ),
          loading: false,
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err) {
      set({
        error:   err.response?.data?.message || 'Failed to update payment',
        loading: false,
      });
      return false;
    }
  },

  // ── Selectors ──────────────────────────────────────────────────────────────
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

  getPendingPayments: () => get().payments.filter((p) => p.status === 'pending'),

  getRecentPayments: (limit = 5) =>
    get()
      .payments
      .filter((p) => p.status === 'completed')
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

  // ── Init / refresh ─────────────────────────────────────────────────────────
  // Fetches everything needed for the payments tab in parallel.
  initializeTab: async (propertyId) => {
    if (!propertyId) return;
    await Promise.all([
      get().fetchPaymentHistory(propertyId),
      get().fetchPaymentSummary(propertyId),
      get().fetchUnitBreakdown(propertyId),
      get().fetchPropertyTenants(propertyId),
    ]);
  },

  refreshData: async (propertyId) => {
    await get().initializeTab(propertyId);
  },
}));