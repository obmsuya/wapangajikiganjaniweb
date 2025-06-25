// app/(dashboard)/landlord/properties/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus, 
  Eye, 
  Calendar,
  Settings,
  Image as ImageIcon,
  ArrowLeft,
  Home,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { usePropertyDetails, useTenantOperations } from "@/hooks/properties/useProperties";
import TenantAssignmentDialog from "@/components/landlord/properties/TenantAssignmentDialog";
import TenantDetailsDialog from "@/components/landlord/properties/TenantDetailsDialog";

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  
  // Use the correct hooks for property details and tenant operations
  const { property, loading, error, refreshProperty } = usePropertyDetails(propertyId);
  const { 
    loading: tenantLoading, 
    error: tenantError, 
    assignTenant, 
    vacateTenant 
  } = useTenantOperations();
  
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);

  const handleAssignTenant = (unit) => {
    setSelectedUnit(unit);
    setShowAssignmentDialog(true);
  };

  const handleViewTenant = (tenant, unit) => {
    setSelectedTenant({ ...tenant, unit });
    setShowTenantDialog(true);
  };

  const handleAssignmentSuccess = async () => {
    setShowAssignmentDialog(false);
    setSelectedUnit(null);
    // Refresh property data to get updated tenant assignments
    await refreshProperty();
  };

  const handleTenantUpdated = async () => {
    // Refresh property data when tenant details are updated
    await refreshProperty();
  };

  const handleTenantVacated = async () => {
    setShowTenantDialog(false);
    setSelectedTenant(null);
    // Refresh property data when tenant is vacated
    await refreshProperty();
  };

  const handleGoBack = () => {
    router.push('/landlord/properties');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Property Details</h2>
              <p className="text-slate-600">Please wait while we fetch the property information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Property</h2>
          <p className="text-slate-600 mb-6">
            {error.message || "There was an error loading the property details."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
            <Button onClick={refreshProperty}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Property not found state
  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h2>
          <p className="text-slate-600 mb-6">
            The property you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  // Process property data using the correct structure from PropertyService
  const processedProperty = {
    id: property.id,
    name: property.name || 'Unnamed Property',
    location: property.location || 'Location not specified',
    address: property.address,
    category: property.category || 'Property',
    total_floors: property.total_floors || 1,
    description: property.description,
    prop_image: property.prop_image,
    images: property.images || [],
    units: property.units || [] // This comes from PropertyService transformation
  };

  // Group units by floor using the correct floor information
  const unitsByFloor = processedProperty.units.reduce((acc, unit) => {
    // Use floor_info from PropertyService transformation or fallback to floor number
    let floorKey = 'Ground Floor';
    
    if (unit.floor_info && unit.floor_info.floor_no !== undefined) {
      floorKey = `Floor ${unit.floor_info.floor_no + 1}`; // Convert from 0-based to 1-based
    } else if (unit.floor !== undefined) {
      floorKey = `Floor ${unit.floor}`;
    } else if (unit.floor_number !== undefined) {
      floorKey = `Floor ${unit.floor_number + 1}`; // Convert from 0-based to 1-based
    }
    
    if (!acc[floorKey]) {
      acc[floorKey] = [];
    }
    acc[floorKey].push(unit);
    return acc;
  }, {});

  // Calculate comprehensive statistics using the correct data structure
  const totalUnits = processedProperty.units.length;
  const occupiedUnits = processedProperty.units.filter(unit => 
    unit.current_tenant && unit.current_tenant.id
  ).length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  
  // FIXED: Calculate revenue from unit rent_amount, not tenant rent_amount
  const totalMonthlyRevenue = processedProperty.units.reduce((sum, unit) => {
    // Use unit.rent_amount if tenant is assigned, otherwise 0
    if (unit.current_tenant && unit.current_tenant.id && unit.rent_amount) {
      return sum + parseFloat(unit.rent_amount);
    }
    return sum;
  }, 0);

  const getOccupancyRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <CloudflarePageHeader
          title={processedProperty.name}
          description={`Manage units and tenants for ${processedProperty.name}`}
          actions={
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
          }
        />

        {/* Enhanced Stats Header */}
        <div className="bg-gradient-to-r from-white to-blue-50 rounded-3xl p-8 mb-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {processedProperty.name}
                </h1>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{processedProperty.location}</span>
                </div>
                {processedProperty.category && (
                  <Badge variant="outline" className="mt-2 bg-slate-100 text-slate-700">
                    {processedProperty.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{totalUnits}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Total Units</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{occupiedUnits}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Occupied</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  TSh {totalMonthlyRevenue > 0 ? (totalMonthlyRevenue / 1000).toFixed(0) + 'K' : '0'}
                </div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Monthly Revenue</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getOccupancyRateColor(occupancyRate)}`}>
                  {occupancyRate}%
                </div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Occupancy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Property Image */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              {processedProperty.prop_image ? (
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-sm mb-4">
                  <img
                    src={processedProperty.prop_image}
                    alt={processedProperty.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center" style={{display: 'none'}}>
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Image not available</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No image available</p>
                  </div>
                </div>
              )}

              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                Property Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Category</div>
                  <div className="text-sm font-medium text-slate-900">
                    {processedProperty.category}
                  </div>
                </div>
                
                {processedProperty.address && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</div>
                    <div className="text-sm text-slate-700">{processedProperty.address}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Floors</div>
                  <div className="text-sm font-medium text-slate-900">{processedProperty.total_floors}</div>
                </div>
                
                {processedProperty.description && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</div>
                    <div className="text-sm text-slate-700 leading-relaxed">{processedProperty.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-11 rounded-xl border-slate-200 hover:bg-slate-50">
                  <Settings className="w-4 h-4 mr-3 text-slate-600" />
                  Edit Property
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-11 rounded-xl border-slate-200 hover:bg-slate-50">
                  <Calendar className="w-4 h-4 mr-3 text-slate-600" />
                  Payment Reports
                </Button>
              </div>
            </div>
          </div>

          {/* Units Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Units & Tenants</h2>
                  <p className="text-slate-600">Manage your property units and tenant assignments</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-blue-50 border-blue-200 text-blue-700 rounded-xl">
                  {occupiedUnits} of {totalUnits} occupied
                </Badge>
              </div>
            </div>

            {totalUnits === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-20 text-center shadow-sm">
                <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Building2 className="w-14 h-14 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">No units found</h3>
                <p className="text-slate-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                  This property doesn't have any units set up yet. Add units to start managing tenants and collecting rent.
                </p>
                <Button size="lg" className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-semibold">
                  <Plus className="w-6 h-6 mr-3" />
                  Add Units
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(unitsByFloor).map(([floorName, units]) => (
                  <div key={floorName} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-6 mb-8">
                      <h3 className="text-xl font-bold text-slate-800">{floorName}</h3>
                      <div className="h-px bg-slate-300 flex-1"></div>
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                        {units.length} unit{units.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {units.map((unit) => (
                        <UnitCard
                          key={unit.id}
                          unit={unit}
                          onAssignTenant={handleAssignTenant}
                          onViewTenant={handleViewTenant}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tenant Assignment Dialog */}
      {showAssignmentDialog && selectedUnit && (
        <TenantAssignmentDialog
          unit={selectedUnit}
          isOpen={showAssignmentDialog}
          onClose={() => {
            setShowAssignmentDialog(false);
            setSelectedUnit(null);
          }}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Tenant Details Dialog */}
      {showTenantDialog && selectedTenant && (
        <TenantDetailsDialog
          tenant={selectedTenant}
          isOpen={showTenantDialog}
          onClose={() => {
            setShowTenantDialog(false);
            setSelectedTenant(null);
          }}
          onTenantUpdated={handleTenantUpdated}
          onTenantVacated={handleTenantVacated}
        />
      )}
    </div>
  );
}

// Enhanced Unit Card Component with better tenant data handling
function UnitCard({ unit, onAssignTenant, onViewTenant }) {
  const hasCurrentTenant = unit.current_tenant && unit.current_tenant.id;
  
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-7 hover:shadow-xl transition-all duration-300 hover:border-slate-300 group hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-slate-900 text-xl">
          {unit.unit_name || `Unit ${unit.id}`}
        </h4>
        <Badge 
          variant={hasCurrentTenant ? "default" : "secondary"}
          className={`text-sm px-3 py-1 font-medium rounded-lg ${
            hasCurrentTenant 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {hasCurrentTenant ? "Occupied" : "Vacant"}
        </Badge>
      </div>

      {hasCurrentTenant ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 text-base">
                  {unit.current_tenant.full_name || 'Tenant Name'}
                </div>
                <div className="text-sm text-slate-500">Tenant</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-base">
                  {/* Use unit rent_amount, not tenant rent_amount */}
                  TSh {parseFloat(unit.rent_amount || 0).toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Monthly Rent</div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewTenant(unit.current_tenant, unit)}
            className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 group-hover:border-blue-300 group-hover:text-blue-600 font-medium text-base"
          >
            <Eye className="w-5 h-5 mr-2" />
            View Details
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4 text-base text-slate-600">
            {unit.area_sqm && (
              <div className="flex justify-between items-center py-2">
                <span>Size:</span>
                <span className="font-semibold text-slate-900">{unit.area_sqm} sq m</span>
              </div>
            )}
            {unit.rent_amount && (
              <div className="flex justify-between items-center py-2">
                <span>Rent:</span>
                <span className="font-semibold text-slate-900">
                  TSh {parseFloat(unit.rent_amount).toLocaleString()}
                </span>
              </div>
            )}
            {unit.rooms && (
              <div className="flex justify-between items-center py-2">
                <span>Rooms:</span>
                <span className="font-semibold text-slate-900">{unit.rooms}</span>
              </div>
            )}
            {unit.status && (
              <div className="flex justify-between items-center py-2">
                <span>Status:</span>
                <span className="font-semibold text-slate-900 capitalize">{unit.status}</span>
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => onAssignTenant(unit)}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg group-hover:shadow-xl transition-all font-medium text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Assign Tenant
          </Button>
        </div>
      )}
    </div>
  );
}