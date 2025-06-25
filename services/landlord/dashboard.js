// services/landlord/dashboard.js
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
      // You could add a search parameter to your backend later
      const properties = await this.getPropertiesWithDetails();
      
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
      
      const tenants = Array.isArray(tenantsResponse) ? tenantsResponse : tenantsResponse.results || [];
      
      // Transform into activity feed format
      const activities = tenants.slice(0, limit).map(tenant => ({
        id: `tenant_${tenant.id}`,
        type: 'tenant_added',
        title: `New tenant: ${tenant.full_name}`,
        description: tenant.active_occupancy ? 
          `Assigned to ${tenant.active_occupancy.property} - ${tenant.active_occupancy.unit}` : 
          'Added to system',
        timestamp: tenant.created_at,
        data: tenant
      }));

      return activities;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },

  // Get financial overview for dashboard
  getFinancialOverview: async (period = 'month') => {
    try {
      const properties = await this.getPropertiesWithDetails();
      
      let totalExpectedRevenue = 0;
      let totalActualRevenue = 0;
      let occupiedUnitsRevenue = 0;

      properties.forEach(property => {
        if (property.units && Array.isArray(property.units)) {
          property.units.forEach(unit => {
            const rentAmount = parseFloat(unit.rent_amount || 0);
            totalExpectedRevenue += rentAmount;
            
            // If unit has a tenant, count as actual revenue
            if (unit.current_tenant && unit.current_tenant.id) {
              occupiedUnitsRevenue += rentAmount;
            }
          });
        }
      });

      // For now, assume actual revenue equals occupied units revenue
      // In a real implementation, you'd fetch actual payment data
      totalActualRevenue = occupiedUnitsRevenue;

      const collectionRate = totalExpectedRevenue > 0 ? 
        Math.round((totalActualRevenue / totalExpectedRevenue) * 100) : 0;

      return {
        period,
        totalExpectedRevenue,
        totalActualRevenue,
        collectionRate,
        outstandingAmount: totalExpectedRevenue - totalActualRevenue,
        propertiesCount: properties.length,
        occupiedUnitsRevenue
      };
    } catch (error) {
      console.error("Error fetching financial overview:", error);
      throw error;
    }
  },

  // Get overview stats for specific property
  getPropertyOverview: async (propertyId) => {
    try {
      const property = await this.getPropertyDetails(propertyId);
      
      return {
        property: {
          id: property.id,
          name: property.name,
          location: property.location,
          category: property.category
        },
        stats: property.stats,
        units: property.units || []
      };
    } catch (error) {
      console.error(`Error fetching property overview for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Get units summary for dashboard
  getUnitsSummary: async () => {
    try {
      const properties = await this.getPropertiesWithDetails();
      
      const summary = {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        maintenanceUnits: 0,
        unitsByProperty: {}
      };

      properties.forEach(property => {
        const propertyStats = {
          total: 0,
          occupied: 0,
          vacant: 0,
          maintenance: 0
        };

        if (property.units && Array.isArray(property.units)) {
          property.units.forEach(unit => {
            summary.totalUnits++;
            propertyStats.total++;

            if (unit.current_tenant && unit.current_tenant.id) {
              summary.occupiedUnits++;
              propertyStats.occupied++;
            } else if (unit.status === 'maintenance') {
              summary.maintenanceUnits++;
              propertyStats.maintenance++;
            } else {
              summary.vacantUnits++;
              propertyStats.vacant++;
            }
          });
        }

        summary.unitsByProperty[property.id] = {
          name: property.name,
          ...propertyStats
        };
      });

      return summary;
    } catch (error) {
      console.error("Error fetching units summary:", error);
      throw error;
    }
  }
};

export default DashboardService;