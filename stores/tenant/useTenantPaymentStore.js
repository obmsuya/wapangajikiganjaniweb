import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

export const useTenantPaymentStore = create((set, get) => ({
  loading: false,
  error: null,
  paymentMethod: null,
  selectedUnit: null,
  paymentFlow: 'select',
  paymentHistory: [],
  currentTransaction: null,
  occupancies: [],
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setPaymentFlow: (flow) => set({ paymentFlow: flow }),

  fetchOccupancies: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/payments/rent/tenant/occupancy/');
      
      if (response.success) {
        set({ 
          occupancies: response.occupancies || [],
          loading: false 
        });
        return response.occupancies;
      } else {
        throw new Error(response.error || 'Failed to load occupancies');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load occupancies';
      set({ error: errorMessage, loading: false, occupancies: [] });
      toast.error("Error", { description: errorMessage });
      throw error;
    }
  },

  fetchPaymentHistory: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const params = new URLSearchParams();
      if (filters.unitId) params.append('unit_id', filters.unitId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/rent/tenant/history/?${queryString}`
        : '/api/v1/payments/rent/tenant/history/';
      
      const response = await api.get(url);
      
      if (response.success) {
        set({ 
          paymentHistory: response.payments || [],
          loading: false 
        });
      } else {
        throw new Error(response.error || 'Failed to load payment history');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load payment history';
      set({ 
        error: errorMessage,
        loading: false,
        paymentHistory: [] 
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  },

  recordManualPayment: async (amount, unitId = null, notes = '') => {
    try {
      set({ loading: true, error: null });
      
      const paymentData = { amount };
      if (unitId) paymentData.unit_id = unitId;
      if (notes) paymentData.notes = notes;
      
      const response = await api.post('/api/v1/payments/rent/manual/record/', paymentData);
      
      if (response.success) {
        set({ currentTransaction: response, paymentFlow: 'success', loading: false });
        toast.success("Payment Recorded", { description: response.message });
        await get().refreshPaymentHistory();
        return response;
      } else {
        if (response.requires_unit_selection) {
          set({ 
            error: response.message,
            availableUnits: response.available_units,
            requiresUnitSelection: true,
            loading: false 
          });
          return { requiresUnitSelection: true, availableUnits: response.available_units };
        }
        throw new Error(response.message || 'Payment recording failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to record payment';
      set({ error: errorMessage, loading: false, paymentFlow: 'error' });
      toast.error("Payment Failed", { description: errorMessage });
      throw error;
    }
  },

  getOccupancyByUnitId: (unitId) => {
    const { occupancies } = get();
    return occupancies.find(occ => occ.unit_id === unitId);
  },

  processSystemPayment: async (unitId, accountNumber, provider) => {
    try {
      set({ loading: true, error: null, paymentFlow: 'processing' });
      
      const response = await api.post('/api/v1/payments/rent/system/process/', {
        unit_id: unitId,
        accountNumber: accountNumber,
        provider: provider
      });
      
      if (response.success) {
        set({ 
          currentTransaction: response,
          paymentFlow: 'success',
          loading: false 
        });
        
        toast.success("Payment Initiated", {
          description: response.message || "Rent payment initiated successfully. Complete payment on your mobile device.",
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Payment processing failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to process payment';
      set({ 
        error: errorMessage,
        loading: false,
        paymentFlow: 'error',
        paymentHistory: [] 
      });
      
      toast.error("Payment Failed", {
        description: errorMessage,
      });
      
      throw error;
    }
  },

  initiateMNOPayment: async (paymentData) => {
    try {
      set({ loading: true, error: null, paymentFlow: 'processing' });
      
      const response = await api.post('/api/v1/payments/azampay/mno/checkout', paymentData);
      
      if (response.success) {
        set({ 
          currentTransaction: response,
          loading: false 
        });
        
        toast.success("Payment Initiated", {
          description: "Payment request sent to your mobile device. Please complete the transaction.",
        });
        
        return response;
      } else {
        throw new Error(response.error || 'MNO payment failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to initiate MNO payment';
      set({ 
        error: errorMessage,
        loading: false,
        paymentFlow: 'error',
        paymentHistory: [] 
      });
      
      toast.error("Payment Failed", {
        description: errorMessage,
      });
      
      throw error;
    }
  },

  initiateBankPayment: async (paymentData) => {
    try {
      set({ loading: true, error: null, paymentFlow: 'processing' });
      
      const response = await api.post('/api/v1/payments/azampay/bank/checkout', paymentData);
      
      if (response.success) {
        set({ 
          currentTransaction: response,
          loading: false 
        });
        
        toast.success("Payment Initiated", {
          description: "Bank payment initiated successfully. Complete the transaction in your banking app.",
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Bank payment failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to initiate bank payment';
      set({ 
        error: errorMessage,
        loading: false,
        paymentFlow: 'error',
        paymentHistory: [] 
      });
      
      toast.error("Payment Failed", {
        description: errorMessage,
      });
      
      throw error;
    }
  },

  resetPaymentFlow: () => set({ 
    paymentMethod: null,
    selectedUnit: null,
    paymentFlow: 'select',
    currentTransaction: null,
    error: null
  }),

  formatCurrency: (amount) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  getPaymentStatusColor: (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },

  validatePaymentAmount: (amount) => {
    const errors = [];
    
    if (!amount || amount <= 0) {
      errors.push('Valid payment amount is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  refreshPaymentHistory: async () => {
    await get().fetchPaymentHistory();
  }
}));