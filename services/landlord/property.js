// services/landlord/property.js - Updated with Multi-Floor Support
import api from '@/lib/api/api-client';

const PropertyService = {
  // Create property with full data (floors, units) - Uses your save_property_react endpoint
  createProperty: async (propertyData) => {
    try {
      console.log("Creating property with data:", propertyData);
      // Use the save_property_react endpoint for property creation
      return await api.post("/api/v1/svg_properties/saveproperty/", propertyData);
    } catch (error) {
      console.error("Error creating property:", error);
      throw error;
    }
  },

  // Get all properties for current user - Uses PropertyViewSet
  getProperties: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/svg_properties/property/?${queryString}`
        : "/api/v1/svg_properties/property/";
        
      const response = await api.get(endpoint);
      console.log("Properties response:", response);
      
      // Your backend returns properties with property_floor containing floors and units
      // Let's transform this data to include units at property level
      const properties = Array.isArray(response) ? response : response.results || [];
      
      const propertiesWithUnits = properties.map(property => {
        const units = [];
        
        if (property.property_floor && Array.isArray(property.property_floor)) {
          property.property_floor.forEach(floor => {
            if (floor.units_floor && Array.isArray(floor.units_floor)) {
              floor.units_floor.forEach(unit => {
                units.push({
                  ...unit,
                  floor_info: {
                    floor_no: floor.floor_no,
                    id: floor.id
                  },
                  floor: floor.floor_no,
                  current_tenant: null // Will be populated by tenant service
                });
              });
            }
          });
        }
        
        return {
          ...property,
          units: units
        };
      });
      
      return Array.isArray(response) 
        ? propertiesWithUnits 
        : { ...response, results: propertiesWithUnits };
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  },

  // Get property details by ID - Uses PropertyViewSet detail
  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/svg_properties/property/${propertyId}/`);
      console.log("Property details response:", response);
      
      // Transform the data to include units at property level
      const units = [];
      if (response.property_floor && Array.isArray(response.property_floor)) {
        response.property_floor.forEach(floor => {
          if (floor.units_floor && Array.isArray(floor.units_floor)) {
            floor.units_floor.forEach(unit => {
              units.push({
                ...unit,
                floor_info: {
                  floor_no: floor.floor_no,
                  id: floor.id
                },
                floor: floor.floor_no,
                current_tenant: null // Will be populated by tenant service
              });
            });
          }
        });
      }
      
      return {
        ...response,
        units: units
      };
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Update property details - Uses PropertyViewSet update
  updateProperty: async (propertyId, propertyData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.patch(`/api/v1/svg_properties/property/${propertyId}/`, propertyData);
    } catch (error) {
      console.error(`Error updating property ${propertyId}:`, error);
      throw error;
    }
  },

  // Update property layout - Uses PropertyViewSet update_floor_layout action
  updatePropertyLayout: async (propertyId, layoutData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.post(`/api/v1/svg_properties/property/update_layout/${propertyId}/`, layoutData);
    } catch (error) {
      console.error(`Error updating property layout ${propertyId}:`, error);
      throw error;
    }
  },

  // Delete property
  deleteProperty: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.delete(`/api/v1/svg_properties/property/${propertyId}/`);
    } catch (error) {
      console.error(`Error deleting property ${propertyId}:`, error);
      throw error;
    }
  },

  // Get property image
  getPropertyImage: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.get(`/api/v1/svg_properties/property/${propertyId}/image/`);
    } catch (error) {
      console.error(`Error fetching property image for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // ================== FLOOR MANAGEMENT ==================
  
  // Add floor to property - Uses PropertyRegistrationViewSet add_floor action
  addFloor: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      console.log("Adding floor to property:", propertyId, floorData);
      return await api.post(`/api/v1/svg_properties/registration/${propertyId}/add_floor/`, floorData);
    } catch (error) {
      console.error(`Error adding floor to property ${propertyId}:`, error);
      throw error;
    }
  },

  // Update floor layout - Uses PropertyRegistrationViewSet update_floor_layout action
  updateFloorLayout: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      console.log("Updating floor layout for property:", propertyId, floorData);
      return await api.post(`/api/v1/svg_properties/registration/${propertyId}/update_floor_layout/`, floorData);
    } catch (error) {
      console.error(`Error updating floor layout for property ${propertyId}:`, error);
      throw error;
    }
  },

  // Get floors for property - Uses FloorViewSet
  getFloors: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/svg_properties/floor/?${queryString}`
        : "/api/v1/svg_properties/floor/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching floors:", error);
      throw error;
    }
  },

  // Get floor details by ID - Uses FloorViewSet detail
  getFloorDetails: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.get(`/api/v1/svg_properties/floor/${floorId}/`);
    } catch (error) {
      console.error(`Error fetching floor details for ID ${floorId}:`, error);
      throw error;
    }
  },

  // Update floor - Uses FloorViewSet update
  updateFloor: async (floorId, floorData) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.patch(`/api/v1/svg_properties/floor/${floorId}/`, floorData);
    } catch (error) {
      console.error(`Error updating floor ${floorId}:`, error);
      throw error;
    }
  },

  // Delete floor - Uses FloorViewSet destroy
  deleteFloor: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.delete(`/api/v1/svg_properties/floor/${floorId}/`);
    } catch (error) {
      console.error(`Error deleting floor ${floorId}:`, error);
      throw error;
    }
  },

  // Get units in a floor - Uses custom endpoint
  getFloorUnits: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.get(`/api/v1/svg_properties/floor/units/${floorId}/`);
    } catch (error) {
      console.error(`Error fetching units for floor ${floorId}:`, error);
      throw error;
    }
  },

  // ================== UNIT MANAGEMENT ==================

  // Get units with filters - Uses UnitViewSet
  getUnits: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/api/v1/svg_properties/units/?${queryString}`
        : "/api/v1/svg_properties/units/";
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  },

  // Get unit details by ID - Uses UnitViewSet detail
  getUnitDetails: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      return await api.get(`/api/v1/svg_properties/units/${unitId}/`);
    } catch (error) {
      console.error(`Error fetching unit details for ID ${unitId}:`, error);
      throw error;
    }
  },

  // Create unit - Uses UnitViewSet create
  createUnit: async (unitData) => {
    try {
      console.log("Creating unit with data:", unitData);
      return await api.post("/api/v1/svg_properties/units/", unitData);
    } catch (error) {
      console.error("Error creating unit:", error);
      throw error;
    }
  },

  // Update unit - Uses UnitViewSet update
  updateUnit: async (unitId, unitData) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      console.log("Updating unit:", unitId, unitData);
      return await api.patch(`/api/v1/svg_properties/units/${unitId}/`, unitData);
    } catch (error) {
      console.error(`Error updating unit ${unitId}:`, error);
      throw error;
    }
  },

  // Delete unit - Uses UnitViewSet destroy
  deleteUnit: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      return await api.delete(`/api/v1/svg_properties/units/${unitId}/`);
    } catch (error) {
      console.error(`Error deleting unit ${unitId}:`, error);
      throw error;
    }
  },

  // Get units in a specific floor - Uses custom endpoint
  getUnitsInFloor: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.get(`/api/v1/svg_properties/units/floor/${floorId}/`);
    } catch (error) {
      console.error(`Error fetching units in floor ${floorId}:`, error);
      throw error;
    }
  },

  // ================== UTILITY METHODS ==================

  // Generate floor layout preview
  generateFloorPreview: (selectedUnits, gridSize = 8, cellSize = 40) => {
    if (!selectedUnits || selectedUnits.length === 0) return null;
    
    const svgElements = selectedUnits.map((cellIndex, idx) => {
      const x = (cellIndex % gridSize) * cellSize;
      const y = Math.floor(cellIndex / gridSize) * cellSize;
      
      return `<rect width="${cellSize}" height="${cellSize}" x="${x}" y="${y}" id="unit_${cellIndex}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
              <text x="${x + cellSize/2}" y="${y + cellSize/2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${idx + 1}</text>`;
    }).join('\n');
    
    return {
      svg: `<svg width="${gridSize * cellSize}" height="${gridSize * cellSize}" xmlns="http://www.w3.org/2000/svg">
              ${svgElements}
            </svg>`,
      units_count: selectedUnits.length,
      grid_configuration: {
        grid_size: gridSize,
        cell_size: cellSize,
        selected_cells: selectedUnits
      }
    };
  },

  // Validate floor data
  validateFloorData: (floorData) => {
    const errors = [];
    
    if (!floorData.floor_no && floorData.floor_no !== 0) {
      errors.push('Floor number is required');
    }
    
    if (!floorData.units_total || floorData.units_total < 1) {
      errors.push('At least one unit is required');
    }
    
    if (!floorData.layout_type) {
      errors.push('Layout type is required');
    }
    
    if (!floorData.units || !Array.isArray(floorData.units) || floorData.units.length === 0) {
      errors.push('Units data is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate unit data
  validateUnitData: (unitData) => {
    const errors = [];
    
    if (!unitData.unit_name || !unitData.unit_name.trim()) {
      errors.push('Unit name is required');
    }
    
    if (!unitData.area_sqm || unitData.area_sqm <= 0) {
      errors.push('Area must be greater than 0');
    }
    
    if (unitData.rent_amount < 0) {
      errors.push('Rent amount cannot be negative');
    }
    
    if (!unitData.svg_id && unitData.svg_id !== 0) {
      errors.push('SVG ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format property data for backend
  formatPropertyForBackend: (propertyData) => {
    return {
      name: propertyData.name,
      category: propertyData.category,
      location: propertyData.location,
      address: propertyData.address,
      total_floors: propertyData.total_floors,
      total_area: propertyData.total_area,
      total_units: propertyData.total_units,
      prop_image: propertyData.prop_image,
      floors: Object.keys(propertyData.floors || {}).map((floorKey) => {
        const floor = parseInt(floorKey);
        const floorPlan = propertyData.floors[floor];
        const floorUnits = propertyData.units ? 
          Object.values(propertyData.units).filter(unit => unit.floor_no === floor) : [];
        
        return {
          floor: {
            floor_no: floor - 1, // Convert to 0-based indexing
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
  }
};

export default PropertyService;