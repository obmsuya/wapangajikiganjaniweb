// services/landlord/property.js 
import api from '@/lib/api/api-client';

const extractGridCellsFromSVG = (svgData) => {
  if (!svgData || typeof svgData !== 'string') return [];
  
  try {
    const unitMatches = svgData.match(/id="unit_(\d+)"/g);
    if (unitMatches) {
      return unitMatches
        .map(match => parseInt(match.match(/\d+/)[0]))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b);
    }
  } catch (error) {
    console.warn('Failed to parse grid cells from SVG:', error);
  }
  
  return [];
};

const PropertyService = {
  getProperties: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/api/v1/svg_properties/property/?${queryString}` : '/api/v1/svg_properties/property/';
      
      const response = await api.get(url);
      
      const propertiesWithUnits = Array.isArray(response) ? response : response.results || [];
      
      return Array.isArray(response) 
        ? propertiesWithUnits 
        : { ...response, results: propertiesWithUnits };
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  },

  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/svg_properties/property/${propertyId}/`);
      
      // FIXED: Properly extract units WITH tenant data
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
                // FIXED: Keep the actual current_tenant data from the API
                current_tenant: unit.current_tenant || null
              });
            });
          }
        });

        // FIXED: Also preserve tenant data in the floor structure
        response.property_floor = response.property_floor.map(floor => ({
          ...floor,
          // Preserve units_floor with tenant data
          units_floor: floor.units_floor ? floor.units_floor.map(unit => ({
            ...unit,
            // Ensure current_tenant is preserved
            current_tenant: unit.current_tenant || null
          })) : [],
          
          // Add grid configuration
          grid_configuration: floor.grid_configuration || (
            floor.layout_data ? {
              grid_size: 8,
              cell_size: 40,
              selected_cells: extractGridCellsFromSVG(floor.layout_data),
              layout_type: 'manual_grid'
            } : null
          )
        }));
      }
      
      console.log('PropertyService - getPropertyDetails response:', {
        property_id: response.id,
        floors_count: response.property_floor?.length || 0,
        units_with_tenants: units.filter(u => u.current_tenant).length,
        total_units: units.length
      });
      
      return {
        ...response,
        units: units
      };
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  updateProperty: async (propertyId, propertyData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.put(`/api/v1/svg_properties/property/${propertyId}/`, propertyData);
    } catch (error) {
      console.error(`Error updating property ${propertyId}:`, error);
      throw error;
    }
  },

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

  saveProperty: async (propertyData) => {
    try {
      console.log('Saving property:', propertyData);
      const response = await api.post('/api/v1/svg_properties/saveproperty/', propertyData);
      console.log('Property saved:', response);
      return response;
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  },

  updateFloorLayout: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }

      console.log('Updating floor layout:', floorData);

      const response = await PropertyService.bulkUpdateFloorLayout(propertyId, {
        [floorData.floor_number]: floorData
      });

      return response;
    } catch (error) {
      console.error(`Error updating floor layout:`, error);
      throw error;
    }
  },

  addFloor: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }

      console.log('Adding new floor:', floorData);

      const response = await api.post(`/api/v1/svg_properties/property/${propertyId}/add_floor/`, {
        floor_no: floorData.floor_number - 1,
        units_total: floorData.units_total,
        layout_type: floorData.layout_type,
        creation_method: floorData.creation_method,
        layout_data: floorData.layout_data,
        units: floorData.units_details || []
      });

      return response;
    } catch (error) {
      console.error(`Error adding floor:`, error);
      throw error;
    }
  },

  bulkUpdateFloorLayout: async (propertyId, floorsData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }

      console.log('Bulk updating floor layouts:', floorsData);

      const formattedFloorsData = {};
      
      Object.entries(floorsData).forEach(([floorNumber, floorData]) => {
        formattedFloorsData[floorNumber] = {
          units_total: floorData.units_total || 0,
          layout_type: floorData.layout_type || 'manual_grid',
          creation_method: floorData.creation_method || 'manual',
          layout_data: floorData.layout_data || '',
          
          units_details: (floorData.units_details || []).map(unit => ({
            svg_id: unit.svg_id,
            svg_geom: unit.svg_geom || '',
            area_sqm: unit.area_sqm || 150,
            rooms: unit.rooms || 1,
            floor_number: parseInt(floorNumber) - 1,
            status: unit.status || 'available',
            utilities: unit.utilities || {},
            rent_amount: unit.rent_amount || 0,
            unit_name: unit.unit_name || `Unit ${unit.unit_number || 1}`,
            payment_freq: unit.payment_freq || 'monthly'
          }))
        };
      });

      const response = await api.post(`/api/v1/svg_properties/property/${propertyId}/bulk_update_floor_layout/`, {
        floors: formattedFloorsData
      });
      
      console.log('Bulk update response:', response);
      return response;
    } catch (error) {
      console.error(`Error bulk updating floor layouts:`, error);
      throw error;
    }
  },

  getFloorUnitsWithTenants: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const response = await api.get(`/api/v1/svg_properties/property/${propertyId}/floor_units_with_tenants/`);
      return response;
    } catch (error) {
      console.error(`Error fetching floor units with tenants for property ${propertyId}:`, error);
      throw error;
    }
  },

  validateUnitDeletion: async (propertyId, floorNumber, svgId) => {
    try {
      if (!propertyId || floorNumber === undefined || svgId === undefined) {
        throw new Error("Property ID, floor number, and SVG ID are required");
      }
      
      const response = await api.post(`/api/v1/svg_properties/property/${propertyId}/validate_unit_deletion/`, {
        floor_number: floorNumber,
        svg_id: svgId
      });
      
      return response;
    } catch (error) {
      console.error(`Error validating unit deletion:`, error);
      throw error;
    }
  },

  checkUnitTenant: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      const response = await api.get(`/api/v1/svg_properties/units/${unitId}/check-tenant/`);
      return response;
    } catch (error) {
      console.error(`Error checking unit tenant for unit ${unitId}:`, error);
      throw error;
    }
  },

  updatePropertyWithFloors: async (propertyId, propertyData, floorsData = {}) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      const propertyResponse = await api.put(`/api/v1/svg_properties/property/${propertyId}/`, propertyData);
      
      if (Object.keys(floorsData).length > 0) {
        const floorsResponse = await PropertyService.bulkUpdateFloorLayout(propertyId, floorsData);
        
        return {
          property: propertyResponse,
          floors: floorsResponse,
          message: "Property and floor layouts updated successfully"
        };
      }
      
      return propertyResponse;
    } catch (error) {
      console.error(`Error updating property with floors:`, error);
      throw error;
    }
  },

  savePropertyWithFloors: async (propertyData) => {
    try {
      const formattedData = {
        name: propertyData.name,
        category: propertyData.category,
        location: propertyData.location,
        address: propertyData.address,
        total_floors: propertyData.total_floors,
        total_area: propertyData.total_area,
        total_units: propertyData.total_units || 0,
        prop_image: propertyData.prop_image,
        
        floors: propertyData.floors ? Object.keys(propertyData.floors).map((floorKey) => {
          const floor = parseInt(floorKey);
          const floorPlan = propertyData.floors[floor];
          
          return {
            floor: {
              floor_no: floor - 1,
              units_total: floorPlan.units_total || 0,
              layout_type: floorPlan.layout_type || 'manual_grid',
              creation_method: floorPlan.creation_method || 'manual',
              layout_data: floorPlan.layout_data || '',
              units: floorPlan.units_details || []
            }
          };
        }) : []
      };
      
      const response = await api.post('/api/v1/svg_properties/save_property_react/', formattedData);
      return response;
    } catch (error) {
      console.error('Error saving property with floors:', error);
      throw error;
    }
  },

  // REST OF THE METHODS REMAIN THE SAME...
  getPropertyAnalytics: async (propertyId) => {
    try {
      const property = await PropertyService.getPropertyDetails(propertyId);
      
      const analytics = {
        property_id: propertyId,
        property_name: property.name,
        total_floors: property.total_floors || 1,
        floors_configured: 0,
        total_units: 0,
        occupied_units: 0,
        vacant_units: 0,
        maintenance_units: 0,
        total_monthly_rent: 0,
        actual_monthly_income: 0,
        occupancy_rate: 0,
        floor_breakdown: []
      };
      
      if (property.property_floor && Array.isArray(property.property_floor)) {
        property.property_floor.forEach(floor => {
          const units = floor.units_floor || [];
          const floorStats = {
            floor_no: floor.floor_no,
            floor_number: floor.floor_no + 1,
            units_total: units.length,
            occupied: units.filter(u => u.status === 'occupied' || u.current_tenant).length,
            vacant: units.filter(u => u.status === 'available').length,
            maintenance: units.filter(u => u.status === 'maintenance').length,
            total_rent: units.reduce((sum, u) => sum + (parseFloat(u.rent_amount) || 0), 0),
            actual_income: units.filter(u => u.status === 'occupied' || u.current_tenant)
                               .reduce((sum, u) => sum + (parseFloat(u.rent_amount) || 0), 0),
            occupancy_rate: units.length > 0 ? Math.round((units.filter(u => u.status === 'occupied' || u.current_tenant).length / units.length) * 100) : 0
          };
          
          analytics.floor_breakdown.push(floorStats);
          analytics.total_units += floorStats.units_total;
          analytics.occupied_units += floorStats.occupied;
          analytics.vacant_units += floorStats.vacant;
          analytics.maintenance_units += floorStats.maintenance;
          analytics.total_monthly_rent += floorStats.total_rent;
          analytics.actual_monthly_income += floorStats.actual_income;
          
          if (units.length > 0) {
            analytics.floors_configured++;
          }
        });
      }
      
      analytics.occupancy_rate = analytics.total_units > 0 ? 
        Math.round((analytics.occupied_units / analytics.total_units) * 100) : 0;
      
      return analytics;
    } catch (error) {
      console.error(`Error getting property analytics:`, error);
      throw error;
    }
  },

  exportFloorLayouts: async (propertyId, format = 'svg') => {
    try {
      const property = await PropertyService.getPropertyDetails(propertyId);
      const layouts = {};
      
      if (property.property_floor && Array.isArray(property.property_floor)) {
        property.property_floor.forEach(floor => {
          if (floor.layout_data) {
            layouts[`floor_${floor.floor_no + 1}`] = {
              floor_number: floor.floor_no + 1,
              layout_data: floor.layout_data,
              units_count: floor.units_total,
              layout_type: floor.layout_type
            };
          }
        });
      }
      
      return {
        property_id: propertyId,
        property_name: property.name,
        export_format: format,
        layouts: layouts,
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error exporting floor layouts:`, error);
      throw error;
    }
  },

  validatePropertySetup: async (propertyData) => {
    const errors = [];
    const warnings = [];
    
    try {
      if (!propertyData.name || propertyData.name.trim().length === 0) {
        errors.push('Property name is required');
      }
      
      if (!propertyData.location || propertyData.location.trim().length === 0) {
        errors.push('Property location is required');
      }
      
      if (!propertyData.total_floors || propertyData.total_floors < 1) {
        errors.push('Property must have at least one floor');
      }
      
      if (propertyData.floors && Object.keys(propertyData.floors).length > 0) {
        const configuredFloors = Object.keys(propertyData.floors).length;
        const expectedFloors = propertyData.total_floors;
        
        if (configuredFloors < expectedFloors) {
          warnings.push(`Only ${configuredFloors} of ${expectedFloors} floors are configured`);
        }
        
        let totalUnits = 0;
        Object.entries(propertyData.floors).forEach(([floorNum, floorData]) => {
          if (!floorData.units_total || floorData.units_total === 0) {
            warnings.push(`Floor ${floorNum} has no units configured`);
          } else {
            totalUnits += floorData.units_total;
          }
          
          if (!floorData.layout_data) {
            warnings.push(`Floor ${floorNum} is missing layout data`);
          }
        });
        
        if (totalUnits === 0) {
          errors.push('Property must have at least one unit');
        }
      } else {
        errors.push('No floors configured for this property');
      }
      
      return {
        is_valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        can_save: errors.length === 0
      };
      
    } catch (error) {
      console.error('Error validating property setup:', error);
      return {
        is_valid: false,
        errors: ['Validation failed: ' + error.message],
        warnings: [],
        can_save: false
      };
    }
  },

  formatFloorDataForFrontend: (backendFloors) => {
    const formattedFloors = {};
    
    if (backendFloors && Array.isArray(backendFloors)) {
      backendFloors.forEach(floor => {
        const floorNumber = floor.floor_no + 1;
        const units = floor.units_floor || [];
        
        formattedFloors[floorNumber] = {
          id: floor.id,
          floor_number: floorNumber,
          floor_no: floor.floor_no,
          units_total: floor.units_total || units.length,
          layout_data: floor.layout_data,
          layout_type: floor.layout_type || 'manual_grid',
          creation_method: floor.layout_creation_method || 'manual',
          configured: units.length > 0,
          updated_at: floor.updated_at,
          
          units: units,
          units_ids: units.map(unit => unit.svg_id).filter(id => id !== undefined),
          
          grid_configuration: floor.grid_configuration || {
            grid_size: 8,
            cell_size: 40,
            selected_cells: units.map(unit => unit.svg_id).filter(id => id !== undefined),
            layout_type: 'manual_grid'
          },
          
          units_details: units.map(unit => ({
            svg_id: unit.svg_id,
            unit_name: unit.unit_name,
            area_sqm: unit.area_sqm,
            rooms: unit.rooms,
            rent_amount: unit.rent_amount,
            status: unit.status,
            current_tenant: unit.current_tenant,
            svg_geom: unit.svg_geom,
            floor_number: unit.floor_number,
            utilities: unit.utilities || {}
          })),
          
          occupied_units: units.filter(unit => unit.status === 'occupied' || unit.current_tenant).length,
          vacant_units: units.filter(unit => unit.status !== 'occupied' && !unit.current_tenant).length,
          occupancy_rate: units.length > 0 ? Math.round((units.filter(unit => unit.status === 'occupied' || unit.current_tenant).length / units.length) * 100) : 0,
          total_rent: units.reduce((sum, unit) => sum + (parseFloat(unit.rent_amount) || 0), 0)
        };
      });
    }
    
    return formattedFloors;
  },

  formatFloorDataForBackend: (frontendFloors) => {
    return Object.keys(frontendFloors).map(floorKey => {
      const floor = parseInt(floorKey);
      const floorData = frontendFloors[floor];
      
      return {
        floor: {
          floor_no: floor - 1,
          units_total: floorData.units_total || 0,
          layout_type: floorData.layout_type || 'manual_grid',
          creation_method: floorData.creation_method || 'manual',
          layout_data: floorData.layout_data || '',
          units: floorData.units_details || []
        }
      };
    });
  },

  updateUnitDetails: async (unitId, unitData) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }

      const formattedData = {
        unit_name: unitData.unit_name,
        rooms: unitData.bedrooms || unitData.rooms,
        area_sqm: parseFloat(unitData.area_sqm) || 0,
        rent_amount: parseFloat(unitData.rent_amount) || 0,
        payment_freq: unitData.payment_freq || 'monthly',
        status: unitData.status || 'vacant'
      };

      console.log(`Updating unit ${unitId} with data:`, formattedData);
      
      const response = await api.put(`/api/v1/svg_properties/unit/${unitId}/`, formattedData);
      
      console.log('Unit updated successfully:', response);
      return response;
    } catch (error) {
      console.error(`Error updating unit ${unitId}:`, error);
      throw error;
    }
  },

  getUnitDetails: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      const response = await api.get(`/api/v1/svg_properties/unit/${unitId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching unit details for ID ${unitId}:`, error);
      throw error;
    }
  },

  updateUnitStatus: async (unitId, status) => {
    try {
      if (!unitId || !status) {
        throw new Error("Unit ID and status are required");
      }
      
      const response = await api.patch(`/api/v1/svg_properties/unit/${unitId}/`, {
        status: status
      });
      
      return response;
    } catch (error) {
      console.error(`Error updating unit status:`, error);
      throw error;
    }
  }
};

export default PropertyService;