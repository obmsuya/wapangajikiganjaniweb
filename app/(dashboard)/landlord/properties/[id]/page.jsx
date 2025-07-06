// app/(dashboard)/landlord/properties/[id]/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit,
  MoreHorizontal,
  Eye,
  Download,
  Grid3X3,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { usePropertyDetails } from "@/hooks/properties/useProperties";
import FloorLayoutEditor from "@/components/landlord/properties/FloorLayoutEditor";
import UnitConfigModal from "@/components/landlord/properties/UnitConfigModal";

export default function PropertyDetailPage({ params }) {
  const propertyId = params.id;
  const router = useRouter();
  
  const { property, loading, error, refreshProperty } = usePropertyDetails(propertyId);
  
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [showUnitConfig, setShowUnitConfig] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleGoBack = () => {
    router.push("/landlord/properties");
  };

  // Process property data using the correct structure from PropertyService
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

  // Group units by floor and create floor data structure
  const floorData = useMemo(() => {
    if (!processedProperty) return {};
    
    const floors = {};
    
    // Initialize floors based on total_floors
    for (let i = 1; i <= processedProperty.total_floors; i++) {
      floors[i] = {
        floor_number: i,
        units: [],
        units_total: 0,
        layout_data: null,
        configured: false
      };
    }
    
    // Add layout data from property_floor if available
    processedProperty.property_floor.forEach(floor => {
      const floorNumber = floor.floor_no + 1; // Convert from 0-based to 1-based
      if (floors[floorNumber]) {
        floors[floorNumber].layout_data = floor.layout_data;
        floors[floorNumber].layout_type = floor.layout_type;
        floors[floorNumber].creation_method = floor.layout_creation_method;
        floors[floorNumber].configured = true;
        floors[floorNumber].units_total = floor.units_total || 0;
      }
    });
    
    // Add units to respective floors
    processedProperty.units.forEach(unit => {
      let floorNumber = 1; // Default to ground floor
      
      if (unit.floor_info && unit.floor_info.floor_no !== undefined) {
        floorNumber = unit.floor_info.floor_no + 1; // Convert from 0-based to 1-based
      } else if (unit.floor !== undefined) {
        floorNumber = unit.floor;
      } else if (unit.floor_number !== undefined) {
        floorNumber = unit.floor_number + 1; // Convert from 0-based to 1-based
      }
      
      if (floors[floorNumber]) {
        floors[floorNumber].units.push(unit);
      }
    });
    
    return floors;
  }, [processedProperty]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!processedProperty) return { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0, totalRent: 0, configuredFloors: 0, totalFloors: 0 };
    
    const totalUnits = processedProperty.units.length;
    const occupiedUnits = processedProperty.units.filter(unit => 
      unit.current_tenant && unit.current_tenant.id
    ).length;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    const totalRent = processedProperty.units.reduce((sum, unit) => 
      sum + (parseFloat(unit.rent_amount) || 0), 0
    );
    
    const configuredFloors = Object.values(floorData).filter(floor => floor.configured).length;
    
    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      totalRent,
      configuredFloors,
      totalFloors: processedProperty.total_floors
    };
  }, [processedProperty, floorData]);

  const handleEditFloorLayout = (floorNumber) => {
    setSelectedFloor(floorNumber);
    setShowLayoutEditor(true);
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setShowUnitConfig(true);
  };

  const handleDownloadFloorLayout = (floorNumber) => {
    const floor = floorData[floorNumber];
    if (floor && floor.layout_data) {
      const blob = new Blob([floor.layout_data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${processedProperty.name}-floor-${floorNumber}-layout.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Define columns for units table
  const unitColumns = [
    {
      header: 'Unit',
      accessor: 'unit_name',
      sortable: true,
      cell: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      header: 'Floor',
      accessor: 'floor',
      sortable: true,
      cell: (value) => `Floor ${value || 1}`
    },
    {
      header: 'Bedrooms',
      accessor: 'rooms',
      sortable: true,
      cell: (value) => `${value || 1} bed`
    },
    {
      header: 'Area',
      accessor: 'area_sqm',
      sortable: true,
      cell: (value) => `${value || 0} sq m`
    },
    {
      header: 'Rent',
      accessor: 'rent_amount',
      sortable: true,
      cell: (value) => value ? `TZS ${parseFloat(value).toLocaleString()}` : 'Not set'
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value) => (
        <Badge variant={value === 'occupied' ? 'default' : 'secondary'}>
          {value || 'vacant'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditUnit(row)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Unit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !processedProperty) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <CloudflareCard>
            <CloudflareCardContent>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  {error?.message || "Property not found"}
                </h3>
                <Button onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Properties
                </Button>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <CloudflarePageHeader
          title={processedProperty.name}
          description={`${processedProperty.category} • ${processedProperty.location}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CloudflareCard>
            <CloudflareCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Floors</p>
                  <p className="text-2xl font-bold">{stats.configuredFloors}/{stats.totalFloors}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CloudflareCardContent>
          </CloudflareCard>

          <CloudflareCard>
            <CloudflareCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Units</p>
                  <p className="text-2xl font-bold">{stats.totalUnits}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">{stats.totalUnits}</span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>

          <CloudflareCard>
            <CloudflareCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stats.occupancyRate >= 80 ? 'bg-green-100' : 
                  stats.occupancyRate >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className={`font-bold ${
                    stats.occupancyRate >= 80 ? 'text-green-600' : 
                    stats.occupancyRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.occupancyRate}%
                  </span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>

          <CloudflareCard>
            <CloudflareCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                  <p className="text-lg font-bold">TZS {stats.totalRent.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xs font-bold">TZS</span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="floors">Floor Plans</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CloudflareCard>
                  <CloudflareCardHeader 
                    title="Property Information"
                    icon={<Building2 className="w-5 h-5" />}
                  />
                  <CloudflareCardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Address</p>
                        <p className="font-medium">{processedProperty.address || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <Badge variant="outline">{processedProperty.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Floors</p>
                        <p className="font-medium">{processedProperty.total_floors}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Units</p>
                        <p className="font-medium">{stats.totalUnits}</p>
                      </div>
                    </div>
                  </CloudflareCardContent>
                </CloudflareCard>
              </div>

              <div>
                <CloudflareCard>
                  <CloudflareCardHeader title="Property Image" />
                  <CloudflareCardContent>
                    {processedProperty.prop_image ? (
                      <img
                        src={processedProperty.prop_image}
                        alt={processedProperty.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </CloudflareCardContent>
                </CloudflareCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="floors" className="space-y-6">
            <CloudflareCard>
              <CloudflareCardHeader 
                title="Floor Plans"
                icon={<Grid3X3 className="w-5 h-5" />}
              />
              <CloudflareCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(floorData).map(([floorNumber, floor]) => (
                    <div key={floorNumber} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Floor {floorNumber}</h4>
                        {floor.configured && (
                          <Badge variant="secondary">Configured</Badge>
                        )}
                      </div>

                      {/* Layout Preview */}
                      {floor.layout_data ? (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div 
                            className="w-full h-24 overflow-hidden flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: floor.layout_data }}
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3 h-24 flex items-center justify-center">
                          <span className="text-sm text-gray-500">No layout configured</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 mb-3">
                        <p>Units: {floor.units_total || 0}</p>
                        <p>Layout: {floor.layout_type || 'Manual'}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditFloorLayout(parseInt(floorNumber))}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {floor.configured ? 'Edit' : 'Configure'}
                        </Button>
                        {floor.layout_data && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFloorLayout(parseInt(floorNumber))}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CloudflareCardContent>
            </CloudflareCard>
          </TabsContent>

          <TabsContent value="units" className="space-y-6">
            <CloudflareCard>
              <CloudflareCardHeader title="Unit Management" />
              <CloudflareCardContent>
                <CloudflareTable
                  data={processedProperty.units}
                  columns={unitColumns}
                  pagination={true}
                  searchable={true}
                  emptyMessage="No units found for this property."
                  initialRowsPerPage={10}
                />
              </CloudflareCardContent>
            </CloudflareCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floor Layout Editor Modal */}
      {showLayoutEditor && (
        <Dialog open={showLayoutEditor} onOpenChange={setShowLayoutEditor}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Floor {selectedFloor} Layout</DialogTitle>
            </DialogHeader>
            <FloorLayoutEditor
              propertyId={propertyId}
              floorNumber={selectedFloor}
              existingLayout={floorData[selectedFloor]}
              onSave={() => {
                setShowLayoutEditor(false);
                refreshProperty();
              }}
              onCancel={() => setShowLayoutEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Unit Configuration Modal */}
      {showUnitConfig && selectedUnit && (
        <Dialog open={showUnitConfig} onOpenChange={setShowUnitConfig}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure Unit: {selectedUnit.unit_name}</DialogTitle>
            </DialogHeader>
            <UnitConfigModal
              unit={selectedUnit}
              onSave={() => {
                setShowUnitConfig(false);
                setSelectedUnit(null);
                refreshProperty();
              }}
              onCancel={() => {
                setShowUnitConfig(false);
                setSelectedUnit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}