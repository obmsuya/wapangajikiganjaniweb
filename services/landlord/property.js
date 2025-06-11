// services/property.js
import api from '@/lib/api/api-client';

const PropertyService = {
  // Create property with full data (floors, units)
  createProperty: async (propertyData) => {
    try {
      return await api.post("/api/v1/svg_properties/saveproperty/", propertyData);
    } catch (error) {
      console.error("Error creating property:", error);
      throw error;
    }
  },

  // Get all properties for current user
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
        
      return await api.get(endpoint);
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  },

  // Get single property details
  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }
      return await api.get(`/api/v1/svg_properties/property/${propertyId}/`);
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Update property
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

  // Update property layout
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

  // Floor management
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

  // Get floors for property
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

  // Update floor layout
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

  // Units management
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

  // Get units for specific floor
  getFloorUnits: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.get(`/api/v1/svg_properties/units/floor/${floorId}/`);
    } catch (error) {
      console.error(`Error fetching units for floor ${floorId}:`, error);
      throw error;
    }
  },

  // Get floor details with units
  getFloorDetails: async (floorId) => {
    try {
      if (!floorId) {
        throw new Error("Floor ID is required");
      }
      return await api.get(`/api/v1/svg_properties/floor/units/${floorId}/`);
    } catch (error) {
      console.error(`Error fetching floor details for ID ${floorId}:`, error);
      throw error;
    }
  }
};

export default PropertyService;