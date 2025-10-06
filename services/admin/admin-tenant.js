import api from '@/lib/api/api-client';

const AdminTenantService = {
  // Get dashboard summary statistics
  getDashboardSummary: async () => {
    try {
      return await api.get("/api/v1/svg_properties/admin/dashboard/summary/");
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  },

  // Get list of all properties with pagination
  getPropertiesList: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/svg_properties/admin/properties/?${queryString}`
        : "/api/v1/svg_properties/admin/properties/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching properties list:", error);
      throw error;
    }
  },

  // Get list of all tenants with pagination
  getTenantsList: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/svg_properties/admin/tenants/?${queryString}`
        : "/api/v1/svg_properties/admin/tenants/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching tenants list:", error.message);
      throw error;
    }
  },

  /**
   * Hard-delete a tenant (admin only)
   * @param {number} tenantId
   * @returns {Promise<void>}  204 = success
   */
  deleteTenant: async (tenantId) => {
    try {
      return await api.delete(`/api/v1/tenants/admin/${tenantId}/`);
    } catch (error) {
      console.error(`Error deleting tenant ${tenantId}:`, error.message);
      throw error;
    }
  },

    /**
   * Hard-delete a property (admin only)
   * @param {number} propertyId
   * @returns {Promise<void>}  204 = success
   */
    deleteProperty: async (propertyId) => {
      return api.delete(`/api/v1/svg_properties/admin/properties/${propertyId}/`);
    },

  // Get detailed property information
  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.get(`/api/v1/svg_properties/admin/properties/details/?property_id=${propertyId}`);
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },
};

export default AdminTenantService;