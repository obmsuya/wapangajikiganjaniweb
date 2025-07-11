// components/landlord/properties/tabs/PropertyOverviewTab.jsx
"use client";

import { useMemo } from "react";
import { 
  MapPin, 
  Building2, 
  Grid, 
  Edit,
  Eye,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent, CloudflareStatCard } from "@/components/cloudflare/Card";

export default function PropertyOverviewTab({ 
  property, 
  floorData, 
  onEditProperty,
  onEditFloor 
}) {
  const propertyStats = useMemo(() => {
    if (!property || !floorData) return null;

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
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      averageRent: totalUnits > 0 ? Math.round(totalRent / totalUnits) : 0
    };
  }, [property, floorData]);

  if (!property || !propertyStats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Property Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloudflareStatCard
          title="Total Units"
          value={propertyStats.totalUnits}
          icon={<Grid className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Occupied Units"
          value={propertyStats.occupiedUnits}
          icon={<Users className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Occupancy Rate"
          value={`${propertyStats.occupancyRate}%`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Monthly Revenue"
          value={`TSh ${propertyStats.totalRent.toLocaleString()}`}
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      {/* Property Information & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Property Information"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={onEditProperty}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            }
          />
          <CloudflareCardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-gray-500">{property.address}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">Category</div>
                  <div className="text-sm text-gray-500">{property.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Grid className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">Total Floors</div>
                  <div className="text-sm text-gray-500">{property.total_floors}</div>
                </div>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardHeader title="Financial Summary" />
          <CloudflareCardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Monthly Rent</span>
                <span className="font-medium">TSh {propertyStats.totalRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rent/Unit</span>
                <span className="font-medium">TSh {propertyStats.averageRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Occupancy Rate</span>
                <span className="font-medium">{propertyStats.occupancyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Potential Revenue</span>
                <span className="font-medium">TSh {propertyStats.totalRent.toLocaleString()}</span>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Floor Summary */}
      <CloudflareCard>
        <CloudflareCardHeader 
          title="Floor Summary" 
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditProperty?.()}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit All Floors
            </Button>
          }
        />
        <CloudflareCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(floorData).map((floor) => (
              <Card key={floor.floor_number} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Floor {floor.floor_number}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditFloor?.(floor.floor_number)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {floor.layout_data && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* View floor layout */}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Units:</span>
                    <span>{floor.units_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupied:</span>
                    <span>{floor.occupied_units || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vacant:</span>
                    <span>{floor.vacant_units || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupancy:</span>
                    <span>{floor.occupancy_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span>TSh {(floor.total_rent || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Badge variant={floor.configured ? "default" : "secondary"}>
                      {floor.configured ? "Configured" : "Not Configured"}
                    </Badge>
                    {floor.layout_type && (
                      <span className="text-xs text-gray-500 capitalize">
                        {floor.layout_type}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CloudflareCardContent>
      </CloudflareCard>
    </div>
  );
}