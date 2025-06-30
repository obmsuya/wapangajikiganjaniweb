// hooks/properties/useProperties.js
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import PropertyService from '@/services/landlord/property';
import TenantService from '@/services/landlord/tenant';

/**
 * Hook for property creation multi-step form
 * @returns {Object} Form state and management functions
 */
export function usePropertyCreation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Prevent duplicate submissions
  const saveInProgress = useRef(false);
  
  // Form data state matching your backend structure
  const [propertyData, setPropertyData] = useState({
    // Step 1: Basic Info
    name: '',
    location: '',
    address: '',
    prop_image: null,
    
    // Step 2: Property Type
    category: 'Single Floor',
    total_floors: 1,
    
    // Step 3: Floor Plans
    floors: {},
    
    // Step 4: Unit Details
    units: {},
    
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
    console.log('Updating floor data:', floorNumber, floorData);
    setPropertyData(prev => ({
      ...prev,
      floors: {
        ...prev.floors,
        [floorNumber]: floorData
      }
    }));
  }, []);

  const addUnitData = useCallback((unitData) => {
    console.log('Adding/updating unit data:', unitData);
    setPropertyData(prev => ({
      ...prev,
      units: {
        ...prev.units,
        [unitData.id]: unitData
      }
    }));
  }, []);

  const getConfiguredUnits = useCallback(() => {
    return Object.values(propertyData.units);
  }, [propertyData.units]);

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
    // CRITICAL: Prevent duplicate submissions
    if (saveInProgress.current || isLoading) {
      console.log('Save already in progress, preventing duplicate submission');
      return;
    }

    saveInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const configuredUnits = getConfiguredUnits();
      
      // Format data to match your backend's expected structure
      const formattedData = {
        owner: propertyData.owner,
        name: propertyData.name,
        category: propertyData.category,
        location: propertyData.location,
        address: propertyData.address,
        total_units: getTotalUnits(),
        total_floors: propertyData.total_floors,
        total_area: propertyData.total_area,
        prop_image: propertyData.prop_image?.base64 || propertyData.prop_image || '',
        
        // Format floors correctly for your backend (with 'floor' wrapper)
        floors: Object.keys(propertyData.floors).map((floorKey) => {
          const floor = parseInt(floorKey);
          const floorPlan = propertyData.floors[floor];
          const floorUnits = configuredUnits.filter(unit => unit.floor_no === floor);
          
          // Return object with 'floor' key as your backend expects
          return {
            floor: {
              floor_no: floor - 1, // 0-based indexing as your backend expects
              units_total: floorPlan.units_total || floorUnits.length,
              layout_type: floorPlan.layout_type || 'rectangular',
              creation_method: floorPlan.creation_method || 'manual',
              layout_data: floorPlan.layout_data || '',
              units: floorUnits.map(unit => ({
                utilities: unit.utilities || {
                  electricity: false,
                  water: false,
                  wifi: false
                },
                svg_id: unit.svg_id,
                svg_geom: unit.svg_geom || `<rect width="40" height="40" x="0" y="0" id="${unit.svg_id}" fill="green" stroke="gray" stroke-width="2" />`,
                floor_number: floor - 1,
                unit_name: unit.unit_name || `A${unit.svg_id}`,
                area_sqm: unit.area_sqm || 150,
                bedrooms: unit.bedrooms || 1,
                status: unit.status || 'vacant',
                rent_amount: unit.rent_amount || 0,
                payment_freq: unit.payment_freq || 'monthly',
                meter_number: unit.meter_number || '',
                notes: unit.notes || ''
              }))
            }
          };
        })
      };

      console.log('Saving property with formatted data:', formattedData);
      const response = await PropertyService.createProperty(formattedData);
      console.log('Property saved successfully:', response);
      
      return response;
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.message || 'Failed to save property');
      throw err;
    } finally {
      setIsLoading(false);
      saveInProgress.current = false;
    }
  }, [propertyData, getTotalUnits, getConfiguredUnits, isLoading]);

  const resetForm = useCallback(() => {
    setPropertyData({
      name: '',
      location: '',
      address: '',
      prop_image: null,
      category: 'Single Floor',
      total_floors: 1,
      floors: {},
      units: {},
      owner: '',
      total_area: 300,
      total_units: 0,
      block: 'A'
    });
    setCurrentStep(1);
    setError(null);
    saveInProgress.current = false;
  }, []);

  return {
    // State
    currentStep,
    propertyData,
    floorData: propertyData.floors,
    configuredUnits: getConfiguredUnits(),
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
 * Hook for fetching properties list with pagination and filtering
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
      console.log('Fetched properties:', response);
      
      // Handle different response formats from your backend
      if (Array.isArray(response)) {
        setProperties(response);
      } else if (response.results && Array.isArray(response.results)) {
        setProperties(response.results);
      } else {
        setProperties([]);
      }
      
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
 * Hook for fetching property details with tenant information
 */
export function usePropertyDetails(propertyId) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      console.log(`Fetching property details for ID: ${propertyId}`);
      
      // Fetch property details
      const response = await PropertyService.getPropertyDetails(propertyId);
      console.log('Property details response:', response);
      
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

/**
 * Enhanced Hook for floor plan management with proper layout preview and storage
 */
export function useFloorPlan(updateFloorData, existingFloorData = {}) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(1);

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

  // Enhanced SVG generation with proper styling and unit numbering
  const generateSVGString = useCallback((units) => {
    const GRID_SIZE = 8;
    const CELL_SIZE = 40;
    const PADDING = 10;
    
    const svgWidth = GRID_SIZE * CELL_SIZE + (PADDING * 2);
    const svgHeight = GRID_SIZE * CELL_SIZE + (PADDING * 2);
    
    // Sort units to maintain consistent numbering
    const sortedUnits = [...units].sort((a, b) => a - b);
    
    const svgRects = sortedUnits.map((unitIndex, arrayIndex) => {
      const x = (unitIndex % GRID_SIZE) * CELL_SIZE + PADDING;
      const y = Math.floor(unitIndex / GRID_SIZE) * CELL_SIZE + PADDING;
      const unitNumber = arrayIndex + 1;
      
      return `
        <g id="unit-${unitIndex}">
          <rect 
            width="${CELL_SIZE-2}" 
            height="${CELL_SIZE-2}" 
            x="${x+1}" 
            y="${y+1}" 
            fill="#3B82F6" 
            stroke="#1D4ED8" 
            stroke-width="2" 
            rx="4"
          />
          <text 
            x="${x + CELL_SIZE/2}" 
            y="${y + CELL_SIZE/2}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            fill="white" 
            font-size="12" 
            font-weight="bold" 
            font-family="Arial, sans-serif"
          >${unitNumber}</text>
        </g>
      `;
    }).join('');
    
    // Add grid background
    const gridLines = [];
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      gridLines.push(`
        <line 
          x1="${i * CELL_SIZE + PADDING}" 
          y1="${PADDING}" 
          x2="${i * CELL_SIZE + PADDING}" 
          y2="${GRID_SIZE * CELL_SIZE + PADDING}" 
          stroke="#E5E7EB" 
          stroke-width="1"
        />
      `);
      // Horizontal lines
      gridLines.push(`
        <line 
          x1="${PADDING}" 
          y1="${i * CELL_SIZE + PADDING}" 
          x2="${GRID_SIZE * CELL_SIZE + PADDING}" 
          y2="${i * CELL_SIZE + PADDING}" 
          stroke="#E5E7EB" 
          stroke-width="1"
        />
      `);
    }
    
    return `
      <svg 
        width="${svgWidth}" 
        height="${svgHeight}" 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${svgWidth} ${svgHeight}"
      >
        <defs>
          <style>
            .grid-bg { fill: #F9FAFB; stroke: #E5E7EB; }
            .unit-rect { fill: #3B82F6; stroke: #1D4ED8; }
            .unit-text { fill: white; font-family: Arial, sans-serif; }
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="#F9FAFB"/>
        
        <!-- Grid lines -->
        ${gridLines.join('')}
        
        <!-- Grid border -->
        <rect 
          x="${PADDING}" 
          y="${PADDING}" 
          width="${GRID_SIZE * CELL_SIZE}" 
          height="${GRID_SIZE * CELL_SIZE}" 
          fill="none" 
          stroke="#6B7280" 
          stroke-width="2"
        />
        
        <!-- Units -->
        ${svgRects}
        
        <!-- Title -->
        <text 
          x="${svgWidth/2}" 
          y="${PADDING/2}" 
          text-anchor="middle" 
          font-size="14" 
          font-weight="bold" 
          fill="#374151" 
          font-family="Arial, sans-serif"
        >Floor Layout - ${units.length} Units</text>
      </svg>
    `;
  }, []);

  // Generate layout preview data with comprehensive information
  const generateLayoutPreview = useCallback((units) => {
    if (!units || units.length === 0) return null;
    
    const GRID_SIZE = 8;
    const sortedUnits = [...units].sort((a, b) => a - b);
    
    // Calculate layout metrics
    const positions = sortedUnits.map(unitIndex => ({
      unitIndex,
      x: unitIndex % GRID_SIZE,
      y: Math.floor(unitIndex / GRID_SIZE)
    }));
    
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // Determine layout pattern
    let layoutType = 'custom';
    if (width === 1) layoutType = 'vertical_line';
    else if (height === 1) layoutType = 'horizontal_line';
    else if (width === height) layoutType = 'square';
    else if (width > height * 1.5) layoutType = 'wide_rectangle';
    else if (height > width * 1.5) layoutType = 'tall_rectangle';
    else layoutType = 'rectangle';
    
    // Generate compact SVG for preview
    const compactSVG = generateSVGString(units);
    
    return {
      svg: compactSVG,
      units_count: units.length,
      layout_type: layoutType,
      dimensions: { width, height },
      coverage_area: width * height,
      density: (units.length / (width * height)) * 100,
      unit_positions: positions,
      sorted_units: sortedUnits,
      metadata: {
        min_coordinates: { x: minX, y: minY },
        max_coordinates: { x: maxX, y: maxY },
        total_cells_used: units.length,
        layout_efficiency: ((units.length / (GRID_SIZE * GRID_SIZE)) * 100).toFixed(1)
      }
    };
  }, [generateSVGString]);

  // Enhanced save floor plan with comprehensive layout data
  const saveFloorPlan = useCallback((floor, data) => {
    const enhancedData = {
      ...data,
      units_ids: selectedUnits,
      units_total: selectedUnits.length,
      layout_preview: generateLayoutPreview(selectedUnits),
      grid_configuration: {
        grid_size: 8,
        cell_size: 40,
        selected_cells: selectedUnits,
        layout_type: 'manual_grid',
        created_at: new Date().toISOString()
      },
      // Generate unit details for each selected cell
      units_details: selectedUnits.map((cellIndex, arrayIndex) => {
        const x = cellIndex % 8;
        const y = Math.floor(cellIndex / 8);
        return {
          svg_id: cellIndex,
          unit_number: arrayIndex + 1,
          grid_position: { x, y },
          coordinates: {
            x: x * 40,
            y: y * 40
          },
          area_sqm: 150, // Default area
          status: 'vacant'
        };
      })
    };
    
    console.log('Saving enhanced floor plan:', floor, enhancedData);
    
    if (updateFloorData) {
      updateFloorData(floor, enhancedData);
    }
  }, [selectedUnits, updateFloorData, generateLayoutPreview]);

  // Export all floors as combined layout
  const exportAllFloorsLayout = useCallback(() => {
    const allFloorsData = {};
    
    Object.entries(existingFloorData).forEach(([floorNum, floorData]) => {
      if (floorData && floorData.units_ids && floorData.units_ids.length > 0) {
        allFloorsData[floorNum] = {
          floor_number: parseInt(floorNum),
          units_count: floorData.units_total,
          layout_svg: floorData.layout_data,
          preview_data: floorData.layout_preview,
          grid_config: floorData.grid_configuration,
          units_details: floorData.units_details || []
        };
      }
    });
    
    return allFloorsData;
  }, [existingFloorData]);

  // Get layout summary for all floors
  const getLayoutSummary = useCallback(() => {
    const summary = {};
    Object.entries(existingFloorData).forEach(([floorNum, floorData]) => {
      if (floorData && floorData.layout_preview) {
        summary[floorNum] = {
          units_count: floorData.units_total,
          layout_type: floorData.layout_preview.layout_type,
          svg_preview: floorData.layout_preview.svg,
          efficiency: floorData.layout_preview.metadata?.layout_efficiency
        };
      }
    });
    return summary;
  }, [existingFloorData]);

  // Validate floor plan completeness
  const validateFloorPlan = useCallback((floorNumber) => {
    const floorData = existingFloorData[floorNumber];
    if (!floorData) return { valid: false, errors: ['Floor not configured'] };
    
    const errors = [];
    if (!floorData.units_ids || floorData.units_ids.length === 0) {
      errors.push('No units selected for this floor');
    }
    if (!floorData.layout_data) {
      errors.push('Layout data missing');
    }
    if (!floorData.layout_preview) {
      errors.push('Layout preview not generated');
    }
    
    return { valid: errors.length === 0, errors };
  }, [existingFloorData]);

  // Get unit by position
  const getUnitByPosition = useCallback((x, y) => {
    const cellIndex = y * 8 + x;
    return selectedUnits.includes(cellIndex) ? {
      cellIndex,
      unitNumber: selectedUnits.indexOf(cellIndex) + 1,
      position: { x, y }
    } : null;
  }, [selectedUnits]);

  return {
    selectedUnits,
    currentFloor,
    floorData: existingFloorData,
    setCurrentFloor,
    addUnit,
    removeUnit,
    toggleUnit,
    clearSelection,
    saveFloorPlan,
    generateSVGString,
    generateLayoutPreview,
    getLayoutSummary,
    exportAllFloorsLayout,
    validateFloorPlan,
    getUnitByPosition
  };
}

/**
 * Hook for tenant management operations
 */
export function useTenantOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignTenant = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Assigning tenant with data:', assignmentData);
      const result = await TenantService.assignTenantToUnit(assignmentData);
      
      return result;
    } catch (err) {
      console.error('Error assigning tenant:', err);
      setError(err.message || 'Failed to assign tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const vacateTenant = useCallback(async (tenantId, vacationData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Vacating tenant:', tenantId, vacationData);
      const result = await TenantService.vacateTenant(tenantId, vacationData);
      
      return result;
    } catch (err) {
      console.error('Error vacating tenant:', err);
      setError(err.message || 'Failed to vacate tenant');
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

  const addTenantNote = useCallback(async (tenantId, noteData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await TenantService.addTenantNote(tenantId, noteData);
      return result;
    } catch (err) {
      console.error('Error adding tenant note:', err);
      setError(err.message || 'Failed to add tenant note');
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
      console.error('Error sending tenant reminder:', err);
      setError(err.message || 'Failed to send reminder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    assignTenant,
    vacateTenant,
    getTenantHistory,
    addTenantNote,
    sendTenantReminder
  };
}