// components/landlord/properties/PropertyDetailsDialog.jsx
"use client";

import { useState } from "react";
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
  X,
  Home,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TenantAssignmentDialog from "./TenantAssignmentDialog";
import TenantDetailsDialog from "./TenantDetailsDialog";

export default function PropertyDetailsDialog({ property, isOpen, onClose, onPropertyUpdated }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);

  if (!property) return null;

  const handleAssignTenant = (unit) => {
    setSelectedUnit(unit);
    setShowAssignmentDialog(true);
  };

  const handleViewTenant = (tenant, unit) => {
    setSelectedTenant({ ...tenant, unit });
    setShowTenantDialog(true);
  };

  const handleAssignmentSuccess = () => {
    setShowAssignmentDialog(false);
    setSelectedUnit(null);
    onPropertyUpdated?.();
  };

  const handleTenantUpdated = () => {
    onPropertyUpdated?.();
  };

  const handleTenantVacated = () => {
    setShowTenantDialog(false);
    setSelectedTenant(null);
    onPropertyUpdated?.();
  };

  // Group units by floor for better organization
  const unitsByFloor = property.units?.reduce((acc, unit) => {
    const floor = unit.floor_info?.floor_no || unit.floor || 'Ground Floor';
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(unit);
    return acc;
  }, {}) || {};

  // Calculate statistics
  const totalUnits = property.units?.length || 0;
  const occupiedUnits = property.units?.filter(unit => unit.current_tenant)?.length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalMonthlyRevenue = property.units?.reduce((sum, unit) => {
    return sum + (unit.current_tenant ? parseFloat(unit.current_tenant.rent_amount || 0) : 0);
  }, 0) || 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{property.name || property.property_name}</h2>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{totalUnits}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Total Units</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{occupiedUnits}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Occupied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">TSh {(totalMonthlyRevenue / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Monthly Revenue</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${occupancyRate >= 80 ? 'text-green-600' : occupancyRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {occupancyRate}%
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Occupancy Rate</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="rounded-full w-10 h-10 p-0 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-slate-50/80 border-r border-slate-200 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Property Image */}
                <div className="space-y-4">
                  {property.images?.length > 0 || property.prop_image ? (
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={property.images?.[0]?.image_url || property.prop_image}
                        alt={property.name || property.property_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No image available</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No image available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    Property Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Category</div>
                      <div className="text-sm font-medium text-slate-900">
                        {property.category || property.property_type?.name || 'Property'}
                      </div>
                    </div>
                    
                    {property.address && (
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</div>
                        <div className="text-sm text-slate-700">{property.address}</div>
                      </div>
                    )}
                    
                    {property.total_floors && (
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Floors</div>
                        <div className="text-sm font-medium text-slate-900">{property.total_floors}</div>
                      </div>
                    )}
                    
                    {property.description && (
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</div>
                        <div className="text-sm text-slate-700 leading-relaxed">{property.description}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
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
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-slate-900">Units & Tenants</h3>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-50 border-blue-200 text-blue-700">
                      {occupiedUnits} of {totalUnits} occupied
                    </Badge>
                  </div>
                  <p className="text-slate-600">Manage your property units and tenant assignments</p>
                </div>

                {totalUnits === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No units found</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      This property doesn't have any units set up yet. Add units to start managing tenants and collecting rent.
                    </p>
                    <Button size="lg" className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Units
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {Object.entries(unitsByFloor).map(([floor, units]) => (
                      <div key={floor}>
                        <div className="flex items-center gap-4 mb-6">
                          <h4 className="text-lg font-semibold text-slate-800">{floor}</h4>
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {units.length} unit{units.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {units.map((unit) => (
                            <div 
                              key={unit.id} 
                              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-slate-300 group"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-slate-900 text-lg">{unit.unit_name}</h5>
                                <Badge 
                                  variant={unit.current_tenant ? "default" : "secondary"}
                                  className={`text-xs px-2 py-1 ${
                                    unit.current_tenant 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {unit.current_tenant ? "Occupied" : "Vacant"}
                                </Badge>
                              </div>

                              {unit.current_tenant ? (
                                <div className="space-y-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-slate-900 text-sm">
                                          {unit.current_tenant.full_name}
                                        </div>
                                        <div className="text-xs text-slate-500">Tenant</div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-purple-600" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-900 text-sm">
                                          TSh {parseFloat(unit.current_tenant.rent_amount || 0).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-500">Monthly Rent</div>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewTenant(unit.current_tenant, unit)}
                                    className="w-full h-10 rounded-xl border-slate-200 hover:bg-slate-50 group-hover:border-blue-300 group-hover:text-blue-600"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="space-y-3 text-sm text-slate-600">
                                    {unit.unit_type && (
                                      <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span className="font-medium text-slate-900">{unit.unit_type}</span>
                                      </div>
                                    )}
                                    {unit.area_sqm && (
                                      <div className="flex justify-between">
                                        <span>Size:</span>
                                        <span className="font-medium text-slate-900">{unit.area_sqm} sq m</span>
                                      </div>
                                    )}
                                    {unit.rent_amount && (
                                      <div className="flex justify-between">
                                        <span>Rent:</span>
                                        <span className="font-medium text-slate-900">TSh {parseFloat(unit.rent_amount).toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    onClick={() => handleAssignTenant(unit)}
                                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow group-hover:shadow-lg transition-all"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Assign Tenant
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
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
    </>
  );
}