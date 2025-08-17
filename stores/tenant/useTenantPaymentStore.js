//stores/tenant/useTenantPaymentStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { customToast } from '@/components/ui/custom-toast';

const ERROR_TYPES = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error',
  PAYMENT: 'payment_error',
  SERVER: 'server_error',
  TIMEOUT: 'timeout_error',
  UNIT_SELECTION: 'unit_selection_required'
};

const classifyError = (error) => {
  if (!error) return { type: ERROR_TYPES.SERVER, message: 'Unknown error occurred' };
  
  const errorMessage = error.message || error.toString().toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, message: 'Network connection failed. Please check your internet and try again.' };
  }
  if (errorMessage.includes('validation') || errorMessage.includes('required')) {
    return { type: ERROR_TYPES.VALIDATION, message: 'Please check your payment details and try again.' };
  }
  if (errorMessage.includes('insufficient funds')) {
    return { type: ERROR_TYPES.PAYMENT, message: 'Insufficient funds. Please top up your account and try again.' };
  }
  if (errorMessage.includes('invalid account') || errorMessage.includes('invalid phone')) {
    return { type: ERROR_TYPES.PAYMENT, message: 'Invalid account details. Please check and try again.' };
  }
  if (errorMessage.includes('timeout')) {
    return { type: ERROR_TYPES.TIMEOUT, message: 'Request timed out. Please try again.' };
  }
  if (errorMessage.includes('multiple units') || errorMessage.includes('unit selection')) {
    return { type: ERROR_TYPES.UNIT_SELECTION, message: 'Please select which unit this payment is for.' };
  }
  if (errorMessage.includes('no active occupancy')) {
    return { type: ERROR_TYPES.PAYMENT, message: 'No active lease found. Please contact your landlord.' };
  }
  if (errorMessage.includes('payment already exists')) {
    return { type: ERROR_TYPES.PAYMENT, message: 'A payment for this period is already being processed.' };
  }
  
  return { type: ERROR_TYPES.SERVER, message: errorMessage.length > 100 ? 'An unexpected error occurred. Please try again.' : errorMessage };
};

