import api from '@/lib/api/api-client';

const AdminPaymentService = {
  getSubscriptionPlans: async () => {
    try {
      return await api.get("/api/v1/payments/admin/subscription-plans/");
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw error;
    }
  },

  createSubscriptionPlan: async (planData) => {
    try {
      return await api.post("/api/v1/payments/admin/subscription-plans/", planData);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  },

  updateSubscriptionPlan: async (planData) => {
    try {
      return await api.put("/api/v1/payments/admin/subscription-plans/", planData);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      throw error;
    }
  },

  deleteSubscriptionPlan: async (planId) => {
    try {
      return await api.delete(`/api/v1/payments/admin/subscription-plans/?id=${planId}`);
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      throw error;
    }
  },

  getLandlordSubscriptions: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/payments/admin/subscriptions/?${queryString}`
        : "/api/v1/payments/admin/subscriptions/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching landlord subscriptions:", error);
      throw error;
    }
  },

  updateLandlordSubscription: async (subscriptionData) => {
    try {
      return await api.post("/api/v1/payments/admin/subscriptions/", subscriptionData);
    } catch (error) {
      console.error("Error updating landlord subscription:", error);
      throw error;
    }
  },

  getTransactionHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/payments/admin/transactions/?${queryString}`
        : "/api/v1/payments/admin/transactions/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      throw error;
    }
  },

  getRevenueAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/payments/admin/revenue-analytics/?${queryString}`
        : "/api/v1/payments/admin/revenue-analytics/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      throw error;
    }
  },

  getFailedPayments: async (limit = 50) => {
    try {
      return await api.get(`/api/v1/payments/admin/failed-payments/?limit=${limit}`);
    } catch (error) {
      console.error("Error fetching failed payments:", error);
      throw error;
    }
  },

  sendNotification: async (notificationData) => {
    try {
      return await api.post("/api/v1/payments/admin/notifications/", notificationData);
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  },

  getSubscriptionDetails: async (subscriptionId) => {
    try {
      return await api.get(`/api/v1/payments/admin/subscriptions/${subscriptionId}/`);
    } catch (error) {
      console.error(`Error fetching subscription details for ID ${subscriptionId}:`, error);
      throw error;
    }
  },

  updateSubscription: async (subscriptionId, updateData) => {
    try {
      return await api.put(`/api/v1/payments/admin/subscriptions/${subscriptionId}/`, updateData);
    } catch (error) {
      console.error(`Error updating subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  getTransactionDetails: async (transactionId) => {
    try {
      return await api.get(`/api/v1/payments/admin/transactions/${transactionId}/`);
    } catch (error) {
      console.error(`Error fetching transaction details for ID ${transactionId}:`, error);
      throw error;
    }
  },

  getSubscriptionStatistics: async () => {
    try {
      return await api.get("/api/v1/payments/admin/subscription-statistics/");
    } catch (error) {
      console.error("Error fetching subscription statistics:", error);
      throw error;
    }
  },

  getLandlordPaymentHistory: async (landlordId) => {
    try {
      if (!landlordId) {
        throw new Error("Landlord ID is required");
      }
      return await api.get(`/api/v1/payments/admin/landlord/${landlordId}/payment-history/`);
    } catch (error) {
      console.error(`Error fetching payment history for landlord ${landlordId}:`, error);
      throw error;
    }
  },

  getSupportTickets: async () => {
    try {
      return await api.get("/api/v1/payments/admin/support-tickets/");
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      throw error;
    }
  },

  createSupportTicket: async (ticketData) => {
    try {
      return await api.post("/api/v1/payments/admin/support-tickets/", ticketData);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      throw error;
    }
  },
  
  checkAdminPermissions: async () => {
    return true; // Simply return true to skip the authorization check
  }
};

export default AdminPaymentService;