// services/landlord/property.js
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
      
      return Array.isArray(response) ? propertiesWithUnits : { ...response, results: propertiesWithUnits };
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  },

  // Get single property details WITH units - Uses PropertyViewSet detail
  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      console.log(`Fetching property details for ID: ${propertyId}`);
      
      // Fetch property details with nested floors and units
      const property = await api.get(`/api/v1/svg_properties/property/${propertyId}/`);
      console.log("Property data received:", property);
      
      // Transform the nested structure to flat units array
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
                current_tenant: null // Will be populated by tenant queries
              });
            });
          }
        });
      }
      
      console.log("Transformed units:", units);
      
      // Fetch tenants for each unit if needed
      const unitsWithTenants = await Promise.all(
        units.map(async (unit) => {
          try {
            const tenant = await this.getUnitTenant(unit.id);
            return {
              ...unit,
              current_tenant: tenant
            };
          } catch (error) {
            // Unit has no tenant or error fetching tenant
            return {
              ...unit,
              current_tenant: null
            };
          }
        })
      );
      
      return {
        ...property,
        units: unitsWithTenants
      };
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Get units for a specific property - Direct from your units endpoint
  getPropertyUnits: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      
      // Try to get units by filtering through property floors
      const property = await this.getPropertyDetails(propertyId);
      return property.units || [];
    } catch (error) {
      console.error(`Error fetching units for property ${propertyId}:`, error);
      return [];
    }
  },

  // Get units for a specific floor - Uses your floor units endpoint
  getFloorUnits: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      
      // Use your custom endpoint for floor units
      const response = await api.get(`/api/v1/svg_properties/units/floor/${floorId}/`);
      
      if (response.floors && response.floors.units_floor) {
        return response.floors.units_floor;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching units for floor ${floorId}:`, error);
      return [];
    }
  },

  // Get floor details with units - Uses your floor details endpoint
  getFloorDetails: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      
      // Use your custom endpoint for floor details
      const response = await api.get(`/api/v1/svg_properties/floor/units/${floorId}/`);
      return response.floors || response;
    } catch (error) {
      console.error(`Error fetching floor details for ID ${floorId}:`, error);
      throw error;
    }
  },

  // Get tenant for a specific unit - This would need tenant API
  getUnitTenant: async (unitId) => {
    try {
      if (!unitId) {
        throw new Error("Unit ID is required");
      }
      
      // This would call your tenant API to get current tenant for unit
      // You'll need to implement this based on your tenant endpoints
      const response = await api.get(`/api/v1/tenants/?unit=${unitId}&status=active`);
      
      // Handle different response formats
      if (Array.isArray(response) && response.length > 0) {
        return response[0];
      }
      
      if (response.results && Array.isArray(response.results) && response.results.length > 0) {
        return response.results[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching tenant for unit ${unitId}:`, error);
      return null;
    }
  },

  // Update property - Uses PropertyViewSet update
  updateProperty: async (propertyId, updateData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.put(`/api/v1/svg_properties/property/${propertyId}/`, updateData);
    } catch (error) {
      console.error(`Error updating property ${propertyId}:`, error);
      throw error;
    }
  },

  // Update property layout - Uses your custom update_layout endpoint
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

  // Floor management - Uses PropertyRegistrationViewSet
  createFloor: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.post(`/api/v1/svg_properties/registration/${propertyId}/add_floor/`, floorData);
    } catch (error) {
      console.error(`Error creating floor for property ${propertyId}:`, error);
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

  // Update floor layout - Uses PropertyRegistrationViewSet
  updateFloorLayout: async (propertyId, floorData) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.post(`/api/v1/svg_properties/registration/${propertyId}/update_floor_layout/`, floorData);
    } catch (error) {
      console.error(`Error updating floor layout for property ${propertyId}:`, error);
      throw error;
    }
  },

  // Units management - Uses UnitViewSet
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
  }
};

export default PropertyService;