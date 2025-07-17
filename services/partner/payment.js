import api from '@/lib/api/api-client';

const PartnerPaymentService = {
  getWalletBalance: async () => {
    try {
      const response = await api.get('/api/v1/payments/partner/wallet/balance/');
      return response;
    } catch (error) {
      console.error("Error fetching partner wallet balance:", error);
      throw error;
    }
  },

  getTransactionHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.transactionType) params.append('transaction_type', filters.transactionType);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/partner/wallet/transactions/?${queryString}` 
        : '/api/v1/payments/partner/wallet/transactions/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching partner transaction history:", error);
      throw error;
    }
  },

  getEarningsSummary: async (period = 'month') => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/partner/earnings/summary/?${queryString}` 
        : '/api/v1/payments/partner/earnings/summary/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching partner earnings summary:", error);
      throw error;
    }
  },

  getReferralStats: async (period = 'month') => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/partner/earnings/referrals/?${queryString}` 
        : '/api/v1/payments/partner/earnings/referrals/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching partner referral stats:", error);
      throw error;
    }
  },

  requestPayout: async (payoutData) => {
    try {
      const requiredFields = ['amount', 'payout_method'];
      
      for (const field of requiredFields) {
        if (!payoutData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      if (payoutData.amount <= 0) {
        throw new Error('Payout amount must be greater than 0');
      }
      
      const response = await api.post('/api/v1/payments/partner/payout/request/', payoutData);
      return response;
    } catch (error) {
      console.error("Error requesting partner payout:", error);
      throw error;
    }
  },

  getPayoutHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/payments/partner/payout/history/?${queryString}` 
        : '/api/v1/payments/partner/payout/history/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching partner payout history:", error);
      throw error;
    }
  },

  getPayoutEligibility: async () => {
    try {
      const response = await api.get('/api/v1/payments/partner/payout/eligibility/');
      return response;
    } catch (error) {
      console.error("Error fetching partner payout eligibility:", error);
      throw error;
    }
  },

  getPartnerDashboard: async () => {
    try {
      const response = await api.get('/api/v1/payments/partner/dashboard/');
      return response;
    } catch (error) {
      console.error("Error fetching partner dashboard:", error);
      throw error;
    }
  },

  formatTransactionForDisplay: (transaction) => {
    return {
      id: transaction.id,
      transactionType: transaction.transaction_type || 'unknown',
      amount: parseFloat(transaction.amount || 0),
      description: transaction.description || '',
      balanceBefore: parseFloat(transaction.balance_before || 0),
      balanceAfter: parseFloat(transaction.balance_after || 0),
      createdAt: transaction.created_at,
      reference: transaction.reference || null
    };
  },

  formatPayoutForDisplay: (payout) => {
    return {
      id: payout.id,
      amount: parseFloat(payout.amount || 0),
      payoutMethod: payout.payout_method || 'unknown',
      recipientDetails: payout.recipient_details || {},
      status: payout.status || 'pending',
      requestedAt: payout.requested_at,
      processedAt: payout.processed_at || null,
      reference: payout.reference || null,
      notes: payout.notes || ''
    };
  },

  formatEarningsForDisplay: (earnings) => {
    return {
      totalEarnings: parseFloat(earnings.total_earnings || 0),
      currentBalance: parseFloat(earnings.current_balance || 0),
      totalWithdrawn: parseFloat(earnings.total_withdrawn || 0),
      pendingPayouts: parseFloat(earnings.pending_payouts || 0),
      referralCount: parseInt(earnings.referral_count || 0),
      conversionRate: parseFloat(earnings.conversion_rate || 0),
      earningsThisMonth: parseFloat(earnings.earnings_this_month || 0),
      earningsLastMonth: parseFloat(earnings.earnings_last_month || 0)
    };
  },

  formatReferralStatsForDisplay: (stats) => {
    return {
      totalReferrals: parseInt(stats.total_referrals || 0),
      activeReferrals: parseInt(stats.active_referrals || 0),
      convertedReferrals: parseInt(stats.converted_referrals || 0),
      conversionRate: parseFloat(stats.conversion_rate || 0),
      referralsThisMonth: parseInt(stats.referrals_this_month || 0),
      referralsLastMonth: parseInt(stats.referrals_last_month || 0),
      topReferralSources: stats.top_referral_sources || []
    };
  },

  getTransactionTypeColor: (type) => {
    const colors = {
      commission: 'bg-green-100 text-green-800 border-green-200',
      referral_bonus: 'bg-blue-100 text-blue-800 border-blue-200',
      payout: 'bg-red-100 text-red-800 border-red-200',
      adjustment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bonus: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return colors[type] || colors.commission;
  },

  getPayoutStatusColor: (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colors[status] || colors.pending;
  },

  validatePayoutRequest: (payoutData) => {
    const errors = [];
    
    if (!payoutData.amount || payoutData.amount <= 0) {
      errors.push('Valid payout amount is required');
    }
    
    if (!payoutData.payout_method) {
      errors.push('Payout method is required');
    }
    
    if (payoutData.payout_method === 'mobile_money' && !payoutData.recipient_phone) {
      errors.push('Recipient phone number is required for mobile money payouts');
    }
    
    if (payoutData.payout_method === 'bank_transfer' && !payoutData.recipient_account) {
      errors.push('Recipient account details are required for bank transfers');
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

  calculateEarningsGrowth: (currentEarnings, previousEarnings) => {
    if (!previousEarnings || previousEarnings === 0) {
      return currentEarnings > 0 ? 100 : 0;
    }
    
    const growth = ((currentEarnings - previousEarnings) / previousEarnings) * 100;
    return Math.round(growth * 100) / 100;
  },

  groupTransactionsByPeriod: (transactions, period = 'month') => {
    if (!Array.isArray(transactions)) return {};
    
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.createdAt);
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
      groups[key].push(transaction);
      
      return groups;
    }, {});
  }
};

export default PartnerPaymentService;