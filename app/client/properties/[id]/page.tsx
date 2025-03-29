import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, Users, Settings, FileText, Calendar, Edit, Trash, 
  ArrowLeft, MapPin, Grid3X3, DollarSign, Percent, AlertTriangle 
} from 'lucide-react';
import AdminPropertyService from '@/services/property';
import { notFound } from 'next/navigation';

/**
 * Generate metadata for the property page
 */
export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const property = await AdminPropertyService.getPropertyDetail(params.id);
    return {
      title: `${property.name} | WaPangajiKiganjani Admin`,
      description: `View and manage details for ${property.name}`,
    };
  } catch (error) {
    return {
      title: `Property Details | WaPangajiKiganjani Admin`,
      description: `View and manage property details, units, and tenants`,
    };
  }
}

/**
 * Property Detail Page Component
 * 
 * Displays detailed information about a specific property including
 * property details, units, tenants, and maintenance records
 */
export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = params.id;
  
  // Fetch property data
  let property;
  let units = [];
  let error = null;
  
  try {
    property = await AdminPropertyService.getPropertyDetail(propertyId);
    
    // Get property units if available
    try {
      const unitsResponse = await AdminPropertyService.getUnits({ property: propertyId });
      units = unitsResponse.results;
    } catch (unitsError) {
      console.error('Error fetching property units:', unitsError);
    }
  } catch (err) {
    console.error('Error fetching property details:', err);
    error = 'Failed to load property details. Please try again later.';
  }
  
  // If property not found, return 404
  if (!property && !error) {
    return notFound();
  }

  // Calculate statistics
  const totalUnits = units.length;
  const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) + '%' : '0%';
  const monthlyRevenue = units.reduce((total, unit) => {
    return unit.status === 'occupied' ? total + (unit.rent_amount || 0) : total;
  }, 0);
  
  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {property && (
        <>
          {/* Header with back button and actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/properties" passHref>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Properties
                </Button>
              </Link>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Edit Property
              </Button>
              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          
          {/* Property Title and Category */}
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="capitalize px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {property.category}
              </span>
              <span className="flex items-center text-sm text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {property.address}
              </span>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center text-gray-500">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Total Rooms/Units
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-2xl font-bold">{totalUnits}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center text-gray-500">
                  <Percent className="h-4 w-4 mr-2" />
                  Occupancy Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-2xl font-bold">{occupancyRate}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center text-gray-500">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-2xl font-bold">KES {monthlyRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  Occupancy
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-2xl font-bold">{occupiedUnits}/{totalUnits}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for Property Details, Units, Tenants, etc. */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="units" className="flex items-center gap-1">
                <Grid3X3 className="h-4 w-4" />
                Units/Rooms
              </TabsTrigger>
              <TabsTrigger value="tenants" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>Detailed information about {property.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Owner</h3>
                        <p className="mt-1">{property.owner?.full_name || 'Not specified'}</p>
                        {property.owner?.phone_number && (
                          <p className="mt-1 text-sm text-gray-500">{property.owner.phone_number}</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Address</h3>
                        <p className="mt-1">{property.address}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Area</h3>
                        <p className="mt-1">{property.total_area} sqm</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Floors</h3>
                        <p className="mt-1">{property.total_floors}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="mt-1 font-mono text-xs">
                          Lat: {property.location?.coordinates[1]}, Long: {property.location?.coordinates[0]}
                        </p>
                        <div className="mt-2 h-40 bg-gray-100 rounded flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-500">Map View (Placeholder)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Units Tab */}
            <TabsContent value="units">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Units/Rooms</CardTitle>
                    <CardDescription>Manage all rooms in this property</CardDescription>
                  </div>
                  <Button size="sm" className="flex items-center gap-1">
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Add Unit
                  </Button>
                </CardHeader>
                <CardContent>
                  {units.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Number</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent (KES)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (sqm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {units.map(unit => (
                            <tr key={unit.id} className="bg-white">
                              <td className="px-4 py-3 text-sm">{unit.unit_number}</td>
                              <td className="px-4 py-3 text-sm">{unit.floor_number}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  unit.status === 'occupied' 
                                    ? 'bg-green-100 text-green-800' 
                                    : unit.status === 'maintenance'
                                    ? 'bg-red-100 text-red-800'
                                    : unit.status === 'reserved'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {unit.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{unit.rent_amount?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm">{unit.area}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {unit.status === 'available' ? (
                                    <Button variant="ghost" size="sm" className="text-green-600">
                                      <Users className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="sm" className="text-amber-600">
                                      <Calendar className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10 border rounded-md">
                      No units found for this property
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Placeholder content for other tabs */}
            <TabsContent value="tenants">
              <Card>
                <CardHeader>
                  <CardTitle>Property Tenants</CardTitle>
                  <CardDescription>Manage tenants for this property</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-10">
                    Tenant management content will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Records</CardTitle>
                  <CardDescription>Track maintenance requests and history</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-10">
                    Maintenance records will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Property Documents</CardTitle>
                  <CardDescription>Manage property-related documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-10">
                    Property documents will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 