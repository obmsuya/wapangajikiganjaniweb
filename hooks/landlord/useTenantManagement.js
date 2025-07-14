// hooks/landlord/useTenantManagement.js
"use client";

import { useState, useCallback, useEffect } from 'react';
import TenantService from '@/services/landlord/tenant';

/**
 * Hook for fetching all tenants for a specific property (API-based)
 * This is the main hook for PropertyTenantsTab
 */
export function usePropertyTenants(property) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(async () => {
    if (!property?.id) {
      console.log('usePropertyTenants - No property ID provided');
      setTenants([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('usePropertyTenants - Fetching tenants for property:', property.id);
      
      const response = await TenantService.getPropertyTenants(property.id);
      
      console.log('usePropertyTenants - API response:', response);
      
      if (response && response.tenants && Array.isArray(response.tenants)) {
        setTenants(response.tenants);
        console.log('usePropertyTenants - Set tenants:', response.tenants);
      } else {
        console.log('usePropertyTenants - No tenants in response or invalid format');
        setTenants([]);
      }
      
    } catch (err) {
      console.error('usePropertyTenants - Error fetching tenants:', err);
      setError(err.message || 'Failed to fetch tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [property?.id]);

  useEffect(() => {
    console.log('usePropertyTenants - useEffect triggered with property:', property?.id);
    fetchTenants();
  }, [fetchTenants]);

  const refreshTenants = useCallback(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    refreshTenants
  };
}

/**
 * Hook for fetching tenants for a specific floor
 */
export function useFloorTenants(property, floorNumber) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFloorTenants = useCallback(async () => {
    if (!property?.id || !floorNumber) {
      setTenants([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await TenantService.getFloorTenants(property.id, floorNumber);
      
      if (response && response.tenants && Array.isArray(response.tenants)) {
        setTenants(response.tenants);
      } else {
        setTenants([]);
      }
      
    } catch (err) {
      console.error('Error fetching floor tenants:', err);
      setError(err.message || 'Failed to fetch floor tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [property?.id, floorNumber]);

  useEffect(() => {
    fetchFloorTenants();
  }, [fetchFloorTenants]);

  const refreshTenants = useCallback(() => {
    fetchFloorTenants();
  }, [fetchFloorTenants]);

  return {
    tenants,
    loading,
    error,
    refreshTenants
  };
}

/**
 * Hook for tenant assignment operations
 */
export function useTenantAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTenants = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await TenantService.searchTenants(searchTerm);
      
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results.results && Array.isArray(results.results)) {
        setSearchResults(results.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching tenants:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const assignTenant = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);

      const requiredFields = ['unit_id', 'rent_amount', 'deposit_amount', 'payment_frequency'];
      const missingFields = requiredFields.filter(field => !assignmentData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const formattedData = {
        unit_id: assignmentData.unit_id,
        tenant_id: assignmentData.tenant_id || null,
        full_name: assignmentData.full_name || '',
        phone_number: assignmentData.phone_number || '',
        dob: assignmentData.dob || null,
        emergency_contact_name: assignmentData.emergency_contact_name || '',
        emergency_contact_phone: assignmentData.emergency_contact_phone || '',
        emergency_contact_relationship: assignmentData.emergency_contact_relationship || '',
        start_date: assignmentData.start_date || new Date().toISOString().split('T')[0],
        end_date: assignmentData.end_date || null,
        rent_amount: parseFloat(assignmentData.rent_amount),
        deposit_amount: parseFloat(assignmentData.deposit_amount),
        key_deposit: parseFloat(assignmentData.key_deposit || 0),
        payment_frequency: assignmentData.payment_frequency,
        payment_day: parseInt(assignmentData.payment_day || 1),
        allowed_occupants: parseInt(assignmentData.allowed_occupants || 1),
        special_conditions: assignmentData.special_conditions || ''
      };

      console.log('Assigning tenant with formatted data:', formattedData);
      const result = await TenantService.assignTenantToUnit(formattedData);
      
      return result;
    } catch (err) {
      console.error('Error assigning tenant:', err);
      setError(err.message || 'Failed to assign tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    searchResults,
    searchLoading,
    searchTenants,
    assignTenant,
    clearSearch,
    clearError
  };
}

/**
 * Hook for tenant vacation operations
 */
export function useTenantVacation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vacateTenant = useCallback(async (tenantId, vacationData) => {
    try {
      setLoading(true);
      setError(null);

      const formattedData = {
        vacate_date: vacationData.vacate_date,
        vacate_reason: vacationData.vacate_reason || '',
        refund_deposit: vacationData.refund_deposit !== false
      };

      console.log('Vacating tenant:', tenantId, formattedData);
      const result = await TenantService.vacateTenant(tenantId, formattedData);
      
      return result;
    } catch (err) {
      console.error('Error vacating tenant:', err);
      setError(err.message || 'Failed to vacate tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    vacateTenant,
    clearError
  };
}

/**
 * Hook for general tenant management operations
 */
export function useTenantManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateTenant = useCallback(async (tenantId, tenantData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.updateTenant(tenantId, tenantData);
      return result;
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError(err.message || 'Failed to update tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTenantReminder = useCallback(async (tenantId, reminderData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.sendTenantReminder(tenantId, reminderData);
      return result;
    } catch (err) {
      console.error('Error sending reminder:', err);
      setError(err.message || 'Failed to send reminder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTenantNote = useCallback(async (tenantId, noteData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.addTenantNote(tenantId, noteData);
      return result;
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err.message || 'Failed to add note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantHistory = useCallback(async (tenantId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.getTenantHistory(tenantId);
      return result;
    } catch (err) {
      console.error('Error fetching tenant history:', err);
      setError(err.message || 'Failed to fetch tenant history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    updateTenant,
    sendTenantReminder,
    addTenantNote,
    getTenantHistory,
    clearError
  };
}

/**
 * Hook for general tenant listing with pagination
 */
export function useTenantsList(filters = {}) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TenantService.getTenants({ 
        ...filters, 
        page: pagination.page,
        limit: pagination.limit 
      });

      if (Array.isArray(response)) {
        setTenants(response);
        setPagination(prev => ({ ...prev, total: response.length }));
      } else if (response.results && Array.isArray(response.results)) {
        setTenants(response.results);
        setPagination(prev => ({ 
          ...prev, 
          total: response.count || response.total || response.results.length 
        }));
      } else {
        setTenants([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err.message || 'Failed to fetch tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const updateFilters = useCallback((newFilters) => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const updatePagination = useCallback((newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    pagination,
    updateFilters,
    updatePagination,
    refreshTenants: fetchTenants
  };
}