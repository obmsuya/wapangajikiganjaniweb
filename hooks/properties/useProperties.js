"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import PropertyService from '@/services/landlord/property';
import TenantService from '@/services/landlord/tenant';

export function useFloorPlan(updateFloorData, existingFloorData = {}, existingProperty = null, propertyData = null) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorMemory, setFloorMemory] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingFloorData && Object.keys(existingFloorData).length > 0) {
      const memory = {};
      Object.entries(existingFloorData).forEach(([floorNum, floorData]) => {
        memory[floorNum] = {
          ...floorData,
          units_ids: floorData.units_ids || [],
          units_total: floorData.units_total || 0
        };
      });
      setFloorMemory(memory);
    }
  }, [existingFloorData]);

  useEffect(() => {
    if (existingProperty && existingProperty.property_floor) {
      const memory = {};
      existingProperty.property_floor.forEach(floor => {
        const floorNumber = floor.floor_no + 1;
        
        const units_ids = [];
        if (floor.units_floor && Array.isArray(floor.units_floor)) {
          floor.units_floor.forEach(unit => {
            if (unit.svg_id !== undefined) {
              units_ids.push(unit.svg_id);
            }
          });
        }
        
        memory[floorNumber] = {
          floor_number: floorNumber,
          units_ids: units_ids,
          units_total: floor.units_total || units_ids.length,
          layout_data: floor.layout_data,
          layout_type: floor.layout_type || 'manual_grid',
          creation_method: floor.layout_creation_method || 'manual',
          configured: units_ids.length > 0,
          units_with_tenants: floor.units_floor ? floor.units_floor
            .filter(unit => unit.current_tenant)
            .map(unit => ({
              svg_id: unit.svg_id,
              tenant_name: unit.current_tenant.full_name,
              tenant_id: unit.current_tenant.id,
              unit_name: unit.unit_name
            })) : []
        };
      });
      
      setFloorMemory(memory);
    }
  }, [existingProperty]);

  useEffect(() => {
    if (!existingProperty && propertyData?.total_floors && Object.keys(floorMemory).length === 0) {
      const memory = {};
      for (let i = 1; i <= propertyData.total_floors; i++) {
        memory[i] = {
          floor_number: i,
          units_ids: [],
          units_total: 0,
          configured: false,
          layout_data: '',
          layout_type: 'manual_grid',
          creation_method: 'manual'
        };
      }
      setFloorMemory(memory);
    }
  }, [propertyData?.total_floors, existingProperty, floorMemory]);

  useEffect(() => {
    if (!existingProperty && propertyData?.total_floors) {
      setFloorMemory(prev => {
        const currentFloors = Object.keys(prev).length;
        const newFloorCount = propertyData.total_floors;
        
        if (currentFloors === newFloorCount) return prev;
        
        const updated = { ...prev };
        
        if (newFloorCount > currentFloors) {
          for (let i = currentFloors + 1; i <= newFloorCount; i++) {
            updated[i] = {
              floor_number: i,
              units_ids: [],
              units_total: 0,
              configured: false,
              layout_data: '',
              layout_type: 'manual_grid',
              creation_method: 'manual'
            };
          }
        } else if (newFloorCount < currentFloors) {
          for (let i = newFloorCount + 1; i <= currentFloors; i++) {
            delete updated[i];
          }
          if (currentFloor > newFloorCount) {
            setCurrentFloor(1);
          }
        }
        
        return updated;
      });
    }
  }, [propertyData?.total_floors, existingProperty, currentFloor]);

  const loadFloorData = useCallback(async (floorNumber) => {
    setIsLoading(true);
    
    try {
      if (selectedUnits.length > 0 && currentFloor !== floorNumber) {
        const currentFloorData = {
          floor_number: currentFloor,
          units_ids: [...selectedUnits],
          units_total: selectedUnits.length,
          configured: true
        };
        
        setFloorMemory(prev => ({
          ...prev,
          [currentFloor]: {
            ...prev[currentFloor],
            ...currentFloorData
          }
        }));
      }
      
      const floorData = floorMemory[floorNumber];
      if (floorData && floorData.units_ids) {
        setSelectedUnits([...floorData.units_ids]);
      } else {
        setSelectedUnits([]);
      }
      
      setCurrentFloor(floorNumber);
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedUnits, currentFloor, floorMemory]);

  const toggleUnit = useCallback((unitId) => {
    setSelectedUnits(prev => {
      const newUnits = prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId];
      
      setFloorMemory(prevMemory => ({
        ...prevMemory,
        [currentFloor]: {
          ...prevMemory[currentFloor],
          floor_number: currentFloor,
          units_ids: newUnits,
          units_total: newUnits.length,
          configured: newUnits.length > 0
        }
      }));
      
      return newUnits;
    });
  }, [currentFloor]);

  const addUnit = useCallback((unitId) => {
    if (!selectedUnits.includes(unitId)) {
      toggleUnit(unitId);
    }
  }, [selectedUnits, toggleUnit]);

  const removeUnit = useCallback((unitId) => {
    if (selectedUnits.includes(unitId)) {
      toggleUnit(unitId);
    }
  }, [selectedUnits, toggleUnit]);

  const clearSelection = useCallback(() => {
    setSelectedUnits([]);
    setFloorMemory(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        units_ids: [],
        units_total: 0,
        configured: false
      }
    }));
  }, [currentFloor]);

  const generateSVGString = useCallback((units) => {
    if (!units || units.length === 0) return '';
    
    const GRID_SIZE = 8;
    const CELL_SIZE = 40;
    
    const svgElements = units.map((cellIndex, idx) => {
      const x = (cellIndex % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(cellIndex / GRID_SIZE) * CELL_SIZE;
      
      return `<rect width="${CELL_SIZE}" height="${CELL_SIZE}" x="${x}" y="${y}" id="unit_${cellIndex}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
              <text x="${x + CELL_SIZE/2}" y="${y + CELL_SIZE/2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${idx + 1}</text>`;
    }).join('\n');
    
    return `<svg width="${GRID_SIZE * CELL_SIZE}" height="${GRID_SIZE * CELL_SIZE}" xmlns="http://www.w3.org/2000/svg">
              ${svgElements}
            </svg>`;
  }, []);

  const generateLayoutPreview = useCallback((units) => {
    if (!units || units.length === 0) return null;
    
    const GRID_SIZE = 8;
    const CELL_SIZE = 40;
    
    const positions = units.map(cellIndex => ({
      x: cellIndex % GRID_SIZE,
      y: Math.floor(cellIndex / GRID_SIZE),
      cellIndex
    }));
    
    const sortedUnits = [...units].sort((a, b) => a - b);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    let layoutType = 'custom';
    if (width === 1) layoutType = 'vertical_line';
    else if (height === 1) layoutType = 'horizontal_line';
    else if (width === height) layoutType = 'square';
    else if (width > height * 1.5) layoutType = 'wide_rectangle';
    else if (height > width * 1.5) layoutType = 'tall_rectangle';
    else layoutType = 'rectangle';
    
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

  const saveFloorPlan = useCallback(async (floor, data) => {
    const floorPlanData = {
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
      units_details: selectedUnits.map((cellIndex, arrayIndex) => {
        const x = cellIndex % 8;
        const y = Math.floor(cellIndex / 8);
        return {
          svg_id: cellIndex,
          unit_number: arrayIndex + 1,
          grid_position: { x, y },
          coordinates: { x: x * 40, y: y * 40 },
          area_sqm: 150,
          status: 'available',
          floor_number: floor,
          unit_name: `Unit ${arrayIndex + 1}`,
          rent_amount: 0,
          rooms: 1,
          utilities: {},
          svg_geom: `M${x * 40},${y * 40} L${(x + 1) * 40},${y * 40} L${(x + 1) * 40},${(y + 1) * 40} L${x * 40},${(y + 1) * 40} Z`
        };
      })
    };
    
    setFloorMemory(prev => ({
      ...prev,
      [floor]: floorPlanData
    }));
    
    if (updateFloorData) {
      updateFloorData(floor, floorPlanData);
    }
    
    return floorPlanData;
  }, [selectedUnits, updateFloorData, generateLayoutPreview]);

  const getAllFloorsData = useCallback(() => {
    return floorMemory;
  }, [floorMemory]);

  const validateUnitDeletion = useCallback(async (floorNumber, cellIndex) => {
    if (!existingProperty) return false;
    
    try {
      const floor = existingProperty.property_floor?.find(f => f.floor_no === floorNumber - 1);
      if (!floor || !floor.units_floor) return false;
      
      const unit = floor.units_floor.find(u => u.svg_id === cellIndex);
      if (!unit) return false;
      
      if (unit.current_tenant) {
        return {
          has_tenant: true,
          tenant_name: unit.current_tenant.full_name || 'Unknown Tenant',
          tenant_id: unit.current_tenant.id,
          unit_name: unit.unit_name,
          message: `This unit is currently occupied by ${unit.current_tenant.full_name}. Please vacate the tenant before removing this unit.`
        };
      }
      
      if (unit.id) {
        try {
          const tenantCheck = await TenantService.checkUnitTenant(unit.id);
          if (tenantCheck && tenantCheck.has_tenant) {
            return {
              has_tenant: true,
              tenant_name: tenantCheck.tenant_info?.full_name || 'Unknown Tenant',
              tenant_id: tenantCheck.tenant_info?.id,
              unit_name: unit.unit_name,
              message: `This unit has an active tenant. Please vacate the tenant before removing this unit.`
            };
          }
        } catch (error) {
          console.error('Error checking unit tenant:', error);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error validating unit deletion:', error);
      return false;
    }
  }, [existingProperty]);

  const exportAllFloorsLayout = useCallback(() => {
    const allFloorsData = {};
    
    Object.entries(floorMemory).forEach(([floorNum, floorData]) => {
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
  }, [floorMemory]);

  const getLayoutSummary = useCallback(() => {
    const summary = {};
    Object.entries(floorMemory).forEach(([floorNum, floorData]) => {
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
  }, [floorMemory]);

  const validateFloorPlan = useCallback((floorNumber) => {
    const floorData = floorMemory[floorNumber];
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
  }, [floorMemory]);

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
    floorMemory,
    isLoading,
    setCurrentFloor,
    addUnit,
    removeUnit,
    toggleUnit,
    clearSelection,
    saveFloorPlan,
    generateSVGString,
    generateLayoutPreview,
    loadFloorData,
    getAllFloorsData,
    validateUnitDeletion,
    getLayoutSummary,
    exportAllFloorsLayout,
    validateFloorPlan,
    getUnitByPosition
  };
}

export function usePropertyCreation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const saveInProgress = useRef(false);
  
  const [propertyData, setPropertyData] = useState({
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

  const updatePropertyData = useCallback((updates) => {
    setPropertyData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const updateFloorData = useCallback((floorNumber, floorData) => {
    setPropertyData(prev => ({
      ...prev,
      floors: {
        ...prev.floors,
        [floorNumber]: floorData
      }
    }));
  }, []);

  const addUnitData = useCallback((unitData) => {
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
    if (saveInProgress.current || isLoading) {
      return;
    }

    saveInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const configuredUnits = getConfiguredUnits();
      
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
        
        floors: Object.keys(propertyData.floors).map((floorKey) => {
          const floor = parseInt(floorKey);
          const floorPlan = propertyData.floors[floor];
          const floorUnits = floorPlan.units_details || [];
          
          return {
            floor: {
              floor_no: floor - 1,
              units_total: floorPlan.units_total || floorUnits.length,
              layout_type: floorPlan.layout_type || 'rectangular',
              creation_method: floorPlan.creation_method || 'manual',
              layout_data: floorPlan.layout_data || '',
              units: floorUnits
            }
          };
        })
      };
      
      const response = await PropertyService.saveProperty(formattedData);
      return response;
      
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.message || 'Failed to save property');
      throw err;
    } finally {
      saveInProgress.current = false;
      setIsLoading(false);
    }
  }, [propertyData, getConfiguredUnits, getTotalUnits, isLoading]);

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
  }, []);

  return {
    currentStep,
    propertyData,
    floorData: propertyData.floors,
    configuredUnits: getConfiguredUnits(),
    isLoading,
    error,
    updatePropertyData,
    updateFloorData,
    addUnitData,
    nextStep,
    prevStep,
    goToStep,
    saveProperty,
    resetForm,
    totalUnits: getTotalUnits(),
    maxSteps: 5
  };
}

export function usePropertiesList(initialFilters = {}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PropertyService.getProperties(filters);
      
      let processedProperties = [];
      
      if (Array.isArray(response)) {
        processedProperties = response;
      } else if (response.results && Array.isArray(response.results)) {
        processedProperties = response.results;
      }
      
      processedProperties = processedProperties.map(property => {
        let totalUnits = 0;
        let occupiedUnits = 0;
        
        if (property.property_floor && Array.isArray(property.property_floor)) {
          property.property_floor.forEach(floor => {
            if (floor.units_floor && Array.isArray(floor.units_floor)) {
              totalUnits += floor.units_floor.length;
              occupiedUnits += floor.units_floor.filter(unit => 
                unit.status === 'occupied' || unit.current_tenant
              ).length;
            }
          });
        }
        
        return {
          ...property,
          calculated_total_units: totalUnits,
          calculated_occupied_units: occupiedUnits,
          calculated_occupancy_rate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
        };
      });
      
      setProperties(processedProperties);
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