import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

export const useSubscriptionStore = create((set, get) => ({
  loading: false,
  error: null,
  plans: [],
  currentSubscription: null,
  subscriptionStatus: null,
  subscriptionHistory: [],
  propertyVisibility: null,
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

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
      const errorMessage = error.message || 'Failed to load subscription plans';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Plans Error", {
        description: errorMessage
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
      const errorMessage = error.message || 'Failed to load current subscription';
      set({
        error: errorMessage,
        loading: false,
        currentSubscription: null
      });
      
      toast.error("Subscription Error", {
        description: errorMessage
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
      const errorMessage = error.message || 'Failed to load subscription status';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Status Error", {
        description: errorMessage
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
      const errorMessage = error.message || 'Failed to load subscription history';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("History Error", {
        description: errorMessage
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
      const errorMessage = error.message || 'Failed to load property visibility';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Visibility Error", {
        description: errorMessage
      });
    }
  },

  generatePaymentDetails: async (planId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/subscribe/', {
        plan_id: planId
      });
      
      if (response && !response.error) {
        set({ loading: false });
        return {
          success: true,
          paymentDetails: response.payment_details,
          plan: response.plan
        };
      } else {
        throw new Error(response?.error || 'Failed to generate payment details');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to generate payment details';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Payment Error", {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  processMNOPayment: async (planId, accountNumber, provider) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/mno/checkout/', {
        plan_id: planId,
        accountNumber: accountNumber,
        provider: provider
      });
      
      if (response && !response.error) {
        toast.success("Payment Initiated", {
          description: "Your subscription payment has been initiated"
        });
        
        set({ loading: false });
        
        return {
          success: true,
          transactionId: response.transaction_id,
          externalId: response.external_id,
          message: response.message
        };
      } else {
        throw new Error(response?.error || 'Failed to process payment');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to process payment';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Payment Failed", {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  processBankPayment: async (planId, accountNumber, bankName) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/bank/checkout/', {
        plan_id: planId,
        accountNumber: accountNumber,
        bankName: bankName
      });
      
      if (response && !response.error) {
        toast.success("Payment Initiated", {
          description: "Your subscription payment has been initiated"
        });
        
        set({ loading: false });
        
        return {
          success: true,
          transactionId: response.transaction_id,
          externalId: response.external_id,
          message: response.message
        };
      } else {
        throw new Error(response?.error || 'Failed to process payment');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to process payment';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Payment Failed", {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  cancelSubscription: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/cancel/');
      
      if (response && !response.error) {
        toast.success("Subscription Cancelled", {
          description: "Your subscription has been cancelled. Reverted to free plan."
        });
        
        await get().fetchCurrentSubscription();
        await get().fetchSubscriptionStatus();
        await get().fetchPropertyVisibility();
        
        set({ loading: false });
        
        return { success: true, message: response.detail };
      } else {
        throw new Error(response?.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to cancel subscription';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Cancellation Failed", {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  upgradeProperty: async (propertyId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/api/v1/payments/subscription/upgrade-property/', {
        property_id: propertyId
      });
      
      if (response && !response.error) {
        toast.success("Property Updated", {
          description: "Property visibility has been updated"
        });
        
        await get().fetchPropertyVisibility();
        
        set({ loading: false });
        
        return { success: true, message: response.detail };
      } else {
        throw new Error(response?.error || 'Failed to upgrade property');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to upgrade property';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Upgrade Failed", {
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  refreshAllData: async () => {
    try {
      set({ loading: true });
      await Promise.all([
        get().fetchCurrentSubscription(),
        get().fetchSubscriptionStatus(),
        get().fetchPropertyVisibility()
      ]);
    } catch (error) {
      toast.error("Refresh Failed", {
        description: "Failed to refresh subscription data"
      });
    } finally {
      set({ loading: false });
    }
  },

  // CLIENT-SIDE PROPERTY VISIBILITY CHECKS
  canAddProperty: () => {
    const { subscriptionStatus, propertyVisibility } = get();
    
    if (!subscriptionStatus || !propertyVisibility) return false;
    
    // Check subscription limits
    if (subscriptionStatus.propertyLimit === -1) return true; // Unlimited
    
    return propertyVisibility.totalProperties < subscriptionStatus.propertyLimit;
  },

  getPropertyVisibilityStatus: (propertyId) => {
    const { propertyVisibility, subscriptionStatus } = get();
    
    if (!propertyVisibility || !subscriptionStatus) {
      return { canView: false, reason: 'Loading subscription data...' };
    }
    
    const property = propertyVisibility.properties.find(p => p.id === propertyId);
    if (!property) {
      return { canView: false, reason: 'Property not found' };
    }
    
    // Free plan logic
    if (subscriptionStatus.currentPlan.isFreePlan) {
      if (property.isVisible) {
        return { canView: true, reason: 'Visible on free plan' };
      } else {
        return { 
          canView: false, 
          reason: 'Hidden on free plan',
          canSwitch: true,
          switchMessage: 'Switch to make this property visible'
        };
      }
    }
    
    // Paid plan - all properties should be visible
    return { canView: true, reason: 'Visible on paid plan' };
  },

  isFeatureEnabled: (featureName) => {
    const { subscriptionStatus } = get();
    
    if (!subscriptionStatus) return false;
    
    // Check subscription features
    return subscriptionStatus.features[featureName] || false;
  },

  getSubscriptionLimits: () => {
    const { subscriptionStatus, propertyVisibility } = get();
    
    if (!subscriptionStatus) {
      return {
        propertyLimit: 0,
        currentProperties: 0,
        canAddMore: false,
        isFreePlan: true
      };
    }
    
    return {
      propertyLimit: subscriptionStatus.propertyLimit,
      currentProperties: propertyVisibility?.totalProperties || 0,
      canAddMore: get().canAddProperty(),
      isFreePlan: subscriptionStatus.currentPlan.isFreePlan,
      visibleProperties: propertyVisibility?.visibleProperties || 0,
      invisibleProperties: propertyVisibility?.invisibleProperties || 0
    };
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
    return colors[planType] || colors.free;
  },

  getSubscriptionStatusColor: (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  }
}));