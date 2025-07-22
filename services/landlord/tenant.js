// services/landlord/tenant.js - FIXED VERSION
import api from '@/lib/api/api-client';

const TenantService = {

  // Get all tenants for a specific property
  getPropertyTenants: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/property/${propertyId}/tenants/`);
      return response;
    } catch (error) {
      console.error(`Error fetching tenants for property ${propertyId}:`, error);
      throw error;
    }
  },

  // Get tenants for a specific floor
  getFloorTenants: async (propertyId, floorNumber) => {
    try {
      if (!propertyId || !floorNumber) {
        throw new Error("Property ID and floor number are required");
      }
      
      const response = await api.get(`/api/v1/tenants/property/${propertyId}/floor/${floorNumber}/tenants/`);
      return response;
    } catch (error) {
      console.error(`Error fetching tenants for floor ${floorNumber}:`, error);
      throw error;
    }
  },

  getTenantDetails: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/list/${tenantId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching tenant details for ID ${tenantId}:`, error);
      throw error;
    }
  },

  // FIXED: Changed URL to match new backend endpoint
  assignTenantToUnit: async (assignmentData) => {
    try {
      console.log('Assigning tenant with data:', assignmentData);
      const response = await api.post('/api/v1/tenants/assign-tenant/', assignmentData);
      return response;
    } catch (error) {
      console.error('Error assigning tenant:', error);
      throw error;
    }
  },

  vacateTenant: async (tenantId, vacationData = {}) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      console.log('Vacating tenant:', tenantId, vacationData);
      const response = await api.post(`/api/v1/tenants/${tenantId}/vacate/`, vacationData);
      return response;
    } catch (error) {
      console.error('Error vacating tenant:', error);
      throw error;
    }
  },

  checkUnitTenant: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/tenant-unit/${unitId}/`);
      return response;
    } catch (error) {
      console.error(`Error checking unit tenant for unit ${unitId}:`, error);
      throw error;
    }
  },

  getTenantHistory: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/tenants/${tenantId}/occupancy-history/`);
      return response;
    } catch (error) {
      console.error('Error fetching tenant history:', error);
      throw error;
    }
  },

  sendTenantReminder: async (tenantId, reminderData = {}) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.post(`/api/v1/tenants/tenants/${tenantId}/send-reminder/`, reminderData);
      return response;
    } catch (error) {
      console.error('Error sending tenant reminder:', error);
      throw error;
    }
  },

  updateTenant: async (tenantId, tenantData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.put(`/api/v1/tenants/list/${tenantId}/`, tenantData);
      return response;
    } catch (error) {
      console.error(`Error updating tenant ${tenantId}:`, error);
      throw error;
    }
  },

  deleteTenant: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.delete(`/api/v1/tenants/list/${tenantId}/`);
      return response;
    } catch (error) {
      console.error(`Error deleting tenant ${tenantId}:`, error);
      throw error;
    }
  },

  searchTenants: async (searchQuery) => {
    try {
      const response = await api.get(`/api/v1/tenants/list/?search=${encodeURIComponent(searchQuery)}`);
      return response;
    } catch (error) {
      console.error('Error searching tenants:', error);
      throw error;
    }
  },

  getRentDue: async () => {
    try {
      const response = await api.get('/api/v1/tenants/rent/due/');
      return response;
    } catch (error) {
      console.error('Error fetching rent due:', error);
      throw error;
    }
  },

  getLandlordInfo: async () => {
    try {
      const response = await api.get('/api/v1/tenants/landlord/info/');
      return response;
    } catch (error) {
      console.error('Error fetching landlord info:', error);
      throw error;
    }
  },

  getPaymentHistory: async () => {
    try {
      const response = await api.get('/api/v1/tenants/payment/history/');
      return response;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Simple validation with clear error messages
  validateTenantAssignment: (assignmentData) => {
    const errors = [];
    
    if (!assignmentData.unit_id) {
      errors.push('Unit selection is required');
    }
    
    if (!assignmentData.full_name || assignmentData.full_name.trim().length === 0) {
      errors.push('Tenant name is required');
    }
    
    if (!assignmentData.phone_number || assignmentData.phone_number.trim().length === 0) {
      errors.push('Phone number is required');
    }
    
    if (!assignmentData.rent_amount || assignmentData.rent_amount <= 0) {
      errors.push('Rent amount is required');
    }
    
    if (!assignmentData.payment_frequency) {
      errors.push('Payment schedule is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Simple formatting for display
  formatTenantForDisplay: (tenant) => {
    return {
      id: tenant.id,
      name: tenant.tenant?.full_name || tenant.full_name || 'No Name',
      phone: tenant.tenant?.phone_number || tenant.phone_number || 'No Phone',
      status: tenant.tenant?.status || tenant.status || 'active',
      unit_name: tenant.unit_name || 'No Unit',
      floor_name: tenant.floor_name || `Floor ${tenant.floor_number || 1}`,
      rent_amount: tenant.rent_amount || 0,
      payment_frequency: tenant.payment_frequency || 'monthly',
      move_in_date: tenant.move_in_date || tenant.tenant?.move_in_date || null,
      next_payment_date: tenant.next_payment_date || null
    };
  }
};

export default TenantService;