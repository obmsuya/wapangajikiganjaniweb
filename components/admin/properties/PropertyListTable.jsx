'use client';

import { useState } from 'react';
import { usePropertiesList, usePropertyDetails } from '@/hooks/admin/useAdminProperties';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, Building, MapPin, User, Calendar, BarChart } from 'lucide-react';

/**
 * PropertiesListTable component that displays a list of properties in a table format
 * Includes filtering, sorting, and a detail view dialog
 */
export default function PropertiesListTable() {
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Fetch properties data using the hook
  const { 
    properties, 
    totalProperties, 
    currentPage, 
    limit, 
    loading, 
    error, 
    filters, 
    updateFilters, 
    updatePagination, 
    refreshProperties 
  } = usePropertiesList();

  // Define table columns
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'mixed', label: 'Mixed Use' },
      ],
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Units',
      accessor: 'total_units',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.total_units}</span>
          <span className="text-xs text-gray-500">
            ({row.total_units ? `${Math.round((row.occupancy_rate / 100) * row.total_units)} occupied` : '0 occupied'})
          </span>
        </div>
      ),
    },
    {
      header: 'Occupancy',
      accessor: 'occupancy_rate',
      sortable: true,
      cell: (row) => {
        const rate = row.occupancy_rate || 0;
        let color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (rate < 50) {
          color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        } else if (rate < 80) {
          color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        }
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${rate}%` }}
              ></div>
            </div>
            <Badge className={color}>{rate}%</Badge>
          </div>
        );
      },
    },
    {
      header: 'Owner',
      accessor: 'owner_name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.owner_name}</span>
        </div>
      ),
    },
    {
      header: 'Created At',
      accessor: 'created_at',
      sortable: true,
      type: 'date',
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'View Details',
          icon: <Eye className="h-4 w-4" />,
          onClick: (row) => {
            setSelectedPropertyId(row.id);
            setIsDetailsOpen(true);
          },
        },
        {
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          onClick: (row) => {
            // Edit property action
            console.log('Edit property', row.id);
          },
        },
      ],
    },
  ];

  // Handle property row click
  const handleRowClick = (row) => {
    setSelectedPropertyId(row.id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Properties</h2>
        <Button>Add Property</Button>
      </div>

      {/* Property Table */}
      <CloudflareTable
        data={properties}
        columns={columns}
        loading={loading}
        initialSort={{ field: 'created_at', direction: 'desc' }}
        initialFilters={filters}
        pagination={true}
        searchable={true}
        rowsPerPageOptions={[10, 25, 50, 100]}
        initialRowsPerPage={limit}
        onRowClick={handleRowClick}
        emptyMessage="No properties found"
      />

      {/* Property Details Dialog */}
      {selectedPropertyId && (
        <PropertyDetailsDialog
          propertyId={selectedPropertyId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </div>
  );
}

/**
 * PropertyDetailsDialog component that displays detailed property information
 * Uses tabs for different property views
 */
function PropertyDetailsDialog({ propertyId, open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { property, loading, error } = usePropertyDetails(propertyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="h-[500px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p>Failed to load property details.</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : property ? (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {property.name}
                </DialogTitle>
                <DialogDescription className="text-blue-100 flex items-center mt-1">
                  <MapPin className="mr-2 h-4 w-4" />
                  {property.location}, {property.address}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <Badge className="bg-blue-500/30 text-white border-blue-400 px-3 py-1">
                  {property.category}
                </Badge>
                <Badge className="bg-blue-500/30 text-white border-blue-400 px-3 py-1">
                  {property.total_floors} Floors
                </Badge>
                <Badge className="bg-blue-500/30 text-white border-blue-400 px-3 py-1">
                  Owner: {property.owner?.name}
                </Badge>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="border-b">
                <TabsList className="p-0 bg-transparent h-12">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent h-12"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="floors"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent h-12"
                  >
                    Floors & Units
                  </TabsTrigger>
                  <TabsTrigger
                    value="tenants"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent h-12"
                  >
                    Tenants
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent h-12"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Property Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Category</p>
                            <p className="font-medium">{property.category}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Area</p>
                            <p className="font-medium">{property.total_area} sqm</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium">{new Date(property.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Floors</p>
                            <p className="font-medium">{property.total_floors}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Owner Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{property.owner?.name}</p>
                            <p className="text-sm text-gray-500">{property.owner?.phone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Occupancy Overview</CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {property.floors?.reduce((acc, floor) => 
                            acc + floor.units?.filter(unit => unit.status === 'occupied').length, 0
                          )} / {property.floors?.reduce((acc, floor) => 
                            acc + (floor.units?.length || 0), 0
                          )} units occupied
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          {property.floors?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={property.floors.map(floor => ({
                                  name: `Floor ${floor.floor_no}`,
                                  total: floor.units?.length || 0,
                                  occupied: floor.units?.filter(unit => unit.status === 'occupied').length || 0,
                                  available: floor.units?.filter(unit => unit.status === 'available').length || 0,
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="occupied" stackId="a" fill="#4CAF50" name="Occupied" />
                                <Bar dataKey="available" stackId="a" fill="#2196F3" name="Available" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                              No floor data available
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Floors & Units Tab */}
                <TabsContent value="floors" className="mt-0">
                  <div className="space-y-6">
                    {property.floors?.length > 0 ? (
                      property.floors.map((floor, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="bg-gray-50 dark:bg-gray-800">
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>Floor {floor.floor_no}</span>
                              <Badge variant="outline">
                                {floor.units_total} Units
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            {floor.units?.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {floor.units.map((unit, uIndex) => {
                                  let statusColor = "border-gray-200 bg-gray-50";
                                  if (unit.status === 'occupied') {
                                    statusColor = "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20";
                                  } else if (unit.status === 'available') {
                                    statusColor = "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20";
                                  } else if (unit.status === 'maintenance') {
                                    statusColor = "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20";
                                  }
                                  
                                  return (
                                    <div 
                                      key={uIndex}
                                      className={`border rounded-lg p-3 ${statusColor}`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{unit.unit_name}</p>
                                          <p className="text-sm text-gray-500">
                                            {unit.area_sqm} sqm · {unit.rent_amount ? `$${unit.rent_amount}` : 'No rent set'}
                                          </p>
                                        </div>
                                        <Badge className="capitalize">
                                          {unit.status}
                                        </Badge>
                                      </div>
                                      
                                      {unit.tenant && (
                                        <div className="mt-3 pt-3 border-t">
                                          <p className="text-sm font-medium">Current Tenant</p>
                                          <p className="text-sm">{unit.tenant.name}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-8 text-center text-gray-500">
                                No units available for this floor
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-500">
                        No floors defined for this property
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tenants Tab */}
                <TabsContent value="tenants" className="mt-0">
                  {property.floors?.some(floor => 
                    floor.units?.some(unit => unit.tenant)
                  ) ? (
                    <CloudflareTable
                      data={property.floors?.flatMap(floor => 
                        floor.units?.filter(unit => unit.tenant).map(unit => ({
                          id: unit.tenant.id,
                          name: unit.tenant.name,
                          phone: unit.tenant.phone_number,
                          unit: unit.unit_name,
                          floor: floor.floor_no,
                          rent: unit.tenant.rent_amount || unit.rent_amount,
                        })) || []
                      )}
                      columns={[
                        {
                          header: 'Name',
                          accessor: 'name',
                          sortable: true,
                        },
                        {
                          header: 'Phone',
                          accessor: 'phone',
                          sortable: true,
                        },
                        {
                          header: 'Unit',
                          accessor: 'unit',
                          sortable: true,
                          cell: (row) => (
                            <div>
                              <span>{row.unit}</span>
                              <span className="text-gray-500 text-xs ml-1">(Floor {row.floor})</span>
                            </div>
                          ),
                        },
                        {
                          header: 'Rent',
                          accessor: 'rent',
                          sortable: true,
                          cell: (row) => <span>${row.rent}</span>,
                        },
                      ]}
                      pagination={true}
                      searchable={true}
                      rowsPerPageOptions={[5, 10, 25]}
                      initialRowsPerPage={10}
                    />
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      No tenants currently occupying this property
                    </div>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0">
                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-7 border-l-2 border-gray-200 dark:border-gray-700"></div>
                    <ul className="space-y-6">
                      <li className="relative pl-10">
                        <div className="absolute left-0 rounded-full w-6 h-6 bg-blue-500 flex items-center justify-center">
                          <Building className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                          <p className="font-medium">Property Created</p>
                          <p className="text-sm text-gray-500">
                            {new Date(property.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                      
                      {/* Additional history items would be here */}
                      <li className="relative pl-10">
                        <div className="absolute left-0 rounded-full w-6 h-6 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <BarChart className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                          <p className="text-gray-500 text-center">No additional history events</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>Property not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}