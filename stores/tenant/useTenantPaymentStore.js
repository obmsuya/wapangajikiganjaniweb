// stores/tenant/useTenantPaymentStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

// ─── Error classifier ─────────────────────────────────────────────────────────
const ERROR_TYPES = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error',
  PAYMENT: 'payment_error',
  SERVER: 'server_error',
  TIMEOUT: 'timeout_error',
  UNIT_SELECTION: 'unit_selection_required',
};

const classifyError = (error) => {
  if (!error) return { type: ERROR_TYPES.SERVER, message: 'Unknown error occurred' };
  const msg = (error.message || error.toString()).toLowerCase();
  if (msg.includes('network') || msg.includes('fetch'))
    return { type: ERROR_TYPES.NETWORK, message: 'Network connection failed. Please check your internet and try again.' };
  if (msg.includes('validation') || msg.includes('required'))
    return { type: ERROR_TYPES.VALIDATION, message: 'Please check your payment details and try again.' };
  if (msg.includes('insufficient funds'))
    return { type: ERROR_TYPES.PAYMENT, message: 'Insufficient funds. Please top up your account and try again.' };
  if (msg.includes('invalid account') || msg.includes('invalid phone'))
    return { type: ERROR_TYPES.PAYMENT, message: 'Invalid account details. Please check and try again.' };
  if (msg.includes('timeout'))
    return { type: ERROR_TYPES.TIMEOUT, message: 'Request timed out. Please try again.' };
  if (msg.includes('multiple units') || msg.includes('unit selection'))
    return { type: ERROR_TYPES.UNIT_SELECTION, message: 'Please select which unit this payment is for.' };
  if (msg.includes('no active occupancy'))
    return { type: ERROR_TYPES.PAYMENT, message: 'No active lease found. Please contact your landlord.' };
  if (msg.includes('payment already exists'))
    return { type: ERROR_TYPES.PAYMENT, message: 'A payment for this period is already being processed.' };
  const raw = error.message || '';
  return {
    type: ERROR_TYPES.SERVER,
    message: raw.length > 120 ? 'An unexpected error occurred. Please try again.' : raw,
  };
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useTenantPaymentStore = create((set, get) => ({
  loading: false,
  error: null,
  paymentMethod: null,   // 'record' | 'pay'
  selectedUnit: null,
  paymentFlow: 'select', // 'select' | 'unit_selection' | 'form' | 'success' | 'error'
  paymentHistory: [],
  currentTransaction: null,
  occupancies: [],
  showPaymentDialog: false,
  requiresUnitSelection: false,
  availableUnits: [],

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null, requiresUnitSelection: false, availableUnits: [] }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setPaymentFlow: (flow) => set({ paymentFlow: flow }),
  setShowPaymentDialog: (show) => set({ showPaymentDialog: show }),

  // ── Fetch occupancies ───────────────────────────────────────────────────────
  // Maps ALL fields the backend returns including cycle_balance, is_early_payment,
  // next_due_date and monthly_equivalent so the dialog has full context.
  fetchOccupancies: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/payments/rent/tenant/occupancy/');

      if (response.success) {
        const formatted = (response.occupancies || []).map((occ) => ({
          unit_id: occ.unit_id,
          unit_name: occ.unit_name,
          property_id: occ.property_id,
          property_name: occ.property_name,
          floor_number: occ.floor_number,
          rent_amount: parseFloat(occ.rent_amount || 0),
          payment_frequency: occ.payment_frequency || '1',
          start_date: occ.start_date,
          status: occ.status,
          recent_payments: occ.recent_payments || [],
          // ── Fields added to support the payment dialog ──
          next_due_date: occ.next_due_date || null,
          is_early_payment: occ.is_early_payment ?? false,
          monthly_equivalent: parseFloat(occ.monthly_equivalent || 0),
          total_due: parseFloat(occ.total_due || occ.rent_amount || 0),
          // cycle_balance block from the backend
          cycle_balance: occ.cycle_balance
            ? {
              period_start: occ.cycle_balance.period_start,
              period_end: occ.cycle_balance.period_end,
              amount_due: parseFloat(occ.cycle_balance.amount_due || 0),
              amount_paid: parseFloat(occ.cycle_balance.amount_paid || 0),
              amount_remaining: parseFloat(occ.cycle_balance.amount_remaining || 0),
              is_settled: occ.cycle_balance.is_settled ?? false,
              is_early: occ.cycle_balance.is_early ?? false,
            }
            : null,
        }));

        set({ occupancies: formatted, loading: false });
        return formatted;
      }
      throw new Error(response.error || 'Failed to load occupancies');
    } catch (error) {
      const classified = classifyError(error);
      set({ error: classified.message, loading: false, occupancies: [] });
      toast.error('Failed to Load Units', { description: classified.message });
      throw error;
    }
  },

  // ── Fetch payment history ───────────────────────────────────────────────────
  fetchPaymentHistory: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (filters.unitId) params.append('unit_id', filters.unitId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      const qs = params.toString();
      const url = qs
        ? `/api/v1/payments/rent/tenant/history/?${qs}`
        : '/api/v1/payments/rent/tenant/history/';

      const response = await api.get(url);
      if (response.success) {
        const formatted = (response.payments || []).map((p) => ({
          id: p.id,
          property_name: p.property_name,
          unit_name: p.unit_name,
          floor_number: p.floor_number,
          amount: parseFloat(p.amount || 0),
          payment_period_start: p.payment_period_start,
          payment_period_end: p.payment_period_end,
          status: p.status,
          notes: p.notes,
          created_at: p.created_at,
          payment_method: p.payment_method,
          confirmation_deadline: p.confirmation_deadline,
          auto_confirmed: p.auto_confirmed,
          rejection_reason: p.rejection_reason,
        }));
        set({ paymentHistory: formatted, loading: false });
      } else {
        throw new Error(response.error || 'Failed to load payment history');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ error: classified.message, loading: false });
      toast.error('Failed to Load History', { description: classified.message });
    }
  },

  // ── Record manual payment (tenant already paid outside the app) ─────────────
  recordManualPayment: async (amount, unitId = null, notes = '') => {
    try {
      set({ loading: true, error: null });
      if (!amount || amount <= 0) throw new Error('Please enter a valid payment amount');
      if (!notes?.trim()) throw new Error('Please describe how you made the payment');

      const payload = { amount: parseFloat(amount), notes: notes.trim() };
      if (unitId) payload.unit_id = parseInt(unitId);

      const response = await api.post('/api/v1/payments/rent/manual/record/', payload);

      if (response.success) {
        set({
          currentTransaction: {
            ...response,
            amount: payload.amount,
            unit_name: response.unit_name,
            payment_id: response.payment_id,
          },
          paymentFlow: 'success',
          loading: false,
        });
        toast.success('Payment Recorded', {
          description: 'Your payment has been sent to your landlord for confirmation.',
        });
        await get().refreshPaymentHistory();
        return response;
      }

      if (response.requires_unit_selection && response.available_units) {
        set({
          error: response.message,
          availableUnits: response.available_units,
          requiresUnitSelection: true,
          loading: false,
        });
        return { requiresUnitSelection: true, availableUnits: response.available_units };
      }
      throw new Error(response.message || 'Payment recording failed');
    } catch (error) {
      const classified = classifyError(error);
      set({ error: classified.message, loading: false, paymentFlow: 'error' });
      toast.error('Payment Recording Failed', { description: classified.message });
      throw error;
    }
  },

  // ── Process system payment (MNO / AzamPay) ─────────────────────────────────
  processSystemPayment: async (unitId, accountNumber, provider, paymentType = 'mno') => {
    try {
      set({ loading: true, error: null, paymentFlow: 'processing' });
      if (!unitId) throw new Error('Unit selection is required');
      if (!accountNumber?.trim()) throw new Error(paymentType === 'mno' ? 'Mobile number is required' : 'Account number is required');
      if (!provider) throw new Error('Payment provider is required');

      if (paymentType === 'mno') {
        const clean = accountNumber.replace(/\s/g, '');
        if (!/^\+?[0-9]{10,15}$/.test(clean))
          throw new Error('Please enter a valid mobile number');
      }

      const response = await api.post('/api/v1/payments/rent/system/process/', {
        unit_id: parseInt(unitId),
        accountNumber: accountNumber.replace(/\s/g, ''),
        provider,
      });

      if (response.success) {
        set({
          currentTransaction: {
            ...response,
            transaction_id: response.transaction_id,
            external_id: response.external_id,
            amount: response.payment_details?.amount,
            unit_name: response.payment_details?.unit_name,
          },
          paymentFlow: 'success',
          loading: false,
        });
        toast.success('Payment Initiated', {
          description: 'Complete the payment prompt on your phone to finalise.',
        });
        return response;
      }

      if (response.requires_unit_selection && response.available_units) {
        set({
          error: response.message,
          availableUnits: response.available_units,
          requiresUnitSelection: true,
          loading: false,
        });
        return { requiresUnitSelection: true, availableUnits: response.available_units };
      }
      throw new Error(response.error || 'Payment processing failed');
    } catch (error) {
      const classified = classifyError(error);
      set({ error: classified.message, loading: false, paymentFlow: 'error' });
      toast.error('Payment Failed', { description: classified.message });
      throw error;
    }
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getOccupancyByUnitId: (unitId) =>
    (get().occupancies || []).find((occ) => occ.unit_id === parseInt(unitId)),

  resetPaymentFlow: () =>
    set({
      paymentMethod: null,
      selectedUnit: null,
      paymentFlow: 'select',
      currentTransaction: null,
      error: null,
      showPaymentDialog: false,
      requiresUnitSelection: false,
      availableUnits: [],
    }),

  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  getPaymentStatusColor: (status) => {
    const map = {
      completed: 'bg-green-100  text-green-800  border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100    text-red-800    border-red-200',
      rejected: 'bg-red-100    text-red-800    border-red-200',
      processing: 'bg-blue-100   text-blue-800   border-blue-200',
    };
    return map[status] || map.pending;
  },

  buildPaymentSummary: (payments = null) => {
    const list = payments || get().paymentHistory;
    if (!Array.isArray(list) || !list.length)
      return {
        totalAmount: 0, totalCount: 0, completedAmount: 0, completedCount: 0,
        pendingAmount: 0, pendingCount: 0, failedCount: 0, averageAmount: 0,
        lastPaymentDate: null, successRate: 0,
      };

    const summary = list.reduce((acc, p) => {
      acc.totalAmount += p.amount;
      acc.totalCount += 1;
      if (p.status === 'completed') { acc.completedAmount += p.amount; acc.completedCount += 1; }
      else if (p.status === 'pending') { acc.pendingAmount += p.amount; acc.pendingCount += 1; }
      else if (p.status === 'failed' || p.status === 'rejected') acc.failedCount += 1;
      return acc;
    }, {
      totalAmount: 0, totalCount: 0, completedAmount: 0, completedCount: 0,
      pendingAmount: 0, pendingCount: 0, failedCount: 0
    });

    const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return {
      ...summary,
      averageAmount: summary.totalCount > 0 ? summary.totalAmount / summary.totalCount : 0,
      lastPaymentDate: sorted[0]?.created_at || null,
      successRate: summary.totalCount > 0 ? (summary.completedCount / summary.totalCount) * 100 : 0,
    };
  },

  refreshPaymentHistory: async () => get().fetchPaymentHistory(),
  refreshOccupancies: async () => get().fetchOccupancies(),

  reset: () =>
    set({
      loading: false, error: null, paymentMethod: null, selectedUnit: null,
      paymentFlow: 'select', paymentHistory: [], currentTransaction: null,
      occupancies: [], showPaymentDialog: false,
      requiresUnitSelection: false, availableUnits: [],
    }),
}));