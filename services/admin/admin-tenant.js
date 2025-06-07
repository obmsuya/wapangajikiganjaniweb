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
      console.error("Error fetching tenants list:", error);
      throw error;
    }
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