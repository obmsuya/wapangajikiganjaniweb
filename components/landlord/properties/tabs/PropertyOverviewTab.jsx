// components/landlord/properties/tabs/PropertyOverviewTab.jsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import api from '@/lib/api/api-client';

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function PropertyOverviewTab({ 
  property, 
  floorData, 
  onEditProperty,
  onEditFloor 
}) {
  const [rentSchedules, setRentSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch rent schedules to determine payment status
  useEffect(() => {
    const fetchRentSchedules = async () => {
      if (!property?.id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/payments/rent/schedule/?property_id=${property.id}`);
        
        if (response.success) {
          setRentSchedules(response.schedules || []);
        }
      } catch (error) {
        console.error('Error fetching rent schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRentSchedules();
  }, [property?.id]);

  // Helper function to get payment status for a unit
  const getUnitPaymentStatus = (unit) => {
    if (!unit.current_tenant) {
      return 'vacant';
    }

    // Find rent schedule for this unit
    const unitSchedule = rentSchedules.find(schedule => 
      schedule.unit_id === unit.id || 
      (schedule.unit_name === unit.unit_name && schedule.property_name === property.name)
    );

    if (unitSchedule) {
      if (unitSchedule.is_paid) {
        return 'paid';
      } else if (unitSchedule.days_overdue > 0) {
        return 'overdue';
      } else {
        return 'due';
      }
    }

    // Fallback: if tenant exists but no schedule found, assume due
    return unit.current_tenant ? 'due' : 'vacant';
  };

  const processedFloors = useMemo(() => {
    if (!floorData) return [];

    console.log('Processing floor data for overview:', floorData);

    return Object.entries(floorData)
      .map(([floorNum, floor]) => {
        if (!floor || !floor.units || floor.units.length === 0) return null;

        console.log(`Processing floor ${floorNum}:`, floor);

        const gridCells = floor.units
          .map(unit => {
            const paymentStatus = getUnitPaymentStatus(unit);
            
            return {
              cellIndex: unit.svg_id,
              unitName: unit.unit_name,
              tenant: unit.current_tenant,
              status: unit.status,
              rentAmount: unit.rent_amount,
              paymentStatus: paymentStatus,
              isOccupied: !!unit.current_tenant
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
  }, [floorData, rentSchedules]);

  const generateFloorGrid = (floor) => {
    // Only render cells that have actual units (like SVG export)
    const cells = [];
    
    // Calculate the bounds of the actual layout for proper container sizing
    if (floor.units.length === 0) return cells;
    
    const unitPositions = floor.units.map(unit => ({
      ...unit,
      x: unit.cellIndex % GRID_SIZE,
      y: Math.floor(unit.cellIndex / GRID_SIZE)
    }));

    const minX = Math.min(...unitPositions.map(p => p.x));
    const maxX = Math.max(...unitPositions.map(p => p.x));
    const minY = Math.min(...unitPositions.map(p => p.y));
    const maxY = Math.max(...unitPositions.map(p => p.y));

    floor.units.forEach((unit, index) => {
      const x = (unit.cellIndex % GRID_SIZE - minX) * CELL_SIZE;
      const y = (Math.floor(unit.cellIndex / GRID_SIZE) - minY) * CELL_SIZE;
      
      let cellColor, borderColor, textColor;
      
      // Color based on payment status
      switch (unit.paymentStatus) {
        case 'paid':
          cellColor = '#10b981'; // Green - rent paid
          borderColor = '#047857';
          textColor = '#ffffff';
          break;
        case 'overdue':
          cellColor = '#ef4444'; // Red - rent overdue
          borderColor = '#dc2626';
          textColor = '#ffffff';
          break;
        case 'due':
          cellColor = '#f59e0b'; // Orange - rent due soon
          borderColor = '#d97706';
          textColor = '#ffffff';
          break;
        case 'vacant':
        default:
          cellColor = '#6b7280'; // Gray - vacant
          borderColor = '#4b5563';
          textColor = '#ffffff';
          break;
      }

      cells.push(
        <div
          key={unit.cellIndex}
          className="absolute border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 rounded-sm shadow-sm"
          style={{
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cellColor,
            borderColor: borderColor,
            color: textColor
          }}
          title={`${unit.unitName} - ${
            unit.paymentStatus === 'paid' ? 'Rent Paid' :
            unit.paymentStatus === 'overdue' ? 'Rent Overdue' :
            unit.paymentStatus === 'due' ? 'Rent Due' :
            'Vacant'
          }${unit.tenant ? ` (${unit.tenant.full_name})` : ''}`}
        >
          {index + 1}
        </div>
      );
    });

    // Store layout dimensions for container sizing
    floor.layoutWidth = (maxX - minX + 1) * CELL_SIZE;
    floor.layoutHeight = (maxY - minY + 1) * CELL_SIZE;

    return cells;
  };

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
      {/* Color Legend for Payment Status */}
      <CloudflareCard>
        <CloudflareCardHeader title="Payment Status Legend" />
        <CloudflareCardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
              <span className="text-sm">Rent Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 border-2 border-orange-600 rounded"></div>
              <span className="text-sm">Rent Due</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded"></div>
              <span className="text-sm">Rent Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 border-2 border-gray-600 rounded"></div>
              <span className="text-sm">Vacant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
              <span className="text-sm">No Layout / Empty Floor</span>
            </div>
          </div>
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Floor Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {processedFloors.map((floor) => (
          <CloudflareCard key={floor.floorNumber}>
            <CloudflareCardHeader 
              title={`Floor ${floor.floorNumber}`} 
              subtitle={`${floor.totalUnits} units configured`}
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                {/* Floor Grid Visualization - Only show actual units like SVG export */}
                <div className="flex justify-center">
                  <div 
                    className="relative bg-white rounded-lg p-4"
                    style={{
                      width: floor.layoutWidth + 20 || GRID_SIZE * CELL_SIZE,
                      height: floor.layoutHeight + 20 || GRID_SIZE * CELL_SIZE,
                      minWidth: floor.units.length > 0 ? 'auto' : CELL_SIZE * 2,
                      minHeight: floor.units.length > 0 ? 'auto' : CELL_SIZE * 2
                    }}
                  >
                    {generateFloorGrid(floor)}
                    {floor.units.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No units configured
                      </div>
                    )}
                  </div>
                </div>

                {/* Floor Summary - Simple version without redundant info */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    {floor.totalUnits} units • {floor.occupancyRate}% occupied
                  </p>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Loading payment status...</p>
        </div>
      )}
    </div>
  );
}