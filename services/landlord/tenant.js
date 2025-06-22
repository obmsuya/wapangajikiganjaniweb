// services/landlord/tenant.js
import api from '@/lib/api/api-client';

const TenantService = {
  // Get all tenants for the current landlord with filtering
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
        ? `/api/v1/tenants/?${queryString}`
        : "/api/v1/tenants/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      throw error;
    }
  },

  // Get single tenant details
  getTenantDetails: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      return await api.get(`/api/v1/tenants/${tenantId}/`);
    } catch (error) {
      console.error(`Error fetching tenant details for ID ${tenantId}:`, error);
      throw error;
    }
  },

  // Assign tenant to unit - matches your backend endpoint
  assignTenantToUnit: async (assignmentData) => {
    try {
      // Validate required fields based on your backend serializer
      const requiredFields = ['unit_id', 'rent_amount', 'deposit_amount', 'payment_frequency'];
      const missingFields = requiredFields.filter(field => !assignmentData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      return await api.post("/api/v1/tenants/assign_tenant/", assignmentData);
    } catch (error) {
      console.error("Error assigning tenant:", error);
      throw error;
    }
  },

  // Vacate tenant from unit
  vacateTenant: async (tenantId, vacationData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.post(`/api/v1/tenants/${tenantId}/vacate_tenant/`, vacationData);
    } catch (error) {
      console.error(`Error vacating tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Get tenant occupancy history
  getTenantHistory: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.get(`/api/v1/tenants/${tenantId}/occupancy_history/`);
    } catch (error) {
      console.error(`Error fetching tenant history for ID ${tenantId}:`, error);
      throw error;
    }
  },

  // Add note to tenant
  addTenantNote: async (tenantId, noteData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.post(`/api/v1/tenants/${tenantId}/add_note/`, noteData);
    } catch (error) {
      console.error(`Error adding note to tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Send reminder SMS to tenant
  sendTenantReminder: async (tenantId, reminderData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.post(`/api/v1/tenants/${tenantId}/send_reminder/`, reminderData);
    } catch (error) {
      console.error(`Error sending reminder to tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Get tenant information by unit ID
  getTenantByUnit: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      return await api.get(`/api/v1/tenants/get_tenant_unit/${unitId}/`);
    } catch (error) {
      console.error(`Error fetching tenant for unit ${unitId}:`, error);
      throw error;
    }
  },

  // Create new tenant (for assignment process)
  createTenant: async (tenantData) => {
    try {
      return await api.post("/api/v1/tenants/", tenantData);
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw error;
    }
  },

  // Update tenant information
  updateTenant: async (tenantId, updateData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      return await api.put(`/api/v1/tenants/${tenantId}/`, updateData);
    } catch (error) {
      console.error(`Error updating tenant ${tenantId}:`, error);
      throw error;
    }
  },

  // Search tenants (used in assignment flow)
  searchTenants: async (searchTerm) => {
    try {
      return await api.get(`/api/v1/tenants/?search=${encodeURIComponent(searchTerm)}`);
    } catch (error) {
      console.error("Error searching tenants:", error);
      throw error;
    }
  }
};

export default TenantService;