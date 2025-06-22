// services/landlord/dashboard.js
import api from '@/lib/api/api-client';
import PropertyService from './property';
import TenantService from './tenant';

const DashboardService = {
  // Get comprehensive dashboard statistics
  getDashboardStats: async () => {
    try {
      // Get properties and tenants data in parallel
      const [propertiesResponse, tenantsResponse] = await Promise.all([
        PropertyService.getProperties(),
        TenantService.getTenants()
      ]);

      const properties = propertiesResponse.results || propertiesResponse;
      const tenants = tenantsResponse.results || tenantsResponse;

      // Calculate statistics
      const stats = {
        totalProperties: properties.length,
        totalUnits: properties.reduce((total, property) => {
          return total + (property.total_units || 0);
        }, 0),
        totalTenants: tenants.length,
        occupiedUnits: 0,
        vacantUnits: 0,
        totalMonthlyRent: 0,
        overduePayments: 0,
        occupancyRate: 0
      };

      // Calculate more detailed stats by iterating through properties
      for (const property of properties) {
        if (property.property_floor && Array.isArray(property.property_floor)) {
          for (const floor of property.property_floor) {
            if (floor.units_floor && Array.isArray(floor.units_floor)) {
              for (const unit of floor.units_floor) {
                stats.totalMonthlyRent += parseFloat(unit.rent_amount || 0);
                
                if (unit.status === 'occupied') {
                  stats.occupiedUnits++;
                } else if (unit.status === 'available') {
                  stats.vacantUnits++;
                }
              }
            }
          }
        }
      }

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
      const response = await PropertyService.getProperties(filters);
      const properties = response.results || response;

      // Enhance each property with additional calculated data
      const enhancedProperties = await Promise.all(
        properties.map(async (property) => {
          const enhancedProperty = { ...property };
          
          // Calculate property-specific stats
          let totalUnits = 0;
          let occupiedUnits = 0;
          let monthlyRevenue = 0;
          const unitsList = [];

          if (property.property_floor && Array.isArray(property.property_floor)) {
            for (const floor of property.property_floor) {
              if (floor.units_floor && Array.isArray(floor.units_floor)) {
                for (const unit of floor.units_floor) {
                  totalUnits++;
                  monthlyRevenue += parseFloat(unit.rent_amount || 0);
                  
                  // Get tenant information for occupied units
                  let tenantInfo = null;
                  if (unit.status === 'occupied') {
                    occupiedUnits++;
                    try {
                      const tenantResponse = await TenantService.getTenantByUnit(unit.id);
                      tenantInfo = tenantResponse;
                    } catch (error) {
                      console.warn(`Could not fetch tenant for unit ${unit.id}:`, error);
                    }
                  }

                  unitsList.push({
                    ...unit,
                    floorNumber: floor.floor_no,
                    tenant: tenantInfo
                  });
                }
              }
            }
          }

          enhancedProperty.stats = {
            totalUnits,
            occupiedUnits,
            vacantUnits: totalUnits - occupiedUnits,
            occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
            monthlyRevenue,
            annualRevenue: monthlyRevenue * 12
          };

          enhancedProperty.units = unitsList;

          return enhancedProperty;
        })
      );

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

      const property = await PropertyService.getPropertyDetails(propertyId);
      
      // Enhance with unit and tenant details
      const unitsList = [];
      let totalUnits = 0;
      let occupiedUnits = 0;
      let monthlyRevenue = 0;

      if (property.property_floor && Array.isArray(property.property_floor)) {
        for (const floor of property.property_floor) {
          if (floor.units_floor && Array.isArray(floor.units_floor)) {
            for (const unit of floor.units_floor) {
              totalUnits++;
              monthlyRevenue += parseFloat(unit.rent_amount || 0);
              
              // Get tenant information for occupied units
              let tenantInfo = null;
              if (unit.status === 'occupied') {
                occupiedUnits++;
                try {
                  const tenantResponse = await TenantService.getTenantByUnit(unit.id);
                  tenantInfo = tenantResponse;
                } catch (error) {
                  console.warn(`Could not fetch tenant for unit ${unit.id}:`, error);
                }
              }

              unitsList.push({
                ...unit,
                floorNumber: floor.floor_no,
                tenant: tenantInfo
              });
            }
          }
        }
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
        },
        units: unitsList
      };
    } catch (error) {
      console.error(`Error fetching property details for ID ${propertyId}:`, error);
      throw error;
    }
  },

  // Get recent activity (payments, new tenants, etc.)
  getRecentActivity: async (limit = 10) => {
    try {
      // This would combine recent activities from different sources
      // For now, we'll get recent tenants as activity
      const tenantsResponse = await TenantService.getTenants({ 
        ordering: '-created_at',
        limit 
      });
      
      const tenants = tenantsResponse.results || tenantsResponse;
      
      return tenants.map(tenant => ({
        id: tenant.id,
        type: 'tenant_added',
        title: `New tenant: ${tenant.full_name}`,
        description: `Added to property`,
        timestamp: tenant.created_at,
        data: tenant
      }));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  },

  // Get financial overview for a specific period
  getFinancialOverview: async (period = 'month') => {
    try {
      const properties = await this.getPropertiesWithDetails();
      
      let totalRevenue = 0;
      let totalExpectedRevenue = 0;
      let collectionRate = 0;

      properties.forEach(property => {
        totalExpectedRevenue += property.stats.monthlyRevenue;
        // In a real implementation, you'd calculate actual collected revenue
        totalRevenue += property.stats.monthlyRevenue * 0.9; // Assuming 90% collection
      });

      if (totalExpectedRevenue > 0) {
        collectionRate = Math.round((totalRevenue / totalExpectedRevenue) * 100);
      }

      return {
        period,
        totalRevenue,
        totalExpectedRevenue,
        collectionRate,
        outstandingAmount: totalExpectedRevenue - totalRevenue,
        properties: properties.length
      };
    } catch (error) {
      console.error("Error fetching financial overview:", error);
      throw error;
    }
  }
};

export default DashboardService;