// services/landlord/dashboard.js - FIXED
import api from '@/lib/api/api-client';
import PropertyService from './property';
import TenantService from './tenant';

const DashboardService = {
  // Get comprehensive dashboard statistics
  getDashboardStats: async () => {
    try {
      // Get properties with units and tenant data
      const propertiesResponse = await PropertyService.getProperties();
      const properties = Array.isArray(propertiesResponse) ? propertiesResponse : propertiesResponse.results || [];

      // Calculate statistics from the transformed property data
      const stats = {
        totalProperties: properties.length,
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        totalMonthlyRent: 0,
        overduePayments: 0,
        occupancyRate: 0
      };

      // Calculate stats using the units array from PropertyService
      properties.forEach(property => {
        if (property.units && Array.isArray(property.units)) {
          property.units.forEach(unit => {
            stats.totalUnits++;
            stats.totalMonthlyRent += parseFloat(unit.rent_amount || 0);
            
            // Check if unit has a current tenant
            if (unit.current_tenant && unit.current_tenant.id) {
              stats.occupiedUnits++;
            } else {
              stats.vacantUnits++;
            }
          });
        }
      });

      // Calculate occupancy rate
      if (stats.totalUnits > 0) {
        stats.occupancyRate = Math.round((stats.occupiedUnits / stats.totalUnits) * 100);
      }

      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Get properties with detailed unit and tenant information
  getPropertiesWithDetails: async (filters = {}) => {
    try {
      // Use PropertyService which already includes units and tenant data
      const response = await PropertyService.getProperties(filters);
      const properties = Array.isArray(response) ? response : response.results || [];

      // Enhance each property with calculated stats
      const enhancedProperties = properties.map(property => {
        let totalUnits = 0;
        let occupiedUnits = 0;
        let monthlyRevenue = 0;

        // Use the units array that PropertyService already provides
        if (property.units && Array.isArray(property.units)) {
          property.units.forEach(unit => {
            totalUnits++;
            monthlyRevenue += parseFloat(unit.rent_amount || 0);
            
            // Check if unit has a current tenant
            if (unit.current_tenant && unit.current_tenant.id) {
              occupiedUnits++;
            }
          });
        }

        return {
          ...property,
          stats: {
            totalUnits,
            occupiedUnits,
            vacantUnits: totalUnits - occupiedUnits,
            occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
            monthlyRevenue,
            annualRevenue: monthlyRevenue * 12
          }
        };
      });

      return enhancedProperties;
    } catch (error) {
      console.error("Error fetching properties with details:", error);
      throw error;
    }
  },

  // Get single property with complete details
  getPropertyDetails: async (propertyId) => {
    try {
      if (!propertyId) {
        throw new Error("Property ID is required");
      }

      // Use PropertyService which already fetches units and tenant data
      const property = await PropertyService.getPropertyDetails(propertyId);
      
      // Calculate stats from the units array
      let totalUnits = 0;
      let occupiedUnits = 0;
      let monthlyRevenue = 0;

      if (property.units && Array.isArray(property.units)) {
        property.units.forEach(unit => {
          totalUnits++;
          monthlyRevenue += parseFloat(unit.rent_amount || 0);
          
          // Check if unit has a current tenant
          if (unit.current_tenant && unit.current_tenant.id) {
            occupiedUnits++;
          }
        });
      }

      return {
        ...property,
        stats: {
          totalUnits,
          occupiedUnits,
          vacantUnits: totalUnits - occupiedUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          monthlyRevenue,
          annualRevenue: monthlyRevenue * 12
        }
      };
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Search properties by name or location
  searchProperties: async (searchTerm) => {
    try {
      if (!searchTerm) {
        return [];
      }

      // Get all properties and filter client-side for now
      const properties = await DashboardService.getPropertiesWithDetails();
      
      return properties.filter(property => 
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching properties:", error);
      throw error;
    }
  },

  // Get recent activity (new tenants, recent assignments, etc.)
  getRecentActivity: async (limit = 10) => {
    try {
      // Get recent tenants
      const tenantsResponse = await TenantService.getTenants({ 
        ordering: '-created_at',
        limit 
      });
      
      const tenants = Array.isArray(tenantsResponse) ? 
        tenantsResponse : 
        (tenantsResponse.results || []);

      // Format as activity items
      const activities = tenants.map(tenant => ({
        id: `tenant-${tenant.id}`,
        type: 'tenant_assigned',
        title: `New tenant: ${tenant.full_name}`,
        description: `Tenant assigned to unit`,
        timestamp: tenant.created_at,
        icon: 'user-plus'
      }));

      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  },

  // Get financial overview
  getFinancialOverview: async (period = 'month') => {
    try {
      // FIXED: Use DashboardService.getPropertiesWithDetails instead of this.getPropertiesWithDetails
      const properties = await DashboardService.getPropertiesWithDetails();
      
      let totalExpectedRevenue = 0;
      let totalActualRevenue = 0;
      let totalProperties = properties.length;
      let totalUnits = 0;
      let occupiedUnits = 0;

      properties.forEach(property => {
        if (property.stats) {
          totalUnits += property.stats.totalUnits;
          occupiedUnits += property.stats.occupiedUnits;
          totalExpectedRevenue += property.stats.monthlyRevenue;
          // For now, assume actual revenue equals expected for occupied units
          totalActualRevenue += (property.stats.monthlyRevenue * property.stats.occupancyRate / 100);
        }
      });

      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const collectionRate = totalExpectedRevenue > 0 ? Math.round((totalActualRevenue / totalExpectedRevenue) * 100) : 0;

      return {
        period,
        totalExpectedRevenue,
        totalActualRevenue,
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        occupancyRate,
        collectionRate,
        outstandingRent: totalExpectedRevenue - totalActualRevenue,
        trends: {
          revenueGrowth: 0, // Would need historical data
          occupancyGrowth: 0, // Would need historical data
          newTenants: 0 // Would need to calculate from recent data
        }
      };
    } catch (error) {
      console.error("Error fetching financial overview:", error);
      throw error;
    }
  }
};

export default DashboardService;