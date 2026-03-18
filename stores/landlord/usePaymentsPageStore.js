// stores/landlord/usePaymentPageStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'https://backend.wapangaji.com/api/v1/payments';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatCurrency = (amount) => {
  if (!amount) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const usePaymentPageStore = create((set, get) => ({
  loading: false,
  error: null,

  wallet: {
    balance: 0,
    totalReceived: 0,
    totalWithdrawn: 0,
    recentTransactions: []
  },

  allPayments: [],

  overallSummary: {
    totalAmount: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingAmount: 0,
    overdueAmount: 0
  },

  propertiesBreakdown: [],
  withdrawalHistory: [],
  pendingWithdrawals: [],

  filters: {
    period: 'all',
    status: 'all',
    property: 'all',
    search: ''
  },

  // ── Record payment state (NEW) ─────────────────────────────────────
  recordPayment: {
    loading: false,
    error: null,
    cycleBalance: null,       // loaded when landlord picks a unit
    cycleBalanceLoading: false,
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  fetchWalletData: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axios.get(`${API_BASE}/rent/wallet/`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        set({
          wallet: {
            balance: response.data.wallet.balance || 0,
            totalReceived: response.data.wallet.total_received || 0,
            totalWithdrawn: response.data.wallet.total_withdrawn || 0,
            recentTransactions: response.data.wallet.recent_transactions || []
          },
          loading: false
        });
      }
    } catch (error) {
      set({ error: 'Failed to load wallet data', loading: false });
    }
  },

  fetchAllPayments: async () => {
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.period !== 'all') {
        const now = new Date();
        let startDate;
        switch (filters.period) {
          case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            params.append('end_date', new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
            break;
          case 'last3Months':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        }
        if (startDate) {
          params.append('start_date', startDate.toISOString().split('T')[0]);
        }
      }
      const response = await axios.get(`${API_BASE}/rent/history/?${params}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        set({ allPayments: response.data.payments || [] });
      }
    } catch (error) {
      set({ error: 'Failed to load payments' });
    }
  },

  fetchOverallSummary: async () => {
    try {
      const response = await axios.get(`${API_BASE}/rent/summary/`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        const summary = response.data.summary;
        set({
          overallSummary: {
            totalAmount: summary.total_amount || 0,
            thisMonth: summary.this_month || 0,
            lastMonth: summary.last_month || 0,
            pendingAmount: summary.pending_amount || 0,
            overdueAmount: summary.overdue_amount || 0
          }
        });
      }
    } catch (error) {
      set({ error: 'Failed to load summary' });
    }
  },

  requestWithdrawal: async (amount, method, details = {}) => {
    try {
      set({ loading: true, error: null });
      const payload = {
        amount: parseFloat(amount),
        withdrawal_method: method,
        recipient_phone: details.recipient_phone,
        provider: details.provider
      };
      const response = await axios.post(`${API_BASE}/rent/wallet/withdrawal/`, payload, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        await get().fetchWalletData();
        set({ loading: false });
        return true;
      }
      return false;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to request withdrawal',
        loading: false
      });
      return false;
    }
  },

  // Loads the current billing cycle balance for a unit (NEW)
  // Called when landlord selects a unit in the record-payment dialog
  fetchCycleBalance: async (unitId) => {
    try {
      set((state) => ({
        recordPayment: {
          ...state.recordPayment,
          cycleBalanceLoading: true,
          cycleBalance: null,
          error: null
        }
      }));
      const response = await axios.get(
        `${API_BASE}/rent/cycle-balance/?unit_id=${unitId}`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        set((state) => ({
          recordPayment: {
            ...state.recordPayment,
            cycleBalance: response.data.cycle,
            cycleBalanceLoading: false
          }
        }));
        return response.data;
      }
      throw new Error('Failed to load cycle balance');
    } catch (error) {
      set((state) => ({
        recordPayment: {
          ...state.recordPayment,
          cycleBalanceLoading: false,
          error: error.response?.data?.message || 'Could not load balance for this unit'
        }
      }));
      return null;
    }
  },


  recordLandlordPayment: async ({ unitId, amount, notes, notifyTenant }) => {
    try {
      set((state) => ({
        recordPayment: { ...state.recordPayment, loading: true, error: null }
      }));
      const response = await axios.post(
        `${API_BASE}/rent/landlord/record/`,
        {
          unit_id: unitId,
          amount: parseFloat(amount),
          notes: notes || '',
          notify_tenant: notifyTenant
        },
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        await get().fetchAllPayments();
        set((state) => ({
          recordPayment: { ...state.recordPayment, loading: false }
        }));
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.message || 'Failed to record payment');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to record payment';
      set((state) => ({
        recordPayment: { ...state.recordPayment, loading: false, error: msg }
      }));
      return { success: false, error: msg };
    }
  },

  getFilteredPayments: () => {
    const { allPayments, filters } = get();
    return allPayments.filter(payment => {
      const matchesStatus = filters.status === 'all' || payment.status === filters.status;
      const matchesSearch = !filters.search ||
        payment.tenant_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.property_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.unit_name?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  },

  getRecentActivity: (limit = 10) => {
    const { allPayments, wallet } = get();
    const recentPayments = allPayments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit / 2)
      .map(payment => ({ ...payment, type: 'payment' }));
    const recentTransactions = wallet.recentTransactions
      .slice(0, limit / 2)
      .map(transaction => ({ ...transaction, type: 'transaction' }));
    return [...recentPayments, ...recentTransactions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  getMonthlyTrend: () => {
    const { allPayments } = get();
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate >= month && paymentDate < nextMonth && payment.status === 'completed';
      });
      const total = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      last6Months.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: total,
        count: monthPayments.length
      });
    }
    return last6Months;
  },

  formatCurrency,

  getStatusColor: (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':    return 'bg-red-100 text-red-800 border-red-200';
      default:          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },

  initializePage: async () => {
    await Promise.all([
      get().fetchWalletData(),
      get().fetchAllPayments(),
      get().fetchOverallSummary()
    ]);
  },

  refreshAll: async () => {
    await get().initializePage();
  }
}));