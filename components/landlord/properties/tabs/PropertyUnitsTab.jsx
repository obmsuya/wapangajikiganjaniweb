// components/landlord/properties/tabs/PropertyUnitsTab.jsx
"use client";

import { useMemo } from "react";
import { 
  Home, 
  Users, 
  Phone, 
  UserPlus, 
  Eye, 
  Square,
  Bed,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudflareTable } from "@/components/cloudflare/Table";

export default function PropertyUnitsTab({ 
  property, 
  floorData, 
  onAssignTenant,
  onViewTenant,
  onVacateTenant,
  onEditUnit
}) {
  const allUnits = useMemo(() => {
    if (!property || !floorData) return [];
    
    const units = [];
    Object.values(floorData).forEach(floor => {
      if (floor.units && Array.isArray(floor.units)) {
        floor.units.forEach(unit => {
          units.push({
            ...unit,
            floor_name: `Floor ${floor.floor_number}`,
            occupancy_status: unit.current_tenant ? 'Occupied' : 'Vacant'
          });
        });
      }
    });
    
    return units;
  }, [property, floorData]);

  // Table columns for units
  const unitsColumns = [
    {
      header: 'Unit',
      accessor: 'unit_name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-400" />
          <div>
            <div className="font-medium">{row.unit_name}</div>
            <div className="text-sm text-gray-500">{row.floor_name}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Details',
      accessor: 'details',
      cell: (row) => (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Square className="h-3 w-3 mr-1" />
            {row.area_sqm || 150} sqm
          </div>
          <div className="flex items-center">
            <Bed className="h-3 w-3 mr-1" />
            {row.rooms || 1} rooms
          </div>
        </div>
      ),
    },
    {
      header: 'Rent',
      accessor: 'rent_amount',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          TSh {parseFloat(row.rent_amount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'available', label: 'Available' },
        { value: 'occupied', label: 'Occupied' },
        { value: 'maintenance', label: 'Maintenance' }
      ],
      cell: (row) => (
        <Badge 
          variant={row.status === 'occupied' ? 'default' : 
                   row.status === 'available' ? 'secondary' : 'destructive'}
        >
          {row.status || 'available'}
        </Badge>
      ),
    },
    {
      header: 'Tenant',
      accessor: 'current_tenant',
      cell: (row) => (
        row.current_tenant ? (
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <div>
              <div className="font-medium">{row.current_tenant.full_name}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {row.current_tenant.phone_number}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">No tenant</span>
        )
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditUnit?.(row)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {row.current_tenant ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTenant?.(row.current_tenant, row)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVacateTenant?.(row.current_tenant, row)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Vacate
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssignTenant?.(row)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">All Units</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {/* Bulk operations */}}
          >
            Bulk Operations
          </Button>
          <Button
            onClick={() => {/* Add new unit */}}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </div>

      <CloudflareTable
        data={allUnits}
        columns={unitsColumns}
        pagination={true}
        searchable={true}
        initialSort={{ field: 'unit_name', direction: 'asc' }}
        emptyMessage="No units found"
      />
    </div>
  );
}