// services/landlord/payment.js
import api from '@/lib/api/api-client';

const PaymentService = {
  getRentPayments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.propertyId) params.append('property_id', filters.propertyId);
      if (filters.tenantId) params.append('tenant_id', filters.tenantId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/rent/history/?${queryString}` 
        : '/api/v1/payments/rent/history/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching rent payments:", error);
      throw error;
    }
  },

  getPaymentSummary: async (startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/rent/summary/?${queryString}` 
        : '/api/v1/payments/rent/summary/';
      
      const response = await api.get(url);
      return response.summary || {};
    } catch (error) {
      console.error("Error fetching payment summary:", error);
      throw error;
    }
  },

  confirmPayment: async (paymentId, action, rejectionReason = '') => {
    try {
      if (!paymentId || !action) {
        throw new Error("Payment ID and action are required");
      }
      
      if (!['accept', 'reject'].includes(action)) {
        throw new Error("Action must be 'accept' or 'reject'");
      }
      
      const data = { action };
      if (action === 'reject' && rejectionReason) {
        data.rejection_reason = rejectionReason;
      }
      
      const response = await api.put(`/api/v1/payments/rent/confirmation/${paymentId}/`, data);
      return response;
    } catch (error) {
      console.error(`Error confirming payment ${paymentId}:`, error);
      throw error;
    }
  },

  getPropertyPaymentSettings: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/payments/rent/settings/${propertyId}/`);
      return response.settings || {};
    } catch (error) {
      console.error(`Error fetching payment settings for property ${propertyId}:`, error);
      throw error;
    }
  },

  updatePropertyPaymentSettings: async (propertyId, settings) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.put(`/api/v1/payments/rent/settings/${propertyId}/`, settings);
      return response;
    } catch (error) {
      console.error(`Error updating payment settings for property ${propertyId}:`, error);
      throw error;
    }
  },

  getRentSchedule: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.propertyId) params.append('property_id', filters.propertyId);
      if (filters.unitId) params.append('unit_id', filters.unitId);
      if (filters.paidOnly) params.append('paid_only', 'true');
      if (filters.overdueOnly) params.append('overdue_only', 'true');
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/rent/schedule/?${queryString}` 
        : '/api/v1/payments/rent/schedule/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching rent schedule:", error);
      throw error;
    }
  },

  getLandlordWallet: async () => {
    try {
      const response = await api.get('/api/v1/payments/rent/wallet/');
      return response.wallet || {};
    } catch (error) {
      console.error("Error fetching landlord wallet:", error);
      throw error;
    }
  },

  requestWalletWithdrawal: async (amount, withdrawalMethod, recipientDetails) => {
    try {
      if (!amount || !withdrawalMethod) {
        throw new Error("Amount and withdrawal method are required");
      }
      
      const data = {
        amount: parseFloat(amount),
        withdrawal_method: withdrawalMethod,
        ...recipientDetails
      };
      
      const response = await api.post('/api/v1/payments/rent/wallet/withdrawal/', data);
      return response;
    } catch (error) {
      console.error("Error requesting wallet withdrawal:", error);
      throw error;
    }
  },

  checkOverduePayments: async () => {
    try {
      const response = await api.get('/api/v1/payments/rent/overdue/');
      return response;
    } catch (error) {
      console.error("Error checking overdue payments:", error);
      throw error;
    }
  },

  getLandlordRejectionRate: async () => {
    try {
      const response = await api.get('/api/v1/payments/rent/rejection-rate/');
      return response;
    } catch (error) {
      console.error("Error fetching rejection rate:", error);
      throw error;
    }
  },

  formatPaymentForDisplay: (payment) => {
    return {
      id: payment.id,
      tenantName: payment.tenant_name || 'Unknown Tenant',
      propertyName: payment.property_name || 'Unknown Property',
      unitName: payment.unit_name || 'Unknown Unit',
      amount: parseFloat(payment.amount || 0),
      periodStart: payment.payment_period_start,
      periodEnd: payment.payment_period_end,
      status: payment.status || 'pending',
      autoConfirmed: payment.auto_confirmed || false,
      rejectionReason: payment.rejection_reason || '',
      notes: payment.notes || '',
      createdAt: payment.created_at,
      paymentDate: payment.payment_date || payment.created_at,
      transactionId: payment.transaction_id || null,
      paymentMethod: payment.payment_method || 'unknown'
    };
  },

  getPaymentStatusColor: (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colors[status] || colors.pending;
  },

  getPaymentMethodIcon: (method) => {
    const icons = {
      mobile_money: 'Smartphone',
      bank_transfer: 'CreditCard',
      cash: 'Banknote',
      cheque: 'FileText',
      online: 'Globe',
      system: 'Settings'
    };
    
    return icons[method] || 'DollarSign';
  },

  formatCurrency: (amount, currency = 'TZS') => {
    const formattedAmount = parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `${currency} ${formattedAmount}`;
  },

  calculateTotalRevenue: (payments) => {
    if (!Array.isArray(payments)) return 0;
    
    return payments
      .filter(payment => ['completed', 'confirmed'].includes(payment.status))
      .reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
  },

  groupPaymentsByPeriod: (payments, period = 'month') => {
    if (!Array.isArray(payments)) return {};
    
    return payments.reduce((groups, payment) => {
      const date = new Date(payment.created_at || payment.payment_date);
      let key;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(payment);
      
      return groups;
    }, {});
  },

  validatePaymentConfirmation: (payment, action, rejectionReason) => {
    const errors = [];
    
    if (!payment || !payment.id) {
      errors.push('Invalid payment selected');
    }
    
    if (!['accept', 'reject'].includes(action)) {
      errors.push('Please select a valid action');
    }
    
    if (action === 'reject' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      errors.push('Please provide a detailed rejection reason (minimum 5 characters)');
    }
    
    if (payment && payment.status !== 'pending') {
      errors.push('This payment has already been processed');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default PaymentService;