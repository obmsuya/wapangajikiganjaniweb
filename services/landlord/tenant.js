// services/landlord/tenant.js
import api from '@/lib/api/api-client';

const TenantService = {
  getTenants: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/api/v1/tenants/tenant/?${queryString}` : '/api/v1/tenants/tenant/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching tenants:", error);
      throw error;
    }
  },

  getTenantDetails: async (tenantId) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/tenant/${tenantId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching tenant details for ID ${tenantId}:`, error);
      throw error;
    }
  },

  assignTenantToUnit: async (assignmentData) => {
    try {
      console.log('Assigning tenant with data:', assignmentData);
      const response = await api.post('/api/v1/tenants/assign_tenant/', assignmentData);
      return response;
    } catch (error) {
      console.error('Error assigning tenant:', error);
      throw error;
    }
  },

  vacateTenant: async (tenantId, vacationData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      console.log('Vacating tenant:', tenantId, vacationData);
      const response = await api.post(`/api/v1/tenants/tenant/${tenantId}/vacate_tenant/`, vacationData);
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
      
      const response = await api.get(`/api/v1/tenants/get_tenant_unit/${unitId}/`);
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
      
      const response = await api.get(`/api/v1/tenants/tenant/${tenantId}/occupancy_history/`);
      return response;
    } catch (error) {
      console.error('Error fetching tenant history:', error);
      throw error;
    }
  },

  addTenantNote: async (tenantId, noteData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.post(`/api/v1/tenants/tenant/${tenantId}/add_note/`, noteData);
      return response;
    } catch (error) {
      console.error('Error adding tenant note:', error);
      throw error;
    }
  },

  sendTenantReminder: async (tenantId, reminderData) => {
    try {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      const response = await api.post(`/api/v1/tenants/tenant/${tenantId}/send_reminder/`, reminderData);
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
      
      const response = await api.put(`/api/v1/tenants/tenant/${tenantId}/`, tenantData);
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
      
      const response = await api.delete(`/api/v1/tenants/tenant/${tenantId}/`);
      return response;
    } catch (error) {
      console.error(`Error deleting tenant ${tenantId}:`, error);
      throw error;
    }
  },

  searchTenants: async (searchQuery) => {
    try {
      const response = await api.get(`/api/v1/tenants/tenant/?search=${encodeURIComponent(searchQuery)}`);
      return response;
    } catch (error) {
      console.error('Error searching tenants:', error);
      throw error;
    }
  },

  getTenantsForProperty: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/tenants/tenant/?property=${propertyId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching tenants for property ${propertyId}:`, error);
      throw error;
    }
  },

  validateTenantAssignment: (assignmentData) => {
    const errors = [];
    
    if (!assignmentData.unit_id) {
      errors.push('Unit ID is required');
    }
    
    if (!assignmentData.full_name || assignmentData.full_name.trim().length === 0) {
      errors.push('Tenant full name is required');
    }
    
    if (!assignmentData.phone_number || assignmentData.phone_number.trim().length === 0) {
      errors.push('Phone number is required');
    }
    
    if (!assignmentData.rent_amount || assignmentData.rent_amount <= 0) {
      errors.push('Valid rent amount is required');
    }
    
    if (!assignmentData.deposit_amount || assignmentData.deposit_amount < 0) {
      errors.push('Valid deposit amount is required');
    }
    
    if (!assignmentData.start_date) {
      errors.push('Start date is required');
    }
    
    if (!assignmentData.payment_frequency) {
      errors.push('Payment frequency is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  formatTenantForDisplay: (tenant) => {
    return {
      id: tenant.id,
      name: tenant.full_name || 'Unnamed Tenant',
      phone: tenant.phone_number || 'No phone',
      email: tenant.email || 'No email',
      status: tenant.status || 'unknown',
      emergency_contact: {
        name: tenant.emergency_contact_name || '',
        phone: tenant.emergency_contact_phone || '',
        relationship: tenant.emergency_contact_relationship || ''
      },
      current_unit: tenant.current_unit || null,
      move_in_date: tenant.move_in_date || null,
      created_at: tenant.created_at || null
    };
  },

  calculateRentDue: (occupancy) => {
    if (!occupancy) return null;
    
    const today = new Date();
    const startDate = new Date(occupancy.start_date);
    const paymentDay = occupancy.payment_day || 1;
    const frequency = occupancy.payment_frequency || 'monthly';
    
    let nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
    
    if (nextPaymentDate <= today) {
      if (frequency === 'monthly') {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
      } else if (frequency === 'biannual') {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
      } else if (frequency === 'annual') {
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
      }
    }
    
    const daysUntilDue = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      amount: occupancy.rent_amount,
      due_date: nextPaymentDate,
      days_until_due: daysUntilDue,
      is_overdue: daysUntilDue < 0,
      payment_frequency: frequency
    };
  }
};

export default TenantService;