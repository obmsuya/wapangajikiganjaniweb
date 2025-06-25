// services/landlord/tenant.js
import api from '@/lib/api/api-client';

const TenantService = {
  // Get all tenants for the current landlord with filtering - Uses TenantViewSet
  getTenants: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/tenants/tenants/?${queryString}`
        : "/api/v1/tenants/tenants/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      throw error;
    }
  },

  // Get single tenant details - Uses TenantViewSet detail
  getTenantDetails: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      return await api.get(`/api/v1/tenants/tenants/${tenantId}/`);
    } catch (error) {
      console.error(`Error fetching tenant details for ID ${tenantId}:`, error);
      throw error;
    }
  },

  // Assign tenant to unit - Uses your functional decorator endpoint
  assignTenantToUnit: async (assignmentData) => {
    try {
      // Validate required fields based on your TenantAssignmentSerializer
      const requiredFields = ['unit_id', 'rent_amount', 'deposit_amount', 'payment_frequency'];
      const missingFields = requiredFields.filter(field => !assignmentData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log("Assigning tenant with data:", assignmentData);
      // Use the functional decorator endpoint /api/v1/tenants/assign/
      return await api.post("/api/v1/tenants/assign/", assignmentData);
    } catch (error) {
      console.error("Error assigning tenant:", error);
      throw error;
    }
  },

  // Vacate tenant from unit - Uses TenantViewSet custom action
  vacateTenant: async (tenantId, vacationData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      // Use the TenantViewSet custom action for vacating
      return await api.post(`/api/v1/tenants/tenants/${tenantId}/vacate/`, vacationData);
    } catch (error) {
      console.error(`Error vacating tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Get tenant occupancy history - Uses TenantViewSet custom action
  getTenantHistory: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      // Use the TenantViewSet custom action for history
      return await api.get(`/api/v1/tenants/tenants/${tenantId}/history/`);
    } catch (error) {
      console.error(`Error fetching tenant history for ID ${tenantId}:`, error);
      throw error;
    }
  },

  // Add note to tenant - Uses TenantViewSet custom action
  addTenantNote: async (tenantId, noteData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      // Use the TenantViewSet custom action for notes
      return await api.post(`/api/v1/tenants/tenants/${tenantId}/notes/`, noteData);
    } catch (error) {
      console.error(`Error adding note to tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Send reminder SMS to tenant - Uses TenantViewSet custom action
  sendTenantReminder: async (tenantId, reminderData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      // Use the TenantViewSet custom action for reminders
      return await api.post(`/api/v1/tenants/tenants/${tenantId}/send-reminder/`, reminderData);
    } catch (error) {
      console.error(`Error sending reminder to tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Get tenant information by unit ID - Uses your functional decorator endpoint
  getTenantByUnit: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      // Use your functional decorator endpoint for getting tenant by unit
      return await api.get(`/api/v1/tenants/tenant_unit/${unitId}/`);
    } catch (error) {
      console.error(`Error fetching tenant for unit ${unitId}:`, error);
      // Return null instead of throwing to prevent breaking property fetch
      return null;
    }
  },

  // Create new tenant - Uses TenantViewSet create
  createTenant: async (tenantData) => {
    try {
      return await api.post("/api/v1/tenants/tenants/", tenantData);
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw error;
    }
  },

  // Update tenant information - Uses TenantViewSet update
  updateTenant: async (tenantId, updateData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.put(`/api/v1/tenants/tenants/${tenantId}/`, updateData);
    } catch (error) {
      console.error(`Error updating tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Search tenants - Uses TenantViewSet with search filter
  searchTenants: async (searchTerm) => {
    try {
      return await api.get(`/api/v1/tenants/tenants/?search=${encodeURIComponent(searchTerm)}`);
    } catch (error) {
      console.error("Error searching tenants:", error);
      throw error;
    }
  },

  // Get rent due information for tenant (if needed)
  getRentDue: async () => {
    try {
      return await api.get("/api/v1/tenants/rent/due/");
    } catch (error) {
      console.error("Error fetching rent due:", error);
      throw error;
    }
  },

  // Get landlord information for tenant (if needed)
  getLandlordInfo: async () => {
    try {
      return await api.get("/api/v1/tenants/landlord/info/");
    } catch (error) {
      console.error("Error fetching landlord info:", error);
      throw error;
    }
  },

  // Get payment history for tenant (if needed)
  getPaymentHistory: async () => {
    try {
      return await api.get("/api/v1/tenants/payment/history/");
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw error;
    }
  }
};

export default TenantService;