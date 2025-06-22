// hooks/landlord/useTenantAssignment.js
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import TenantService from '@/services/landlord/tenant';

/**
 * Hook for managing tenant assignment process
 * @param {string|number} unitId - The unit ID for assignment
 * @returns {Object} Tenant assignment state and management functions
 */
export function useTenantAssignment(unitId = null) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Search/Create, 2: Details, 3: Contract
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    // Tenant info (if creating new)
    full_name: '',
    phone_number: '',
    dob: '',
    alternative_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Contract details
    unit_id: unitId,
    start_date: '',
    end_date: '',
    rent_amount: '',
    deposit_amount: '',
    key_deposit: 0,
    payment_frequency: 'monthly',
    payment_day: 1,
    allowed_occupants: 1,
    actual_occupants: [],
    special_conditions: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Update unit ID when prop changes
  useEffect(() => {
    if (unitId) {
      setAssignmentData(prev => ({ ...prev, unit_id: unitId }));
    }
  }, [unitId]);

  // Search existing tenants
  const searchTenants = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await TenantService.searchTenants(searchTerm);
      const results = response.results || response;
      setSearchResults(results);
      setErrors(prev => ({ ...prev, search: null }));
    } catch (error) {
      console.error("Error searching tenants:", error);
      setErrors(prev => ({ ...prev, search: 'Failed to search tenants' }));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Select existing tenant
  const selectTenant = useCallback((tenant) => {
    setSelectedTenant(tenant);
    setAssignmentData(prev => ({
      ...prev,
      tenant_id: tenant.id,
      full_name: tenant.full_name,
      phone_number: tenant.phone_number,
      dob: tenant.dob || '',
      alternative_phone: tenant.alternative_phone || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      emergency_contact_relationship: tenant.emergency_contact_relationship || ''
    }));
    setCurrentStep(2); // Move to contract details
  }, []);

  // Update assignment data
  const updateAssignmentData = useCallback((updates) => {
    setAssignmentData(prev => ({ ...prev, ...updates }));
    
    // Clear related errors when data is updated
    Object.keys(updates).forEach(key => {
      setErrors(prev => ({ ...prev, [key]: null }));
    });
  }, []);

  // Validate current step
  const validateStep = useCallback((step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Tenant selection/creation
        if (!selectedTenant) {
          if (!assignmentData.full_name?.trim()) {
            newErrors.full_name = 'Full name is required';
          }
          if (!assignmentData.phone_number?.trim()) {
            newErrors.phone_number = 'Phone number is required';
          }
        }
        break;

      case 2: // Contract details
        if (!assignmentData.start_date) {
          newErrors.start_date = 'Start date is required';
        }
        if (!assignmentData.rent_amount || assignmentData.rent_amount <= 0) {
          newErrors.rent_amount = 'Valid rent amount is required';
        }
        if (!assignmentData.deposit_amount || assignmentData.deposit_amount < 0) {
          newErrors.deposit_amount = 'Valid deposit amount is required';
        }
        if (!assignmentData.payment_frequency) {
          newErrors.payment_frequency = 'Payment frequency is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedTenant, assignmentData]);

  // Move to next step
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  }, [currentStep, validateStep]);

  // Move to previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Go to specific step
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  }, []);

  // Submit tenant assignment
  const submitAssignment = useCallback(async () => {
    if (!validateStep(2)) return false;

    setIsAssigning(true);
    setErrors({});

    try {
      // Prepare data for backend
      const submissionData = {
        // Include tenant_id if using existing tenant, otherwise backend will create new one
        ...(selectedTenant && { tenant_id: selectedTenant.id }),
        
        // Tenant details (for new tenant creation)
        full_name: assignmentData.full_name,
        phone_number: assignmentData.phone_number,
        dob: assignmentData.dob || null,
        alternative_phone: assignmentData.alternative_phone || '',
        emergency_contact_name: assignmentData.emergency_contact_name || '',
        emergency_contact_phone: assignmentData.emergency_contact_phone || '',
        emergency_contact_relationship: assignmentData.emergency_contact_relationship || '',
        
        // Contract details
        unit_id: assignmentData.unit_id,
        start_date: assignmentData.start_date,
        end_date: assignmentData.end_date || null,
        rent_amount: parseFloat(assignmentData.rent_amount),
        deposit_amount: parseFloat(assignmentData.deposit_amount),
        key_deposit: parseFloat(assignmentData.key_deposit) || 0,
        payment_frequency: assignmentData.payment_frequency,
        payment_day: parseInt(assignmentData.payment_day) || 1,
        allowed_occupants: parseInt(assignmentData.allowed_occupants) || 1,
        actual_occupants: assignmentData.actual_occupants || [],
        special_conditions: assignmentData.special_conditions || ''
      };

      const response = await TenantService.assignTenantToUnit(submissionData);
      
      setSuccess(true);
      setErrors({});
      
      return response;
    } catch (error) {
      console.error("Error assigning tenant:", error);
      
      // Handle backend validation errors
      if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ general: backendErrors.error || 'Assignment failed' });
        }
      } else {
        setErrors({ general: 'Failed to assign tenant. Please try again.' });
      }
      
      return false;
    } finally {
      setIsAssigning(false);
    }
  }, [validateStep, selectedTenant, assignmentData]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setSelectedTenant(null);
    setSearchResults([]);
    setAssignmentData(prev => ({
      // Keep unit_id but reset everything else
      unit_id: prev.unit_id,
      full_name: '',
      phone_number: '',
      dob: '',
      alternative_phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      start_date: '',
      end_date: '',
      rent_amount: '',
      deposit_amount: '',
      key_deposit: 0,
      payment_frequency: 'monthly',
      payment_day: 1,
      allowed_occupants: 1,
      actual_occupants: [],
      special_conditions: ''
    }));
    setErrors({});
    setSuccess(false);
  }, []);

  // Check if form is valid for current step
  const isStepValid = useMemo(() => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  // Check if we can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedTenant || (assignmentData.full_name && assignmentData.phone_number);
      case 2:
        return assignmentData.start_date && assignmentData.rent_amount && assignmentData.deposit_amount;
      case 3:
        return true; // Review step
      default:
        return false;
    }
  }, [currentStep, selectedTenant, assignmentData]);

  // Generate summary for review
  const assignmentSummary = useMemo(() => {
    return {
      tenant: {
        isExisting: !!selectedTenant,
        name: assignmentData.full_name,
        phone: assignmentData.phone_number,
        emergencyContact: assignmentData.emergency_contact_name
      },
      contract: {
        startDate: assignmentData.start_date,
        endDate: assignmentData.end_date,
        rentAmount: assignmentData.rent_amount,
        depositAmount: assignmentData.deposit_amount,
        keyDeposit: assignmentData.key_deposit,
        paymentFrequency: assignmentData.payment_frequency,
        paymentDay: assignmentData.payment_day,
        allowedOccupants: assignmentData.allowed_occupants
      },
      unit: {
        id: assignmentData.unit_id
      }
    };
  }, [selectedTenant, assignmentData]);

  return {
    // Current state
    currentStep,
    selectedTenant,
    searchResults,
    assignmentData,
    errors,
    success,
    
    // Loading states
    isSearching,
    isAssigning,
    
    // Computed values
    isStepValid,
    canProceed,
    assignmentSummary,
    
    // Actions
    searchTenants,
    selectTenant,
    updateAssignmentData,
    nextStep,
    prevStep,
    goToStep,
    submitAssignment,
    resetForm,
    validateStep
  };
}

