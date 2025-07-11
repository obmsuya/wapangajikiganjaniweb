// hooks/landlord/useTenantAssignment.js
"use client";

import { useState, useCallback } from 'react';
import TenantService from '@/services/landlord/tenant';

/**
 * Hook for tenant assignment operations
 * @returns {Object} Assignment state and functions
 */
export function useTenantAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Assign tenant to unit
   * @param {Object} assignmentData -
   * @returns {Promise<Object>} Assignment result
   */
  const assignTenant = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields based on backend serializer
      const requiredFields = ['unit_id', 'full_name', 'phone_number', 'rent_amount', 'deposit_amount', 'payment_frequency'];
      const missingFields = requiredFields.filter(field => {
        const value = assignmentData[field];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Format data exactly as expected by backend
      const formattedData = {
        // Required fields
        unit_id: parseInt(assignmentData.unit_id),
        full_name: String(assignmentData.full_name).trim(),
        phone_number: String(assignmentData.phone_number).trim(),
        rent_amount: parseFloat(assignmentData.rent_amount),
        deposit_amount: parseFloat(assignmentData.deposit_amount),
        payment_frequency: assignmentData.payment_frequency,
        
        // Optional fields with proper defaults
        start_date: assignmentData.start_date || new Date().toISOString().split('T')[0],
        payment_day: parseInt(assignmentData.payment_day) || 1,
        key_deposit: parseFloat(assignmentData.key_deposit) || 0,
        allowed_occupants: parseInt(assignmentData.allowed_occupants) || 1,
        special_conditions: assignmentData.special_conditions || ''
      };

      console.log('Assigning tenant with formatted data:', formattedData);
      
      const result = await TenantService.assignTenantToUnit(formattedData);
      
      return result;
    } catch (err) {
      console.error('Assignment error:', err);
      let errorMessage = 'Failed to assign tenant';
      
      if (err.response?.data) {
        // Handle Django validation errors
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = [];
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          });
          errorMessage = errorMessages.join('; ');
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear any existing errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    assignTenant,
    clearError
  };
}

/**
 * Hook for tenant management operations (notes, reminders, etc.)
 * @returns {Object} Management state and functions
 */
export function useTenantManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendTenantReminder = useCallback(async (tenantId, reminderData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const result = await TenantService.sendTenantReminder(tenantId, reminderData);
      return result;
    } catch (err) {
      console.error('Reminder error:', err);
      const errorMessage = err.message || 'Failed to send reminder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTenantNote = useCallback(async (tenantId, noteData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const result = await TenantService.addTenantNote(tenantId, noteData);
      return result;
    } catch (err) {
      console.error('Note error:', err);
      const errorMessage = err.message || 'Failed to add note';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    sendTenantReminder,
    addTenantNote,
    clearError
  };
}

/**
 * Hook for tenant vacation operations
 * @param {number} tenantId - Tenant ID
 * @returns {Object} Vacation state and functions
 */
export function useTenantVacation(tenantId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [vacationData, setVacationData] = useState({
    vacate_date: new Date().toISOString().split('T')[0],
    vacate_reason: '',
    refund_deposit: true
  });

  const updateVacationData = useCallback((field, value) => {
    setVacationData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const submitVacation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!vacationData.vacate_date) {
        throw new Error('Vacation date is required');
      }

      const result = await TenantService.vacateTenant(tenantId, vacationData);
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('Vacation error:', err);
      const errorMessage = err.message || 'Failed to vacate tenant';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tenantId, vacationData]);

  const resetVacationForm = useCallback(() => {
    setVacationData({
      vacate_date: new Date().toISOString().split('T')[0],
      vacate_reason: '',
      refund_deposit: true
    });
    setError(null);
    setSuccess(false);
  }, []);

  const isVacationValid = vacationData.vacate_date && vacationData.vacate_reason;

  return {
    vacationData,
    loading,
    error,
    success,
    isVacationValid,
    updateVacationData,
    submitVacation,
    resetVacationForm,
    isVacating: loading
  };
}