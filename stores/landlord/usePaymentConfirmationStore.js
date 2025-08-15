// stores/landlord/usePaymentConfirmationStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

export const usePaymentConfirmationStore = create((set, get) => ({
  // State
  loading: false,
  error: null,
  pendingPayments: [],
  selectedPayment: null,
  filters: {
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    dateRange: 'all'
  },
  
  // UI State
  showConfirmDialog: false,
  confirmAction: null,
  rejectionReason: '',
  processingConfirmation: false,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  setFilters: (newFilters) => set(state => ({
    filters: { ...state.filters, ...newFilters }
  })),

  setSelectedPayment: (payment) => set({ selectedPayment: payment }),
  setShowConfirmDialog: (show) => set({ showConfirmDialog: show }),
  setConfirmAction: (action) => set({ confirmAction: action }),
  setRejectionReason: (reason) => set({ rejectionReason: reason }),

  // Fetch pending payments
  fetchPendingPayments: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/rent/manual/pending/');
      
      if (response && !response.error) {
        const formattedPayments = (response.pending_payments || []).map(payment => ({
          id: payment.id,
          tenantName: payment.tenant_name,
          propertyName: payment.property_name,
          unitName: payment.unit_name,
          amount: parseFloat(payment.amount),
          status: payment.status,
          notes: payment.notes || '',
          createdAt: payment.created_at,
          paymentPeriodStart: payment.payment_period_start,
          paymentPeriodEnd: payment.payment_period_end,
          confirmationDeadline: payment.confirmation_deadline,
          formattedPaymentPeriod: `${new Date(payment.payment_period_start).toLocaleDateString()} - ${new Date(payment.payment_period_end).toLocaleDateString()}`,
          formattedCreatedAt: new Date(payment.created_at).toLocaleDateString(),
          formattedConfirmationDeadline: payment.confirmation_deadline ? new Date(payment.confirmation_deadline).toLocaleDateString() : null,
          daysPending: Math.floor((new Date() - new Date(payment.created_at)) / (1000 * 60 * 60 * 24)),
          daysUntilDeadline: payment.confirmation_deadline ? Math.floor((new Date(payment.confirmation_deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
          isOverdue: payment.confirmation_deadline ? new Date() > new Date(payment.confirmation_deadline) : false
        }));
        
        set({
          pendingPayments: formattedPayments,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to fetch pending payments');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch pending payments';
      set({
        error: errorMessage,
        loading: false,
        pendingPayments: []
      });
      
      toast.error('Error Loading Payments', {
        description: errorMessage
      });
    }
  },

  // Confirm or reject payment
  confirmPayment: async (paymentId, action, rejectionReason = '') => {
    try {
      set({ processingConfirmation: true, error: null });
      
      const payload = {
        action,
        ...(action === 'reject' && rejectionReason && { rejection_reason: rejectionReason })
      };
      
      const response = await api.post(`/api/v1/payments/rent/manual/confirm/${paymentId}/`, payload);
      
      if (response && !response.error) {

        toast.success(
          action === 'accept' ? 'Payment Accepted' : 'Payment Rejected',
          {
            description: response.message || `Payment has been ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
          }
        );

        set({
          showConfirmDialog: false,
          selectedPayment: null,
          confirmAction: null,
          rejectionReason: '',
          processingConfirmation: false
        });
        
        await get().fetchPendingPayments();
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response?.error || `Failed to ${action} payment`);
      }
    } catch (error) {
      const errorMessage = error.message || `Failed to ${action} payment`;
      set({
        error: errorMessage,
        processingConfirmation: false
      });
      
      toast.error(
        action === 'accept' ? 'Failed to Accept Payment' : 'Failed to Reject Payment',
        {
          description: errorMessage
        }
      );
      
      return { success: false, error: errorMessage };
    }
  },

  openConfirmDialog: (payment, action) => {
    set({
      selectedPayment: payment,
      confirmAction: action,
      showConfirmDialog: true,
      rejectionReason: ''
    });
  },

  closeConfirmDialog: () => {
    set({
      showConfirmDialog: false,
      selectedPayment: null,
      confirmAction: null,
      rejectionReason: ''
    });
  },

  getFilteredPayments: () => {
    const { pendingPayments, filters } = get();
    let filtered = [...pendingPayments];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.tenantName.toLowerCase().includes(searchLower) ||
        payment.propertyName.toLowerCase().includes(searchLower) ||
        payment.unitName.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(payment => 
          new Date(payment.createdAt) >= filterDate
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];
      
      if (filters.sortBy === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (filters.sortBy.includes('Date') || filters.sortBy.includes('At')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (filters.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  },

  getSummaryStats: () => {
    const { pendingPayments } = get();
    
    const stats = {
      totalPending: pendingPayments.length,
      totalAmount: pendingPayments.reduce((sum, payment) => sum + payment.amount, 0),
      urgentCount: pendingPayments.filter(payment => payment.daysPending >= 2).length,
      overdueCount: pendingPayments.filter(payment => payment.isOverdue).length,
      todayCount: pendingPayments.filter(payment => {
        const today = new Date().toDateString();
        const paymentDate = new Date(payment.createdAt).toDateString();
        return today === paymentDate;
      }).length
    };
    
    return stats;
  },

  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  refreshData: async () => {
    await get().fetchPendingPayments();
  },

  // Reset store
  reset: () => {
    set({
      loading: false,
      error: null,
      pendingPayments: [],
      selectedPayment: null,
      filters: {
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        dateRange: 'all'
      },
      showConfirmDialog: false,
      confirmAction: null,
      rejectionReason: '',
      processingConfirmation: false
    });
  }
}));