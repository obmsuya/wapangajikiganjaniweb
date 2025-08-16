// components/landlord/properties/tabs/PropertyOverviewTab.jsx
"use client";

import { useMemo } from "react";
import { Building2, Users, Eye, Grid3X3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function PropertyOverviewTab({ 
  property, 
  floorData, 
  onEditProperty,
  onEditFloor 
}) {
  const processedFloors = useMemo(() => {
    if (!floorData) return [];

    console.log('Processing floor data for overview:', floorData);

    return Object.entries(floorData)
      .map(([floorNum, floor]) => {
        if (!floor || !floor.units || floor.units.length === 0) return null;

        console.log(`Processing floor ${floorNum}:`, floor);

        const gridCells = floor.units
          .map(unit => {
            const isOccupied = unit.status === 'occupied' || unit.current_tenant;
            const hasPaidTenant = isOccupied && unit.current_tenant?.status === 'active';
            
            console.log(`Unit ${unit.unit_name}:`, {
              status: unit.status,
              current_tenant: unit.current_tenant,
              isOccupied,
              hasPaidTenant
            });
            
            return {
              cellIndex: unit.svg_id,
              unitName: unit.unit_name,
              tenant: unit.current_tenant,
              status: unit.status,
              rentAmount: unit.rent_amount,
              isOccupied: isOccupied,
              hasPayment: hasPaidTenant,
              hasUnpaidTenant: isOccupied && (!unit.current_tenant || unit.current_tenant?.status !== 'active')
            };
          })
          .filter(unit => unit.cellIndex !== undefined && unit.cellIndex !== null)
          .sort((a, b) => a.cellIndex - b.cellIndex);

        return {
          floorNumber: parseInt(floorNum),
          floorNo: floor.floor_no,
          units: gridCells,
          totalUnits: floor.units_total || 0,
          occupiedUnits: floor.occupied_units || 0,
          occupancyRate: floor.occupancy_rate || 0,
          totalRent: floor.total_rent || 0,
          configured: floor.configured || gridCells.length > 0
        };
      })
      .filter(floor => floor !== null)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [floorData]);

  const generateFloorGrid = (floor) => {
    const cells = [];
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const unit = floor.units.find(u => u.cellIndex === i);
      const x = (i % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;

      let cellColor = '#f3f4f6'; 
      let borderColor = '#d1d5db';
      let textColor = '#6b7280';
      let unitNumber = '';

      if (unit) {
        unitNumber = floor.units.findIndex(u => u.cellIndex === i) + 1;
        
        if (unit.isOccupied) {
          if (unit.hasPayment) {
            cellColor = '#10b981'; 
            borderColor = '#047857';
            textColor = '#ffffff';
          } else {
            cellColor = '#f59e0b'; 
            borderColor = '#d97706';
            textColor = '#ffffff';
          }
        } else {
          cellColor = '#6b7280'; 
          borderColor = '#4b5563';
          textColor = '#ffffff';
        }
      }

      cells.push(
        <div
          key={i}
          className="absolute border-2 flex items-center justify-center text-xs font-bold transition-all duration-200"
          style={{
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cellColor,
            borderColor: borderColor,
            color: textColor
          }}
          title={unit ? `${unit.unitName} - ${unit.isOccupied ? (unit.tenant ? unit.tenant.full_name : 'Occupied') : 'Vacant'}` : 'Empty'}
        >
          {unitNumber}
        </div>
      );
    }

    return cells;
  };

  const propertyStats = useMemo(() => {
    if (!property || !processedFloors.length) return null;

    const totalUnits = processedFloors.reduce((sum, floor) => sum + floor.totalUnits, 0);
    const occupiedUnits = processedFloors.reduce((sum, floor) => sum + floor.occupiedUnits, 0);
    const totalRent = processedFloors.reduce((sum, floor) => sum + floor.totalRent, 0);

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      totalRent,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
    };
  }, [property, processedFloors]);

  if (!property) {
    return <div>Loading...</div>;
  }

  if (!processedFloors.length) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No floor plans configured for this property. Use the "Floors & Units" tab to create floor layouts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Summary Stats */}
      {propertyStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-600">Total Units</p>
            </div>
            <h3 className="text-2xl font-bold text-blue-700">{propertyStats.totalUnits}</h3>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-600">Occupied</p>
            </div>
            <h3 className="text-2xl font-bold text-green-700">{propertyStats.occupiedUnits}</h3>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-gray-600">Occupancy Rate</p>
            </div>
            <h3 className="text-2xl font-bold text-amber-700">{propertyStats.occupancyRate}%</h3>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-600">Monthly Revenue</p>
            </div>
            <h3 className="text-2xl font-bold text-purple-700">TSh {propertyStats.totalRent.toLocaleString()}</h3>
          </div>
        </div>
      )}

      {/* Color Legend */}
      <CloudflareCard>
        <CloudflareCardHeader title="Unit Status Legend" />
        <CloudflareCardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
              <span className="text-sm">Occupied & Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 border-2 border-orange-600 rounded"></div>
              <span className="text-sm">Occupied & Unpaid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 border-2 border-gray-600 rounded"></div>
              <span className="text-sm">Vacant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
              <span className="text-sm">Empty Space</span>
            </div>
          </div>
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Floor Plans Grid */}
      <div className="space-y-6">
        {processedFloors.map((floor) => (
          <CloudflareCard key={floor.floorNumber}>
            <CloudflareCardHeader 
              title={`Floor ${floor.floorNumber}`}
              subtitle={`${floor.totalUnits} units • ${floor.occupancyRate}% occupied • TSh ${floor.totalRent.toLocaleString()}/month`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditFloor(floor.floorNumber)}
                  className="flex items-center gap-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Edit Layout
                </Button>
              }
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                {/* Floor Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {floor.totalUnits} Total Units
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {floor.occupiedUnits} Occupied
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {floor.totalUnits - floor.occupiedUnits} Vacant
                    </Badge>
                  </div>
                </div>

                {/* Floor Grid Visualization */}
                <div className="flex justify-center">
                  <div 
                    className="relative border-2 border-gray-300 bg-gray-50 rounded-lg"
                    style={{
                      width: GRID_SIZE * CELL_SIZE,
                      height: GRID_SIZE * CELL_SIZE
                    }}
                  >
                    {generateFloorGrid(floor)}
                  </div>
                </div>

                {/* Floor Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Occupancy Rate</p>
                    <p className="text-lg font-semibold">{floor.occupancyRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                    <p className="text-lg font-semibold">TSh {floor.totalRent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Average Rent</p>
                    <p className="text-lg font-semibold">
                      TSh {floor.totalUnits > 0 ? Math.round(floor.totalRent / floor.totalUnits).toLocaleString() : 0}
                    </p>
                  </div>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        ))}
      </div>
    </div>
  );
}