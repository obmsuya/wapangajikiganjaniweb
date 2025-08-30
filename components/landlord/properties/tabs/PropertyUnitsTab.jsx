// components/landlord/properties/tabs/PropertyUnitsTab.jsx
"use client";

import { useMemo } from "react";
import {
  Home,
  UserPlus,
  Square,
  Bed,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { usePropertyTenants } from "@/hooks/landlord/useTenantManagement";

export default function PropertyUnitsTab({
  property,
  floorData,
  onAssignTenant,
  onViewTenant,
  onVacateTenant,
  onEditUnit,
}) {
  const { tenants, loading: tenantsLoading } = usePropertyTenants(property);

  const allUnits = useMemo(() => {
    if (!property || !floorData) return [];

    const units = [];
    Object.values(floorData).forEach((floor) => {
      if (floor.units && Array.isArray(floor.units)) {
        floor.units.forEach((unit) => {
          const associatedTenant = tenants.find((tenant) => {
            if (unit.id && tenant.unit_id) {
              return tenant.unit_id === unit.id;
            }
            if (tenant.unit_name && tenant.floor_number) {
              return (
                tenant.unit_name === unit.unit_name && 
                tenant.floor_number === floor.floor_number
              );
            }

            if (unit.svg_id && tenant.unit_svg_id) {
              return tenant.unit_svg_id === unit.svg_id;
            }
            
            if (tenant.unit_name === unit.unit_name) {
              const otherUnitsWithSameTenant = tenants.filter(t => 
                t.unit_name === unit.unit_name && 
                t.floor_number !== floor.floor_number
              );
              return otherUnitsWithSameTenant.length === 0;
            }
            
            return false;
          });

          units.push({
            ...unit,
            unique_unit_id: `${floor.floor_number}-${unit.unit_name}`,
            floor_name: `Floor ${floor.floor_number}`,
            floor_number: floor.floor_number,
            current_tenant: associatedTenant || null,
            occupancy_status: associatedTenant ? "Occupied" : "Vacant",
            status: associatedTenant ? "occupied" : unit.status || "available",
            rent_amount: associatedTenant
              ? associatedTenant.rent_amount
              : unit.rent_amount,
          });
        });
      }
    });

    return units;
  }, [property, floorData, tenants]);

  const unitsColumns = [
    {
      header: "Unit",
      accessor: "unit_name",
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
      header: "Details",
      accessor: "details",
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
      header: "Rent",
      accessor: "rent_amount",
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          TSh {parseFloat(row.rent_amount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: "available", label: "Available" },
        { value: "occupied", label: "Occupied" },
        { value: "maintenance", label: "Maintenance" },
      ],
      cell: (row) => (
        <Badge
          variant={
            row.status === "occupied"
              ? "default"
              : row.status === "available"
              ? "secondary"
              : "destructive"
          }
        >
          {row.status || "available"}
        </Badge>
      ),
    },
    {
      header: "Tenant",
      accessor: "current_tenant",
      cell: (row) =>
        row.current_tenant ? (
          <div className="font-medium text-blue-700">
            {row.current_tenant.tenant.full_name}
          </div>
        ) : (
          <span className="text-gray-400">No tenant</span>
        ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.current_tenant ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditUnit?.(row)}
              className="h-8 px-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssignTenant?.(row)}
                className="h-8 px-2 text-green-600 hover:text-green-700"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditUnit?.(row)}
                className="h-8 px-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Property Units</h3>
          <p className="text-sm text-gray-500">
            Manage units and tenant assignments for this property
          </p>
        </div>
      </div>

      <CloudflareTable
        data={allUnits}
        columns={unitsColumns}
        searchable
        searchPlaceholder="Search units..."
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50],
        }}
        emptyState={{
          title: "No Units Found",
          description: "No units have been configured for this property yet.",
          action: null,
        }}
      />
    </div>
  );
}