/**
 * Hook for managing tenant vacation process
 * @param {string|number} tenantId - The tenant ID for vacation
 * @returns {Object} Tenant vacation state and management functions
 */
export function useTenantVacation(tenantId = null) {
  const [isVacating, setIsVacating] = useState(false);
  const [vacationData, setVacationData] = useState({
    vacate_date: '',
    vacate_reason: '',
    refund_deposit: true,
    final_notes: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Update vacation data
  const updateVacationData = useCallback((updates) => {
    setVacationData(prev => ({ ...prev, ...updates }));
    
    // Clear related errors
    Object.keys(updates).forEach(key => {
      setErrors(prev => ({ ...prev, [key]: null }));
    });
  }, []);

  // Validate vacation form
  const validateVacation = useCallback(() => {
    const newErrors = {};

    if (!vacationData.vacate_date) {
      newErrors.vacate_date = 'Vacation date is required';
    }

    if (!vacationData.vacate_reason?.trim()) {
      newErrors.vacate_reason = 'Vacation reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [vacationData]);

  // Submit vacation request
  const submitVacation = useCallback(async () => {
    if (!tenantId) {
      setErrors({ general: 'Tenant ID is required' });
      return false;
    }

    if (!validateVacation()) return false;

    setIsVacating(true);
    setErrors({});

    try {
      const response = await TenantService.vacateTenant(tenantId, vacationData);
      setSuccess(true);
      return response;
    } catch (error) {
      console.error("Error vacating tenant:", error);
      
      if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ general: backendErrors.error || 'Vacation failed' });
        }
      } else {
        setErrors({ general: 'Failed to process vacation. Please try again.' });
      }
      
      return false;
    } finally {
      setIsVacating(false);
    }
  }, [tenantId, vacationData, validateVacation]);

  // Reset vacation form
  const resetVacationForm = useCallback(() => {
    setVacationData({
      vacate_date: '',
      vacate_reason: '',
      refund_deposit: true,
      final_notes: ''
    });
    setErrors({});
    setSuccess(false);
  }, []);

  // Check if vacation form is valid
  const isVacationValid = useMemo(() => {
    return vacationData.vacate_date && vacationData.vacate_reason?.trim();
  }, [vacationData]);

  return {
    // State
    vacationData,
    errors,
    success,
    isVacating,
    
    // Computed
    isVacationValid,
    
    // Actions
    updateVacationData,
    submitVacation,
    resetVacationForm,
    validateVacation
  };
}

/**
 * Hook for general tenant management operations
 * @returns {Object} Tenant management functions
 */
export function useTenantManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send reminder to tenant
  const sendTenantReminder = useCallback(async (tenantId, reminderData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await TenantService.sendTenantReminder(tenantId, reminderData);
      return response;
    } catch (err) {
      console.error("Error sending reminder:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add note to tenant
  const addTenantNote = useCallback(async (tenantId, noteData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await TenantService.addTenantNote(tenantId, noteData);
      return response;
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get tenant history
  const getTenantHistory = useCallback(async (tenantId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await TenantService.getTenantHistory(tenantId);
      return response;
    } catch (err) {
      console.error("Error fetching tenant history:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    sendTenantReminder,
    addTenantNote,
    getTenantHistory
  };
}