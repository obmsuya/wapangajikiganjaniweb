"use client";

import { useState, useMemo } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Grid,
  DollarSign,
  Edit,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudflareBreadcrumbs, CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { CloudflareStatCard } from "@/components/cloudflare/Card";
import { usePropertyDetails } from "@/hooks/properties/useProperties";
import PropertyService from "@/services/landlord/property";
import PropertyOverviewTab from "@/components/landlord/properties/tabs/PropertyOverviewTab";
import PropertyUnitsTab from "@/components/landlord/properties/tabs/PropertyUnitsTab";
import PropertyFloorsTab from "@/components/landlord/properties/tabs/PropertyFloorsTab";
import PropertyTenantsTab from "@/components/landlord/properties/tabs/PropertyTenantsTab";
import PropertyPaymentsTab from "@/components/landlord/properties/tabs/PropertyPaymentsTab";
import TenantAssignmentDialog from "@/components/landlord/properties/TenantAssignmentDialog";
import TenantDetailsDialog from "@/components/landlord/properties/TenantDetailsDialog";
import TenantVacationDialog from "@/components/landlord/properties/TenantVacationDialog";
import UnitConfigurationDialog from "@/components/landlord/properties/UnitConfigurationDialog";
import customToast from "@/components/ui/custom-toast";

