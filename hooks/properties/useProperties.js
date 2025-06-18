// hooks/properties/useProperties.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import PropertyService from '@/services/landlord/property';

/**
 * Hook for property creation multi-step form
 * @returns {Object} Form state and management functions
 */
export function usePropertyCreation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state matching mobile implementation
  const [propertyData, setPropertyData] = useState({
    // Step 1: Basic Info
    name: '',
    location: '',
    address: '',
    prop_image: null,
    
    // Step 2: Property Type
    category: 'Single Floor',
    total_floors: 1,
    
    // Step 3: Floor Plans - THIS IS THE KEY STATE
    floors: {},
    
    // Step 4: Unit Details
    units: [],
    
    // Additional fields
    owner: '',
    total_area: 300,
    total_units: 0,
    block: 'A'
  });

  const updatePropertyData = useCallback((updates) => {
    setPropertyData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const updateFloorData = useCallback((floorNumber, floorData) => {
    console.log('Updating floor data:', floorNumber, floorData); // Debug log
    setPropertyData(prev => ({
      ...prev,
      floors: {
        ...prev.floors,
        [floorNumber]: floorData
      }
    }));
  }, []);

  const addUnitData = useCallback((unitData) => {
    setPropertyData(prev => {
      // Remove existing unit with same ID and add updated one
      const filteredUnits = prev.units.filter(unit => unit.id !== unitData.id);
      return {
        ...prev,
        units: [...filteredUnits, unitData]
      };
    });
  }, []);

  const getTotalUnits = useCallback(() => {
    return Object.values(propertyData.floors).reduce(
      (total, floor) => total + (floor.units_total || 0), 
      0
    );
  }, [propertyData.floors]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const saveProperty = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Format data to match backend expectations
      const formattedData = {
        owner: propertyData.owner,
        name: propertyData.name,
        category: propertyData.category,
        location: propertyData.location,
        address: propertyData.address,
        total_units: getTotalUnits(),
        total_floors: propertyData.total_floors,
        total_area: propertyData.total_area,
        block: propertyData.block,
        prop_image: propertyData.prop_image?.base64 || '',
        
        floors: Object.keys(propertyData.floors).map((floorKey) => {
          const floor = parseInt(floorKey);
          const floorPlan = propertyData.floors[floor];
          const floorUnits = propertyData.units.filter(unit => unit.floor_no === floor);
          
          return {
            floor: {
              floor_no: floor - 1, // 0-based indexing
              units_ids: floorPlan.units_ids || [],
              units_total: floorPlan.units_total,
              layout_data: floorPlan.layout_data,
              area: floorPlan.area || 300,
              units: floorUnits.map(unit => ({
                utilities: {
                  electricity: unit.utilities?.electricity?.toString() || 'false',
                  water: unit.utilities?.water?.toString() || 'false',
                  wifi: unit.utilities?.wifi?.toString() || 'false',
                },
                svg_id: unit.svg_id,
                svg_geom: unit.svg_geom || `<rect width="40" height="40" x="0" y="0" id="${unit.svg_id}" fill="green" stroke="gray" stroke-width="2" />`,
                block: unit.block || 'A',
                floor_number: floor - 1,
                unit_name: unit.unit_name || `A${unit.svg_id}`,
                area_sqm: unit.area_sqm || 150,
                bedrooms: unit.bedrooms || 1,
                status: unit.status || 'vacant',
                rent_amount: unit.rent_amount || 0,
                payment_freq: unit.payment_freq || 'monthly',
                meter_number: unit.meter_number || '',
                included_in_rent: unit.included_in_rent?.toString() || 'false',
                cost_allocation: unit.cost_allocation || 'landlord',
                notes: unit.notes || ''
              }))
            }
          };
        })
      };

      const response = await PropertyService.createProperty(formattedData);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to save property');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [propertyData, getTotalUnits]);

  const resetForm = useCallback(() => {
    setPropertyData({
      name: '',
      location: '',
      address: '',
      prop_image: null,
      category: 'Single Floor',
      total_floors: 1,
      floors: {},
      units: [],
      owner: '',
      total_area: 300,
      total_units: 0,
      block: 'A'
    });
    setCurrentStep(1);
    setError(null);
  }, []);

  // Debug: Log floor data changes
  useEffect(() => {
    console.log('Property floors updated:', propertyData.floors);
  }, [propertyData.floors]);

  return {
    // State
    currentStep,
    propertyData,
    floorData: propertyData.floors, // Expose floor data directly
    isLoading,
    error,
    
    // Actions
    updatePropertyData,
    updateFloorData,
    addUnitData,
    nextStep,
    prevStep,
    goToStep,
    saveProperty,
    resetForm,
    
    // Computed
    totalUnits: getTotalUnits(),
    maxSteps: 5
  };
}

/**
 * Hook for floor plan management - INTEGRATED WITH MAIN PROPERTY STATE
 * @param {Function} updateFloorData - Function to update main property state
 * @param {Object} existingFloorData - Existing floor data from main state
 * @returns {Object} Floor plan state and management functions
 */
export function useFloorPlan(updateFloorData, existingFloorData = {}) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(1);

  // Load existing floor data when floor changes
  useEffect(() => {
    const floorData = existingFloorData[currentFloor];
    if (floorData && floorData.units_ids) {
      setSelectedUnits(floorData.units_ids);
    } else {
      setSelectedUnits([]);
    }
  }, [currentFloor, existingFloorData]);

  const addUnit = useCallback((unitId) => {
    setSelectedUnits(prev => [...prev, unitId]);
  }, []);

  const removeUnit = useCallback((unitId) => {
    setSelectedUnits(prev => prev.filter(id => id !== unitId));
  }, []);

  const toggleUnit = useCallback((unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUnits([]);
  }, []);

  const saveFloorPlan = useCallback((floor, data) => {
    const floorPlanData = {
      ...data,
      units_ids: selectedUnits,
      units_total: selectedUnits.length
    };
    
    console.log('Saving floor plan:', floor, floorPlanData); // Debug log
    
    // Update the main property state immediately
    if (updateFloorData) {
      updateFloorData(floor, floorPlanData);
    }
  }, [selectedUnits, updateFloorData]);

  const generateSVGString = useCallback((units) => {
    const GRID_SIZE = 8;
    const CELL_SIZE = 40;
    const svgRects = units.map(unitIndex => {
      const x = (unitIndex % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(unitIndex / GRID_SIZE) * CELL_SIZE;
      return `<rect width="${CELL_SIZE}" height="${CELL_SIZE}" x="${x}" y="${y}" id="unit-${unitIndex}" fill="#2B4B80" stroke="white" stroke-width="2" />`;
    }).join('');
    return `<svg width="${GRID_SIZE * CELL_SIZE}" height="${GRID_SIZE * CELL_SIZE}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
  }, []);

  return {
    selectedUnits,
    currentFloor,
    floorData: existingFloorData, // Return the actual floor data from main state
    setCurrentFloor,
    addUnit,
    removeUnit,
    toggleUnit,
    clearSelection,
    saveFloorPlan,
    generateSVGString
  };
}

/**
 * Hook for fetching properties list with pagination and filtering
 * @param {Object} initialFilters - Initial filters for properties
 * @returns {Object} The properties data, loading state, error, and helper functions
 */
export function usePropertiesList(initialFilters = {}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PropertyService.getProperties(filters);
      setProperties(response.results || response);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const refreshProperties = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    filters,
    updateFilters,
    refreshProperties
  };
}

/**
 * Hook for fetching property details
 * @param {string|number} propertyId - The ID of the property
 * @returns {Object} The property details, loading state, error, and refresh function
 */
export function usePropertyDetails(propertyId) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      const response = await PropertyService.getPropertyDetails(propertyId);
      setProperty(response);
      setError(null);
    } catch (err) {
      console.error(`Error fetching property details for ID ${propertyId}:`, err);
      setError(err);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const refreshProperty = useCallback(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, propertyId]);

  return {
    property,
    loading,
    error,
    refreshProperty
  };
}