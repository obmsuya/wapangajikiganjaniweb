// app/(dashboard)/landlord/properties/[id]/page.jsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  MapPin, 
  Edit, 
  Plus,
  Grid,
  Download,
  Eye,
  Settings,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePropertyDetails } from "@/hooks/properties/useProperties";

export default function PropertyDetailsPage({ params }) {
  const router = useRouter();
  const { property, loading, error, refreshProperty } = usePropertyDetails(params.id);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const handleGoBack = () => {
    router.push("/landlord/properties");
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
    
    for (let i = 1; i <= processedProperty.total_floors; i++) {
      floors[i] = {
        floor_number: i,
        floor_no: i - 1,
        units: [],
        units_total: 0,
        layout_data: null,
        configured: false,
        occupancy_rate: 0,
        total_rent: 0
      };
    }
    
    processedProperty.property_floor.forEach(floor => {
      const floorNumber = floor.floor_no + 1;
      if (floors[floorNumber]) {
        const units = floor.units_floor || [];
        const occupiedUnits = units.filter(unit => 
          unit.status === 'occupied' || unit.current_tenant
        ).length;
        const totalRent = units.reduce((sum, unit) => 
          sum + (parseFloat(unit.rent_amount) || 0), 0
        );
        
        floors[floorNumber] = {
          ...floors[floorNumber],
          id: floor.id,
          units: units,
          units_total: floor.units_total || units.length,
          layout_data: floor.layout_data,
          layout_type: floor.layout_type,
          creation_method: floor.layout_creation_method,
          configured: units.length > 0,
          occupied_units: occupiedUnits,
          vacant_units: units.length - occupiedUnits,
          occupancy_rate: units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0,
          total_rent: totalRent,
          grid_data: units.map(unit => ({
            svg_id: unit.svg_id,
            unit_name: unit.unit_name,
            status: unit.status,
            rent_amount: unit.rent_amount,
            current_tenant: unit.current_tenant
          }))
        };
      }
    });
    
    return floors;
  }, [processedProperty]);

  const propertyStats = useMemo(() => {
    if (!processedProperty) return null;
    
    const totalUnits = processedProperty.units.length;
    const occupiedUnits = processedProperty.units.filter(unit => 
      unit.status === 'occupied' || unit.current_tenant
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
    router.push(`/landlord/properties/${params.id}/floor/${floorNumber}/edit`);
  };

  const handleEditUnit = (unit) => {
    router.push(`/landlord/properties/${params.id}/units/${unit.id}/edit`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !processedProperty) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load property details</p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{processedProperty.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{processedProperty.location}</span>
              <Badge variant="outline">{processedProperty.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Property
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {propertyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-2xl font-bold">{propertyStats.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{propertyStats.occupancyRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {propertyStats.occupiedUnits}/{propertyStats.totalUnits} occupied
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-2xl font-bold">TZS {propertyStats.totalRent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Grid className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Configured Floors</p>
                  <p className="text-2xl font-bold">{propertyStats.configuredFloors}/{propertyStats.totalFloors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {processedProperty.prop_image && (
        <Card>
          <CardContent className="p-0">
            <img 
              src={processedProperty.prop_image} 
              alt={processedProperty.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="floors">Floor Plans</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="mt-1">{processedProperty.address || 'No address provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1">{processedProperty.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Floors</label>
                  <p className="mt-1">{processedProperty.total_floors}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Unit
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Tenants
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="floors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Floor Plans & Layouts</h3>
            <Button onClick={() => handleEditFloorLayout(1)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Floor Layout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(floorData).map(([floorNumber, floor]) => (
              <Card key={floorNumber} className={floor.configured ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Floor {floorNumber}</span>
                    {floor.configured && <Badge variant="secondary">Configured</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {floor.configured ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Units</p>
                          <p className="font-medium">{floor.units_total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Occupancy</p>
                          <p className="font-medium">{floor.occupancy_rate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Occupied</p>
                          <p className="font-medium">{floor.occupied_units}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vacant</p>
                          <p className="font-medium">{floor.vacant_units}</p>
                        </div>
                      </div>

                      {floor.layout_data && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div 
                            dangerouslySetInnerHTML={{ __html: floor.layout_data }}
                            className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-32"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditFloorLayout(parseInt(floorNumber))}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadFloorLayout(parseInt(floorNumber))}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Grid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Floor not configured</p>
                      <Button 
                        size="sm"
                        onClick={() => handleEditFloorLayout(parseInt(floorNumber))}
                      >
                        Configure Layout
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Units Overview</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </div>

          <div className="space-y-6">
            {Object.entries(floorData).map(([floorNumber, floor]) => (
              floor.configured && (
                <Card key={floorNumber}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Floor {floorNumber} Units</span>
                      <Badge variant="outline">{floor.units.length} units</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {floor.units.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floor.units.map((unit) => (
                          <div 
                            key={unit.id} 
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{unit.unit_name}</h4>
                              <Badge 
                                variant={unit.status === 'occupied' ? 'default' : 
                                        unit.status === 'available' ? 'secondary' : 'destructive'}
                              >
                                {unit.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Rooms: {unit.rooms || 1}</p>
                              <p>Area: {unit.area_sqm || 0} sq m</p>
                              <p>Rent: TZS {unit.rent_amount ? parseFloat(unit.rent_amount).toLocaleString() : '0'}</p>
                              {unit.current_tenant && (
                                <p className="text-blue-600">Tenant: {unit.current_tenant.full_name}</p>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditUnit(unit)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No units configured for this floor</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tenant Management</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedProperty.units
              .filter(unit => unit.current_tenant)
              .map((unit) => (
                <Card key={unit.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{unit.current_tenant.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{unit.unit_name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor:</span>
                        <span>{unit.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent:</span>
                        <span>TZS {unit.rent_amount ? parseFloat(unit.rent_amount).toLocaleString() : '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {processedProperty.units.filter(unit => unit.current_tenant).length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No Tenants Yet</h4>
                <p className="text-muted-foreground mb-4">Start by adding tenants to your units</p>
                <Button>Add First Tenant</Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}