export default function PropertyDetailsPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { property, loading, error, refreshProperty } = usePropertyDetails(unwrappedParams.id);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [showUnitConfig, setShowUnitConfig] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const handleEditProperty = () => {
    router.push(`/landlord/properties/${unwrappedParams.id}/edit`);
  };

  const handleEditFloor = (floorNumber) => {
    router.push(`/landlord/properties/${unwrappedParams.id}/floors/${floorNumber}/edit`);
  };

  const handleSaveFloorLayout = async (floorNumber, layoutData) => {
    try {
      await PropertyService.bulkUpdateFloorLayout(unwrappedParams.id, {
        [floorNumber]: layoutData
      });
      
      customToast.success("Floor Updated", {
        description: `Floor ${floorNumber} layout has been saved successfully`
      });
      
      refreshProperty();
    } catch (error) {
      console.error('Error saving floor layout:', error);
      customToast.error("Save Failed", {
        description: error.message || "Failed to save floor layout"
      });
    }
  };

  const handleAssignTenant = (unit) => {
    setSelectedUnit(unit);
    setShowAssignDialog(true);
  };

  const handleViewTenant = (tenant, unit) => {
    setSelectedTenant({ ...tenant, unit });
    setShowTenantDetails(true);
  };

  const handleVacateTenant = (tenant, unit) => {
    setSelectedTenant({ ...tenant, unit });
    setShowVacationDialog(true);
  };

  const handleSendReminder = (tenant) => {
    customToast.info("Feature Coming Soon", {
      description: "Send reminder functionality will be available soon"
    });
  };

  const closeDialogs = () => {
    setShowAssignDialog(false);
    setShowTenantDetails(false);
    setShowVacationDialog(false);
    setShowUnitConfig(false);
    setSelectedUnit(null);
    setSelectedTenant(null);
  };

  const handleDialogSuccess = () => {
    refreshProperty();
    closeDialogs();
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setShowUnitConfig(true);
  };

  const processedProperty = useMemo(() => {
    if (!property) return null;
    
    return {
      id: property.id,
      name: property.name || 'Unnamed Property',
      location: property.location || 'Location not specified',
      address: property.address,
      category: property.category || 'Property',
      total_floors: property.total_floors || 1,
      prop_image: property.prop_image,
      units: property.units || [],
      property_floor: property.property_floor || []
    };
  }, [property]);

  const floorData = useMemo(() => {
    if (!processedProperty) return {};
    
    const floors = {};
    
    // Initialize all floors first
    for (let i = 1; i <= processedProperty.total_floors; i++) {
      floors[i] = {
        floor_number: i,
        floor_no: i - 1,
        units: [],
        units_total: 0,
        layout_data: null,
        configured: false,
        occupancy_rate: 0,
        total_rent: 0,
        occupied_units: 0,
        vacant_units: 0
      };
    }
    
    // Process existing floors with enhanced data including tenant information
    if (processedProperty.property_floor && Array.isArray(processedProperty.property_floor)) {
      processedProperty.property_floor.forEach(floor => {
        const floorNumber = floor.floor_no + 1;
        if (floors[floorNumber]) {
          const units = floor.units_floor || [];
          
          // Enhanced tenant processing - ensure current_tenant data is preserved
          const processedUnits = units.map(unit => ({
            ...unit,
            // Ensure current_tenant is properly formatted
            current_tenant: unit.current_tenant ? {
              id: unit.current_tenant.id,
              full_name: unit.current_tenant.full_name,
              phone_number: unit.current_tenant.phone_number,
              email: unit.current_tenant.email,
              move_in_date: unit.current_tenant.move_in_date,
              status: unit.current_tenant.status || 'active',
              emergency_contact_name: unit.current_tenant.emergency_contact_name,
              emergency_contact_phone: unit.current_tenant.emergency_contact_phone,
              emergency_contact_relationship: unit.current_tenant.emergency_contact_relationship
            } : null,
            // Ensure unit status is correct based on tenant presence
            status: unit.current_tenant ? 'occupied' : (unit.status || 'available')
          }));
          
          const occupiedUnits = processedUnits.filter(unit => 
            unit.status === 'occupied' || unit.current_tenant
          ).length;
          
          const totalRent = processedUnits.reduce((sum, unit) => 
            sum + (parseFloat(unit.rent_amount) || 0), 0
          );
          
          // Enhanced floor data with all necessary information
          floors[floorNumber] = {
            ...floors[floorNumber],
            id: floor.id,
            units: processedUnits,
            units_total: floor.units_total || processedUnits.length,
            layout_data: floor.layout_data,
            layout_type: floor.layout_type,
            creation_method: floor.layout_creation_method,
            configured: processedUnits.length > 0,
            occupied_units: occupiedUnits,
            vacant_units: processedUnits.length - occupiedUnits,
            occupancy_rate: processedUnits.length > 0 ? Math.round((occupiedUnits / processedUnits.length) * 100) : 0,
            total_rent: totalRent,
            updated_at: floor.updated_at,
            
            // Grid editing data
            units_ids: processedUnits.map(unit => unit.svg_id).filter(id => id !== undefined),
            
            // Grid configuration for editing
            grid_configuration: floor.grid_configuration || (
              floor.layout_data ? {
                grid_size: 8,
                cell_size: 40,
                selected_cells: processedUnits.map(unit => unit.svg_id).filter(id => id !== undefined),
                layout_type: 'manual_grid'
              } : null
            ),
            
            // Units details for editing
            units_details: processedUnits.map(unit => ({
              svg_id: unit.svg_id,
              unit_name: unit.unit_name,
              area_sqm: unit.area_sqm,
              rooms: unit.rooms,
              rent_amount: unit.rent_amount,
              status: unit.status,
              current_tenant: unit.current_tenant,
              svg_geom: unit.svg_geom,
              floor_number: unit.floor_number,
              utilities: unit.utilities || {},
              payment_freq: unit.payment_freq || 'monthly'
            }))
          };
        }
      });
    }
    
    console.log('Processed floor data with tenants:', floors);
    return floors;
  }, [processedProperty]);

  const propertyStats = useMemo(() => {
    if (!processedProperty || !floorData) return null;

    const totalUnits = Object.values(floorData).reduce((sum, floor) => 
      sum + (floor.units_total || 0), 0
    );
    
    const occupiedUnits = Object.values(floorData).reduce((sum, floor) => 
      sum + (floor.occupied_units || 0), 0
    );
    
    const totalRent = Object.values(floorData).reduce((sum, floor) => 
      sum + (floor.total_rent || 0), 0
    );

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      totalRent,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
    };
  }, [processedProperty, floorData]);

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/landlord/dashboard' },
    { label: 'Properties', href: '/landlord/properties' },
    { label: processedProperty?.name || 'Property Details' }
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/landlord/properties')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Properties
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEditProperty}
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Property
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="Loading..."
          breadcrumbs={breadcrumbItems}
        />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !processedProperty) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="Property Not Found"
          breadcrumbs={breadcrumbItems}
          actions={pageActions}
        />
        <Card>
          <div className="p-6 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
              <h3 className="text-lg font-medium">Error loading property</h3>
              <p>{error?.message || 'Property not found'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto pb-16 space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title={processedProperty.name}
        description={`${processedProperty.location} • ${processedProperty.category}`}
        actions={pageActions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloudflareStatCard
          title="Total Units"
          value={propertyStats?.totalUnits || 0}
          icon={<Home className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Occupied Units"
          value={propertyStats?.occupiedUnits || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Occupancy Rate"
          value={`${propertyStats?.occupancyRate || 0}%`}
          icon={<Grid className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Monthly Revenue"
          value={`TSh ${(propertyStats?.totalRent || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <Card className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="w-full justify-start bg-transparent rounded-none p-0 h-auto">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="units" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Home className="h-4 w-4 mr-2" />
                Units
              </TabsTrigger>
              <TabsTrigger 
                value="floors" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Grid className="h-4 w-4 mr-2" />
                Floor Plans
              </TabsTrigger>
              <TabsTrigger 
                value="tenants" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Users className="h-4 w-4 mr-2" />
                Tenants
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0 p-6">
            <PropertyOverviewTab
              property={processedProperty}
              floorData={floorData}
              onEditProperty={handleEditProperty}
              onEditFloor={handleEditFloor}
            />
          </TabsContent>

          <TabsContent value="units" className="mt-0 p-6">
            <PropertyUnitsTab
              property={processedProperty}
              floorData={floorData}
              onAssignTenant={handleAssignTenant}
              onViewTenant={handleViewTenant}
              onVacateTenant={handleVacateTenant}
              onEditUnit={handleEditUnit}
            />
          </TabsContent>

          <TabsContent value="floors" className="mt-0 p-6">
            <PropertyFloorsTab
              property={processedProperty}
              floorData={floorData}
              onEditFloor={handleEditFloor}
              onSaveFloorLayout={handleSaveFloorLayout}
              refreshProperty={refreshProperty}
            />
          </TabsContent>

          <TabsContent value="tenants" className="mt-0 p-6">
            <PropertyTenantsTab
              property={processedProperty}
              floorData={floorData}
              onViewTenant={handleViewTenant}
              onVacateTenant={handleVacateTenant}
              onSendReminder={handleSendReminder}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-0 p-6">
            <PropertyPaymentsTab
              property={processedProperty}
              floorData={floorData}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {showAssignDialog && selectedUnit && (
        <TenantAssignmentDialog
          unit={selectedUnit}
          isOpen={showAssignDialog}
          onClose={closeDialogs}
          onSuccess={handleDialogSuccess}
        />
      )}

      {showTenantDetails && selectedTenant && (
        <TenantDetailsDialog
          tenant={selectedTenant}
          isOpen={showTenantDetails}
          onClose={closeDialogs}
          onTenantUpdated={handleDialogSuccess}
          onTenantVacated={handleDialogSuccess}
        />
      )}

      {showVacationDialog && selectedTenant && (
        <TenantVacationDialog
          tenant={selectedTenant}
          isOpen={showVacationDialog}
          onClose={closeDialogs}
          onSuccess={handleDialogSuccess}
        />
      )}

      {showUnitConfig && selectedUnit && (
        <UnitConfigurationDialog
          unit={selectedUnit}
          isOpen={showUnitConfig}
          onClose={closeDialogs}
          onSaveSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}