'use client';

import { useState, useEffect } from 'react';
import { useTenantsList } from '@/hooks/admin/useAdminProperties';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  User, 
  Phone, 
  Home, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Filter, 
  Building, 
  MapPin
} from 'lucide-react';

/**
 * PropertyTenantsTable Component
 * Displays a table of all tenants across properties with filtering options
 */
export default function PropertyTenantsTable() {
  const [selectedFilters, setSelectedFilters] = useState({});
  
  // Fetch tenants data using the hook
  const { 
    tenants, 
    limit, 
    loading, 
    filters, 
    updateFilters, 
  } = useTenantsList();

  // Define table columns
  const columns = [
    {
      header: 'Tenant Name',
      accessor: 'full_name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: 'Phone Number',
      accessor: 'phone_number',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.phone_number}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
      cell: (row) => {
        let color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        if (row.status === 'active') {
          color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        } else if (row.status === 'inactive') {
          color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        } else if (row.status === 'pending') {
          color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        }
        
        return (
          <Badge className={`capitalize ${color}`}>
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Current Property',
      accessor: 'current_property',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.current_property || 'None'}</span>
        </div>
      ),
    },
    {
      header: 'Current Unit',
      accessor: 'current_unit',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.current_unit || 'None'}</span>
        </div>
      ),
    },
    {
      header: 'Rent Amount',
      accessor: 'rent_amount',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
          <span>{row.rent_amount ? `$${row.rent_amount}` : 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Registration Date',
      accessor: 'created_at',
      sortable: true,
      type: 'date',
      cell: (row) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span>{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Tenants</h2>
        <Button>Add Tenant</Button>
      </div>

      {/* Application of filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.keys(filters).length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="px-3 py-1">
                {key}: {value}
                <button 
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    const newFilters = { ...filters };
                    delete newFilters[key];
                    updateFilters(newFilters);
                  }}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => updateFilters({})}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Tenants Table */}
      <CloudflareTable
        data={tenants}
        columns={columns}
        loading={loading}
        initialSort={{ field: 'created_at', direction: 'desc' }}
        initialFilters={filters}
        pagination={true}
        searchable={true}
        rowsPerPageOptions={[10, 25, 50, 100]}
        initialRowsPerPage={limit}
        onRowClick={(row) => console.log('Tenant clicked:', row.id)}
        emptyMessage="No tenants found"
      />
    </div>
  );
}

/**
 * PropertyFilters Component
 * Advanced filtering controls for the properties list
 */
export function PropertyFilters({ filters, updateFilters, loading, propertyCategories, owners, locations }) {
  const [localFilters, setLocalFilters] = useState({
    owner_id: filters.owner_id || '',
    category: filters.category || '',
    location: filters.location || '',
    occupancy_min: filters.occupancy_min || 0,
    occupancy_max: filters.occupancy_max || 100,
    created_after: filters.created_after || null,
    created_before: filters.created_before || null
  });
  const [dateRange, setDateRange] = useState({
    from: filters.created_after ? new Date(filters.created_after) : null,
    to: filters.created_before ? new Date(filters.created_before) : null
  });

  // Format date for API
  const formatDate = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters = { ...localFilters };
    
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] === '' || newFilters[key] === null) {
        delete newFilters[key];
      }
    });
    
    // Add date range if set
    if (dateRange.from) {
      newFilters.created_after = formatDate(dateRange.from);
    }
    if (dateRange.to) {
      newFilters.created_before = formatDate(dateRange.to);
    }
    
    updateFilters(newFilters);
  };

  // Reset filters
  const resetFilters = () => {
    setLocalFilters({
      owner_id: '',
      category: '',
      location: '',
      occupancy_min: 0,
      occupancy_max: 100,
      created_after: null,
      created_before: null
    });
    setDateRange({ from: null, to: null });
    updateFilters({});
  };

  // Handle occupancy rate slider change
  const handleOccupancyChange = (value) => {
    setLocalFilters({
      ...localFilters,
      occupancy_min: value[0],
      occupancy_max: value[1]
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Property Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Owner/Landlord Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Owner/Landlord</label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={localFilters.owner_id}
                onValueChange={(value) => setLocalFilters({ ...localFilters, owner_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Owners</SelectItem>
                  {owners?.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Property Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Property Category</label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={localFilters.category}
                onValueChange={(value) => setLocalFilters({ ...localFilters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {propertyCategories?.map((category, index) => (
                    <SelectItem key={index} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={localFilters.location}
                onValueChange={(value) => setLocalFilters({ ...localFilters, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {locations?.map((location, index) => (
                    <SelectItem key={index} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Occupancy Rate Range */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Occupancy Rate Range</label>
            <span className="text-sm text-gray-500">
              {localFilters.occupancy_min}% - {localFilters.occupancy_max}%
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-5 w-full" />
          ) : (
            <Slider
              defaultValue={[localFilters.occupancy_min, localFilters.occupancy_max]}
              max={100}
              min={0}
              step={1}
              onValueChange={handleOccupancyChange}
              className="py-4"
            />
          )}
        </div>

        {/* Date Range Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Creation Date Range</label>
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                      </>
                    ) : (
                      formatDate(dateRange.from)
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {(dateRange.from || dateRange.to) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDateRange({ from: null, to: null })}
              >
                Clear dates
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}