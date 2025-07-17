import api from '@/lib/api/api-client';

const TenantPaymentService = {
  getTenantPaymentHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.unitId) params.append('unit_id', filters.unitId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/rent/tenant/history/?${queryString}` 
        : '/api/v1/payments/rent/tenant/history/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching tenant payment history:", error);
      throw error;
    }
  },

  getCurrentOccupancy: async () => {
    try {
      const response = await api.get('/api/v1/payments/rent/tenant/occupancy/');
      return response;
    } catch (error) {
      console.error("Error fetching current occupancy:", error);
      throw error;
    }
  },

  recordManualPayment: async (paymentData) => {
    try {
      const requiredFields = ['property_id', 'unit_id', 'amount', 'payment_date', 'period_start', 'period_end'];
      
      for (const field of requiredFields) {
        if (!paymentData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      const response = await api.post('/api/v1/payments/rent/manual/record/', paymentData);
      return response;
    } catch (error) {
      console.error("Error recording manual payment:", error);
      throw error;
    }
  },

  generateRentSchedule: async (scheduleData) => {
    try {
      const requiredFields = ['unit_id', 'start_date', 'frequency', 'num_periods'];
      
      for (const field of requiredFields) {
        if (!scheduleData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      const response = await api.post('/api/v1/payments/rent/schedule/generate/', scheduleData);
      return response;
    } catch (error) {
      console.error("Error generating rent schedule:", error);
      throw error;
    }
  },

  processSystemPayment: async (paymentData) => {
    try {
      const requiredFields = ['property_id', 'unit_id', 'amount', 'transaction_id', 'period_start', 'period_end'];
      
      for (const field of requiredFields) {
        if (!paymentData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      const response = await api.post('/api/v1/payments/rent/system/process/', paymentData);
      return response;
    } catch (error) {
      console.error("Error processing system payment:", error);
      throw error;
    }
  },

  formatTenantPaymentForDisplay: (payment) => {
    return {
      id: payment.id,
      propertyName: payment.property_name || 'Unknown Property',
      unitName: payment.unit_name || 'Unknown Unit',
      floorNumber: payment.floor_number || null,
      amount: parseFloat(payment.amount || 0),
      periodStart: payment.payment_period_start,
      periodEnd: payment.payment_period_end,
      status: payment.status || 'pending',
      notes: payment.notes || '',
      createdAt: payment.created_at,
      paymentDate: payment.payment_date || payment.created_at,
      transactionId: payment.transaction_id || null,
      paymentMethod: payment.payment_method || 'unknown',
      confirmationDeadline: payment.confirmation_deadline || null
    };
  },

  formatOccupancyForDisplay: (occupancy) => {
    return {
      unitId: occupancy.unit_id,
      unitName: occupancy.unit_name || 'Unknown Unit',
      floorNumber: occupancy.floor_number || null,
      propertyName: occupancy.property_name || 'Unknown Property',
      rentAmount: parseFloat(occupancy.rent_amount || 0),
      paymentFrequency: occupancy.payment_frequency || 'monthly',
      startDate: occupancy.start_date,
      endDate: occupancy.end_date,
      recentPayments: (occupancy.recent_payments || []).map(payment => 
        TenantPaymentService.formatTenantPaymentForDisplay(payment)
      )
    };
  },

  calculateNextPayment: (occupancy) => {
    if (!occupancy || !occupancy.startDate) return null;
    
    const today = new Date();
    const frequency = occupancy.paymentFrequency || 'monthly';
    const startDate = new Date(occupancy.startDate);
    
    let nextPaymentDate = new Date(startDate);
    
    while (nextPaymentDate <= today) {
      switch (frequency) {
        case 'monthly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case 'biannual':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
          break;
        case 'annual':
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
        default:
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    }
    
    const daysUntilDue = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      amount: occupancy.rentAmount,
      dueDate: nextPaymentDate,
      daysUntilDue: daysUntilDue,
      isOverdue: daysUntilDue < 0,
      paymentFrequency: frequency
    };
  },

  validatePaymentData: (paymentData) => {
    const errors = [];
    
    if (!paymentData.property_id) {
      errors.push('Property selection is required');
    }
    
    if (!paymentData.unit_id) {
      errors.push('Unit selection is required');
    }
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Valid payment amount is required');
    }
    
    if (!paymentData.payment_date) {
      errors.push('Payment date is required');
    }
    
    if (!paymentData.period_start || !paymentData.period_end) {
      errors.push('Payment period is required');
    }
    
    if (paymentData.period_start && paymentData.period_end) {
      const startDate = new Date(paymentData.period_start);
      const endDate = new Date(paymentData.period_end);
      
      if (startDate >= endDate) {
        errors.push('Period start date must be before end date');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  formatCurrency: (amount, currency = 'TZS') => {
    const formattedAmount = parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `${currency} ${formattedAmount}`;
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
  }
};

export default TenantPaymentService;