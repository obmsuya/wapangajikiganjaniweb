// stores/landlord/useSubscriptionStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { customToast } from '@/components/ui/custom-toast';

const ERROR_TYPES = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error',
  PAYMENT: 'payment_error',
  SERVER: 'server_error',
  TIMEOUT: 'timeout_error'
};

const classifyError = (error) => {
  if (!error) return { type: ERROR_TYPES.SERVER, message: 'Unknown error occurred' };
  
  const errorMessage = error.message || error.toString().toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, message: 'Network connection failed' };
  }
  if (errorMessage.includes('validation') || errorMessage.includes('required')) {
    return { type: ERROR_TYPES.VALIDATION, message: 'Please check your input' };
  }
  if (errorMessage.includes('payment') || errorMessage.includes('insufficient')) {
    return { type: ERROR_TYPES.PAYMENT, message: 'Payment processing failed' };
  }
  if (errorMessage.includes('timeout')) {
    return { type: ERROR_TYPES.TIMEOUT, message: 'Request timed out' };
  }
  
  return { type: ERROR_TYPES.SERVER, message: errorMessage };
};

export const useSubscriptionStore = create((set, get) => ({
  loading: false,
  error: null,
  plans: [],
  currentSubscription: null,
  subscriptionStatus: null,
  subscriptionHistory: [],
  propertyVisibility: null,
  processingPayment: false,
  lastTransactionId: null,
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setProcessingPayment: (processing) => set({ processingPayment: processing }),

  fetchPlans: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/subscription/plans/');
      
      if (response && !response.error) {
        const formattedPlans = (response || []).map(plan => ({
          id: plan.id,
          name: plan.name,
          planType: plan.plan_type,
          duration: plan.duration,
          durationDisplay: plan.duration_display,
          price: parseFloat(plan.price || 0),
          propertyLimit: plan.property_limit,
          description: plan.description || '',
          features: plan.features || {}
        }));
        
        set({
          plans: formattedPlans,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load subscription plans');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Plans Error", {
        description: classified.message
      });
    }
  },

  fetchCurrentSubscription: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/subscription/current/');
      
      if (response && !response.error) {
        const formattedSubscription = {
          id: response.id,
          plan: {
            id: response.plan.id,
            name: response.plan.name,
            planType: response.plan.plan_type,
            duration: response.plan.duration,
            durationDisplay: response.plan.duration_display,
            price: parseFloat(response.plan.price || 0),
            propertyLimit: response.plan.property_limit,
            features: response.plan.features || {}
          },
          status: response.status,
          startDate: response.start_date,
          endDate: response.end_date,
          autoRenew: response.auto_renew,
          createdAt: response.created_at,
          isFreePlan: response.is_free_plan
        };
        
        set({
          currentSubscription: formattedSubscription,
          loading: false
        });
      } else {
        set({
          currentSubscription: null,
          loading: false
        });
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false,
        currentSubscription: null
      });
      
      customToast.error("Subscription Error", {
        description: classified.message
      });
    }
  },

  fetchSubscriptionStatus: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/subscription/status/');
      
      if (response && !response.error) {
        const formattedStatus = {
          hasActiveSubscription: response.has_active_subscription,
          canAccessProperties: response.can_access_properties,
          canAddProperties: response.can_add_properties,
          canManageTenants: response.can_manage_tenants,
          propertyLimit: response.property_limit,
          propertyCounts: {
            total: response.property_counts?.total || 0,
            visible: response.property_counts?.visible || 0,
            invisible: response.property_counts?.invisible || 0
          },
          currentPlan: {
            subscriptionId: response.current_plan?.subscription_id,
            planName: response.current_plan?.plan_name,
            planType: response.current_plan?.plan_type,
            endDate: response.current_plan?.end_date,
            isFreePlan: response.current_plan?.is_free_plan
          },
          features: response.features || {}
        };
        
        set({
          subscriptionStatus: formattedStatus,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load subscription status');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Status Error", {
        description: classified.message
      });
    }
  },

  fetchSubscriptionHistory: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/subscription/history/');
      
      if (response && !response.error) {
        const formattedHistory = (response || []).map(sub => ({
          id: sub.id,
          planName: sub.plan_name,
          planType: sub.plan_type,
          propertyLimit: sub.property_limit,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          price: parseFloat(sub.price || 0),
          createdAt: sub.created_at,
          isCurrent: sub.is_current
        }));
        
        set({
          subscriptionHistory: formattedHistory,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load subscription history');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("History Error", {
        description: classified.message
      });
    }
  },

  fetchPropertyVisibility: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.get('/api/v1/payments/subscription/property-visibility/');
      
      if (response && !response.error) {
        const formattedVisibility = {
          properties: (response.properties || []).map(prop => ({
            id: prop.id,
            name: prop.name,
            category: prop.category,
            location: prop.location,
            totalUnits: prop.total_units,
            isVisible: prop.is_visible,
            isPrimary: prop.is_primary,
            createdAt: prop.created_at
          })),
          subscription: {
            planName: response.subscription?.plan_name,
            planType: response.subscription?.plan_type,
            propertyLimit: response.subscription?.property_limit,
            isFreePlan: response.subscription?.is_free_plan
          },
          totalProperties: response.total_properties || 0,
          visibleProperties: response.visible_properties || 0,
          invisibleProperties: response.invisible_properties || 0
        };
        
        set({
          propertyVisibility: formattedVisibility,
          loading: false
        });
      } else {
        throw new Error(response?.error || 'Failed to load property visibility');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Visibility Error", {
        description: classified.message
      });
    }
  },

  processMNOPayment: async (planId, accountNumber, provider) => {
    try {
      set({ processingPayment: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/mno/checkout/', {
        plan_id: planId,
        accountNumber: accountNumber,
        provider: provider
      });
      
      if (response && response.success !== false) {
        set({ 
          processingPayment: false,
          lastTransactionId: response.transaction_id 
        });
        
        return {
          success: true,
          transactionId: response.transaction_id,
          externalId: response.external_id,
          message: response.message || "Payment initiated successfully"
        };
      } else {
        throw new Error(response?.error || 'Payment initiation failed');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        processingPayment: false
      });
      
      return { 
        success: false, 
        error: classified.message,
        type: classified.type 
      };
    }
  },

  processBankPayment: async (planId, accountNumber, bankName) => {
    try {
      set({ processingPayment: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/bank/checkout/', {
        plan_id: planId,
        accountNumber: accountNumber,
        bankName: bankName
      });
      
      if (response && response.success !== false) {
        set({ 
          processingPayment: false,
          lastTransactionId: response.transaction_id 
        });
        
        return {
          success: true,
          transactionId: response.transaction_id,
          externalId: response.external_id,
          message: response.message || "Payment initiated successfully"
        };
      } else {
        throw new Error(response?.error || 'Payment initiation failed');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        processingPayment: false
      });
      
      return { 
        success: false, 
        error: classified.message,
        type: classified.type 
      };
    }
  },

  cancelSubscription: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/cancel/');
      
      if (response && !response.error) {
        customToast.success("Subscription Cancelled", {
          description: "Your subscription has been cancelled. Reverted to free plan."
        });
        
        set({ loading: false });
        get().fetchCurrentSubscription();
        
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      const classified = classifyError(error);
      set({
        error: classified.message,
        loading: false
      });
      
      customToast.error("Cancellation Failed", {
        description: classified.message
      });
      
      return { success: false, error: classified.message };
    }
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

  getPlanTypeColor: (planType) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-green-100 text-green-800'
    };
    return colors[planType] || colors.basic;
  },

  getSubscriptionStatusColor: (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  },

  reset: () => {
    set({
      loading: false,
      error: null,
      plans: [],
      currentSubscription: null,
      subscriptionStatus: null,
      subscriptionHistory: [],
      propertyVisibility: null,
      processingPayment: false,
      lastTransactionId: null
    });
  }
}));