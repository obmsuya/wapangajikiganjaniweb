// services/landlord/subscription.js
import api from '@/lib/api/api-client';

const SubscriptionService = {
  getSubscriptionPlans: async () => {
    try {
      const response = await api.get('/api/v1/payments/subscription/plans/');
      return response;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw error;
    }
  },

  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/api/v1/payments/subscription/current/');
      return response;
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      throw error;
    }
  },

  getSubscriptionStatus: async () => {
    try {
      const response = await api.get('/api/v1/payments/subscription/status/');
      return response;
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      throw error;
    }
  },

  getSubscriptionHistory: async () => {
    try {
      const response = await api.get('/api/v1/payments/subscription/history/');
      return response;
    } catch (error) {
      console.error("Error fetching subscription history:", error);
      throw error;
    }
  },

  getPropertyVisibility: async () => {
    try {
      const response = await api.get('/api/v1/payments/subscription/property-visibility/');
      return response;
    } catch (error) {
      console.error("Error fetching property visibility:", error);
      throw error;
    }
  },

  subscribeToplan: async (planId) => {
    try {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      
      const response = await api.post('/api/v1/payments/subscription/subscribe/', {
        plan_id: planId
      });
      return response;
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      throw error;
    }
  },

  cancelSubscription: async () => {
    try {
      const response = await api.post('/api/v1/payments/subscription/cancel/');
      return response;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  },

  upgradeProperty: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.post('/api/v1/payments/subscription/upgrade-property/', {
        property_id: propertyId
      });
      return response;
    } catch (error) {
      console.error("Error upgrading property:", error);
      throw error;
    }
  },

  generateSubscriptionCheckout: async (planId) => {
    try {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      
      const response = await api.post('/api/v1/payments/subscription/checkout/', {
        plan_id: planId
      });
      return response;
    } catch (error) {
      console.error("Error generating subscription checkout:", error);
      throw error;
    }
  },

  processSubscriptionMNOPayment: async (planId, accountNumber, provider) => {
    try {
      const requiredFields = { plan_id: planId, accountNumber, provider };
      
      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          throw new Error(`${key} is required`);
        }
      }
      
      const response = await api.post('/api/v1/payments/subscription/mno/checkout/', {
        plan_id: planId,
        accountNumber,
        provider
      });
      return response;
    } catch (error) {
      console.error("Error processing MNO payment:", error);
      throw error;
    }
  },

  processSubscriptionBankPayment: async (planId, accountNumber, bankName) => {
    try {
      const requiredFields = { plan_id: planId, accountNumber, bankName };
      
      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          throw new Error(`${key} is required`);
        }
      }
      
      const response = await api.post('/api/v1/payments/subscription/bank/checkout/', {
        plan_id: planId,
        accountNumber,
        bankName
      });
      return response;
    } catch (error) {
      console.error("Error processing bank payment:", error);
      throw error;
    }
  },

  formatSubscriptionForDisplay: (subscription) => {
    if (!subscription) return null;
    
    return {
      id: subscription.id,
      planName: subscription.plan?.name || 'Unknown Plan',
      planType: subscription.plan?.plan_type || 'unknown',
      duration: subscription.plan?.duration_display || subscription.plan?.duration,
      price: parseFloat(subscription.plan?.price || 0),
      propertyLimit: subscription.plan?.property_limit || 0,
      status: subscription.status || 'unknown',
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      autoRenew: subscription.auto_renew || false,
      isFreePlan: subscription.is_free_plan || false,
      features: subscription.plan?.features || {},
      daysRemaining: subscription.end_date ? 
        Math.max(0, Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 
        null
    };
  },

  formatPlanForDisplay: (plan) => {
    if (!plan) return null;
    
    return {
      id: plan.id,
      name: plan.name,
      planType: plan.plan_type,
      duration: plan.duration_display || plan.duration,
      price: parseFloat(plan.price || 0),
      propertyLimit: plan.property_limit || 0,
      description: plan.description || '',
      features: plan.features || {},
      isRecommended: plan.plan_type === 'premium',
      savings: plan.duration === 'annual' ? Math.round(plan.price * 0.2) : 0
    };
  },

  getPlanBadgeColor: (planType) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800 border-gray-200',
      basic: 'bg-blue-100 text-blue-800 border-blue-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
      enterprise: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return colors[planType] || colors.basic;
  },

  getStatusBadgeColor: (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return colors[status] || colors.pending;
  },

  calculateSavings: (price, duration) => {
    if (duration === 'annual') {
      const monthlyEquivalent = price / 12;
      const standardMonthlyPrice = monthlyEquivalent * 1.2;
      return Math.round((standardMonthlyPrice * 12) - price);
    }
    return 0;
  },

  isSubscriptionExpiringSoon: (endDate, daysThreshold = 7) => {
    if (!endDate) return false;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    return diffDays <= daysThreshold && diffDays > 0;
  },

  canAccessFeature: (subscription, feature) => {
    if (!subscription || !subscription.features) return false;
    
    const features = subscription.features;
    
    switch (feature) {
      case 'unlimited_properties':
        return features.unlimited_properties || subscription.propertyLimit > 10;
      case 'advanced_analytics':
        return features.advanced_analytics || subscription.planType !== 'free';
      case 'priority_support':
        return features.priority_support || subscription.planType === 'premium';
      case 'tenant_screening':
        return features.tenant_screening || subscription.planType !== 'free';
      default:
        return features[feature] || false;
    }
  }
};

export default SubscriptionService;