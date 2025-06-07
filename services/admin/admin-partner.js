import api from '@/lib/api/api-client';

const AdminPartnerService = {
  /**
   * Get partner performance statistics for admin dashboard
   * @returns {Promise} Partner performance data
   */
  getPartnerPerformance: async () => {
    try {
      return await api.get("/api/v1/payments/admin/partners/performance/");
    } catch (error) {
      console.error("Error fetching partner performance:", error);
      throw error;
    }
  },

  /**
   * Get paginated list of partners with search and filtering
   * @param {Object} filters - Filtering options (page, limit, search, status)
   * @returns {Promise} Partners list with pagination
   */
  getPartnersList: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/payments/admin/partners/list/?${queryString}`
        : "/api/v1/payments/admin/partners/list/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching partners list:", error);
      throw error;
    }
  },

  /**
   * Get detailed information about a specific partner
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise} Detailed partner information
   */
  getPartnerDetails: async (partnerId) => {
    try {
      if (!partnerId) {
        throw new Error("Partner ID is required");
      }
      return await api.get(`/api/v1/payments/admin/partners/${partnerId}/`);
    } catch (error) {
      console.error(`Error fetching partner details for ID ${partnerId}:`, error);
      throw error;
    }
  },

  /**
   * Suspend a partner account
   * @param {string|number} partnerId - Partner ID
   * @param {string} reason - Suspension reason
   * @returns {Promise} Suspension result
   */
  suspendPartner: async (partnerId, reason) => {
    try {
      if (!partnerId) {
        throw new Error("Partner ID is required");
      }
      if (!reason) {
        throw new Error("Suspension reason is required");
      }
      return await api.post(`/api/v1/payments/admin/partners/${partnerId}/suspend/`, { reason });
    } catch (error) {
      console.error(`Error suspending partner ${partnerId}:`, error);
      throw error;
    }
  },

  /**
   * Activate a suspended partner account
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise} Activation result
   */
  activatePartner: async (partnerId) => {
    try {
      if (!partnerId) {
        throw new Error("Partner ID is required");
      }
      return await api.post(`/api/v1/payments/admin/partners/${partnerId}/activate/`);
    } catch (error) {
      console.error(`Error activating partner ${partnerId}:`, error);
      throw error;
    }
  },

  /**
   * Get all commission rates for subscription plans
   * @returns {Promise} Commission rates data
   */
  getCommissionRates: async () => {
    try {
      return await api.get("/api/v1/payments/admin/partners/commission-rates/");
    } catch (error) {
      console.error("Error fetching commission rates:", error);
      throw error;
    }
  },

  /**
   * Update commission rates for subscription plans
   * @param {Array} commissionRates - Array of commission rate objects
   * @returns {Promise} Update result
   */
  updateCommissionRates: async (commissionRates) => {
    try {
      if (!Array.isArray(commissionRates)) {
        throw new Error("Commission rates must be an array");
      }
      return await api.put("/api/v1/payments/admin/partners/commission-rates/", {
        commission_rates: commissionRates
      });
    } catch (error) {
      console.error("Error updating commission rates:", error);
      throw error;
    }
  },

  /**
   * Check admin permissions for partner management
   * @returns {Promise<boolean>} Always returns true (placeholder for future implementation)
   */
  checkAdminPermissions: async () => {
    return true; // Simply return true to skip the authorization check
  }
};

export default AdminPartnerService;