export const useTenantPaymentStore = create((set, get) => ({
  loading: false,
  error: null,
  paymentMethod: null,
  selectedUnit: null,
  paymentFlow: 'select',
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

  fetchOccupancies: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/v1/payments/rent/tenant/current-occupancy/');
      
      if (response.success) {
        const formattedOccupancies = (response.occupancies || []).map(occ => ({
          unit_id: occ.unit_id,
          unit_name: occ.unit_name,
          property_id: occ.property_id,
          property_name: occ.property_name,
          floor_number: occ.floor_number,
          rent_amount: parseFloat(occ.rent_amount || 0),
          payment_frequency: occ.payment_frequency || 'monthly',
          start_date: occ.start_date,
          status: occ.status,
          recent_payments: occ.recent_payments || []
        }));
        
        set({ 
          occupancies: formattedOccupancies, 
          loading: false 
        });
        
        return formattedOccupancies;
      } else {
        throw new Error(response.error || 'Failed to load occupancies');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false, 
        occupancies: [] 
      });
      
      customToast.error("Failed to Load Units", {
        description: classified.message
      });
      
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
      const url = queryString ? `/api/v1/payments/rent/tenant/history/?${queryString}` : '/api/v1/payments/rent/tenant/history/';
      
      const response = await api.get(url);
      
      if (response.success) {
        const formattedPayments = (response.payments || []).map(payment => ({
          id: payment.id,
          property_name: payment.property_name,
          unit_name: payment.unit_name,
          floor_number: payment.floor_number,
          amount: parseFloat(payment.amount || 0),
          payment_period_start: payment.payment_period_start,
          payment_period_end: payment.payment_period_end,
          status: payment.status,
          notes: payment.notes,
          created_at: payment.created_at,
          payment_method: payment.payment_method,
          confirmation_deadline: payment.confirmation_deadline,
          auto_confirmed: payment.auto_confirmed,
          rejection_reason: payment.rejection_reason
        }));
        
        set({ 
          paymentHistory: formattedPayments, 
          loading: false 
        });
      } else {
        throw new Error(response.error || 'Failed to load payment history');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false 
      });
      
      customToast.error("Failed to Load History", {
        description: classified.message
      });
    }
  },

  recordManualPayment: async (amount, unitId = null, notes = '') => {
    try {
      set({ loading: true, error: null });
      
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      
      if (!notes?.trim()) {
        throw new Error('Please describe how you made the payment');
      }
      
      const paymentData = { 
        amount: parseFloat(amount),
        notes: notes.trim()
      };
      
      if (unitId) {
        paymentData.unit_id = parseInt(unitId);
      }
      
      const response = await api.post('/api/v1/payments/rent/record/', paymentData);
      
      if (response.success) {
        set({ 
          currentTransaction: {
            ...response,
            amount: paymentData.amount,
            unit_name: response.unit_name,
            payment_id: response.payment_id
          }, 
          paymentFlow: 'success', 
          loading: false 
        });
        
        customToast.success("Payment Recorded", {
          description: "Your payment has been recorded and sent to your landlord for confirmation."
        });
        
        await get().refreshPaymentHistory();
        return response;
      } else {
        if (response.requires_unit_selection && response.available_units) {
          set({ 
            error: response.message,
            availableUnits: response.available_units,
            requiresUnitSelection: true,
            loading: false 
          });
          return { 
            requiresUnitSelection: true, 
            availableUnits: response.available_units 
          };
        }
        throw new Error(response.message || 'Payment recording failed');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false, 
        paymentFlow: 'error' 
      });
      
      customToast.error("Payment Recording Failed", {
        description: classified.message
      });
      
      throw error;
    }
  },

  processSystemPayment: async (unitId, accountNumber, provider, paymentType = 'mno') => {
    try {
      set({ loading: true, error: null, paymentFlow: 'processing' });
      
      if (!unitId) {
        throw new Error('Unit selection is required');
      }
      
      if (!accountNumber?.trim()) {
        throw new Error(paymentType === 'mno' ? 'Mobile number is required' : 'Account number is required');
      }
      
      if (!provider) {
        throw new Error('Payment provider is required');
      }
      
      // Validate phone number for mobile money
      if (paymentType === 'mno') {
        const cleanNumber = accountNumber.replace(/\s/g, '');
        if (!/^\+?[0-9]{10,15}$/.test(cleanNumber)) {
          throw new Error('Please enter a valid mobile number');
        }
      }
      
      // Use the correct existing endpoint from your backend
      const endpoint = '/api/v1/payments/rent/system/process/';
      
      const response = await api.post(endpoint, {
        unit_id: parseInt(unitId),
        accountNumber: accountNumber.replace(/\s/g, ''),
        provider: provider
      });
      
      if (response.success) {
        set({ 
          currentTransaction: {
            ...response,
            transaction_id: response.transaction_id,
            external_id: response.external_id,
            amount: response.payment_details?.amount,
            unit_name: response.payment_details?.unit_name
          }, 
          paymentFlow: 'success', 
          loading: false 
        });
        
        customToast.success("Payment Initiated", {
          description: "Complete the payment on your phone to finalize rent payment."
        });
        
        return response;
      } else {
        if (response.requires_unit_selection && response.available_units) {
          set({ 
            error: response.message,
            availableUnits: response.available_units,
            requiresUnitSelection: true,
            loading: false 
          });
          return { 
            requiresUnitSelection: true, 
            availableUnits: response.available_units 
          };
        }
        throw new Error(response.error || 'Payment processing failed');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false, 
        paymentFlow: 'error' 
      });
      
      customToast.error("Payment Failed", {
        description: classified.message
      });
      
      throw error;
    }
  },

  fetchOccupancies: async () => {
    try {
      set({ loading: true, error: null });
      // Use the correct working endpoint that was already there
      const response = await api.get('/api/v1/payments/rent/tenant/occupancy/');
      
      if (response.success) {
        const formattedOccupancies = (response.occupancies || []).map(occ => ({
          unit_id: occ.unit_id,
          unit_name: occ.unit_name,
          property_id: occ.property_id,
          property_name: occ.property_name,
          floor_number: occ.floor_number,
          rent_amount: parseFloat(occ.rent_amount || 0),
          payment_frequency: occ.payment_frequency || 'monthly',
          start_date: occ.start_date,
          status: occ.status,
          recent_payments: occ.recent_payments || []
        }));
        
        set({ 
          occupancies: formattedOccupancies, 
          loading: false 
        });
        
        return formattedOccupancies;
      } else {
        throw new Error(response.error || 'Failed to load occupancies');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false, 
        occupancies: [] 
      });
      
      customToast.error("Failed to Load Units", {
        description: classified.message
      });
      
      throw error;
    }
  },

  recordManualPayment: async (amount, unitId = null, notes = '') => {
    try {
      set({ loading: true, error: null });
      
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      
      if (!notes?.trim()) {
        throw new Error('Please describe how you made the payment');
      }
      
      const paymentData = { 
        amount: parseFloat(amount),
        notes: notes.trim()
      };
      
      if (unitId) {
        paymentData.unit_id = parseInt(unitId);
      }
      
      // Use the correct working endpoint that was already there
      const response = await api.post('/api/v1/payments/rent/manual/record/', paymentData);
      
      if (response.success) {
        set({ 
          currentTransaction: {
            ...response,
            amount: paymentData.amount,
            unit_name: response.unit_name,
            payment_id: response.payment_id
          }, 
          paymentFlow: 'success', 
          loading: false 
        });
        
        customToast.success("Payment Recorded", {
          description: "Your payment has been recorded and sent to your landlord for confirmation."
        });
        
        await get().refreshPaymentHistory();
        return response;
      } else {
        if (response.requires_unit_selection && response.available_units) {
          set({ 
            error: response.message,
            availableUnits: response.available_units,
            requiresUnitSelection: true,
            loading: false 
          });
          return { 
            requiresUnitSelection: true, 
            availableUnits: response.available_units 
          };
        }
        throw new Error(response.message || 'Payment recording failed');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({ 
        error: classified.message, 
        loading: false, 
        paymentFlow: 'error' 
      });
      
      customToast.error("Payment Recording Failed", {
        description: classified.message
      });
      
      throw error;
    }
  },

  checkPaymentStatus: async (transactionId) => {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      const response = await api.get(`/api/v1/payments/rent/status/${transactionId}/`);
      
      if (response && response.status) {
        return {
          success: true,
          status: response.status,
          payment: response.payment,
          details: response.transaction_details
        };
      } else {
        throw new Error('Failed to check payment status');
      }
    } catch (error) {
      const classified = classifyError(error);
      
      customToast.error("Status Check Failed", {
        description: classified.message
      });
      
      return {
        success: false,
        error: classified.message
      };
    }
  },

  getOccupancyByUnitId: (unitId) => {
    const { occupancies } = get();
    return (occupancies || []).find(occ => occ.unit_id === parseInt(unitId));
  },

  resetPaymentFlow: () => set({ 
    paymentMethod: null, 
    selectedUnit: null, 
    paymentFlow: 'select',
    currentTransaction: null, 
    error: null, 
    showPaymentDialog: false,
    requiresUnitSelection: false,
    availableUnits: []
  }),

  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  getPaymentStatusColor: (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || colors.pending;
  },

  getPaymentMethodIcon: (method) => {
    const icons = {
      manual: 'HandCoins',
      system_wallet: 'Smartphone',
      mobile_money: 'Smartphone',
      bank_transfer: 'Building2',
      card: 'CreditCard'
    };
    return icons[method] || 'DollarSign';
  },

  refreshPaymentHistory: async () => {
    await get().fetchPaymentHistory();
  },

  refreshOccupancies: async () => {
    await get().fetchOccupancies();
  },

  buildPaymentSummary: (payments = null) => {
    const paymentsToAnalyze = payments || get().paymentHistory;
    
    if (!Array.isArray(paymentsToAnalyze) || paymentsToAnalyze.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        completedAmount: 0,
        completedCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        failedCount: 0,
        averageAmount: 0,
        lastPaymentDate: null,
        successRate: 0
      };
    }

    const summary = paymentsToAnalyze.reduce((acc, payment) => {
      acc.totalAmount += payment.amount;
      acc.totalCount += 1;
      
      if (payment.status === 'completed') {
        acc.completedAmount += payment.amount;
        acc.completedCount += 1;
      } else if (payment.status === 'pending') {
        acc.pendingAmount += payment.amount;
        acc.pendingCount += 1;
      } else if (payment.status === 'failed' || payment.status === 'rejected') {
        acc.failedCount += 1;
      }
      
      return acc;
    }, {
      totalAmount: 0,
      totalCount: 0,
      completedAmount: 0,
      completedCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      failedCount: 0
    });

    const sortedPayments = paymentsToAnalyze.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    return {
      ...summary,
      averageAmount: summary.totalCount > 0 ? summary.totalAmount / summary.totalCount : 0,
      lastPaymentDate: sortedPayments.length > 0 ? sortedPayments[0].created_at : null,
      successRate: summary.totalCount > 0 ? (summary.completedCount / summary.totalCount) * 100 : 0
    };
  },

  validatePaymentData: (amount, notes = '', accountNumber = '', paymentType = 'mno') => {
    const errors = [];
    
    if (!amount || amount <= 0) {
      errors.push('Payment amount must be greater than zero');
    }
    
    if (amount && amount > 10000000) {
      errors.push('Payment amount is too large');
    }
    
    if (notes !== null && notes !== undefined && !notes.trim()) {
      errors.push('Please describe how you made the payment');
    }
    
    if (accountNumber && paymentType === 'mno') {
      const cleanNumber = accountNumber.replace(/\s/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(cleanNumber)) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  reset: () => {
    set({
      loading: false,
      error: null,
      paymentMethod: null,
      selectedUnit: null,
      paymentFlow: 'select',
      paymentHistory: [],
      currentTransaction: null,
      occupancies: [],
      showPaymentDialog: false,
      requiresUnitSelection: false,
      availableUnits: []
    });
  }
}));