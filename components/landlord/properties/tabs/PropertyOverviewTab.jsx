// components/landlord/properties/tabs/PropertyOverviewTab.jsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { AlertCircle, User, Home, Calendar, DollarSign, Phone, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import api from '@/lib/api/api-client';

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function PropertyOverviewTab({
  property,
  floorData,
}) {
  const [tenantsData, setTenantsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!property?.id) return;

      try {
        setLoading(true);
        const tenantsResponse = await api.get(`/api/v1/tenants/property/${property.id}/tenants/`);

        if (tenantsResponse.tenants) {
          setTenantsData(tenantsResponse.tenants);
        }

      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [property?.id]);

  const getUnitPaymentStatus = (unit) => {
    const tenant = tenantsData.find(t =>
      t.unit_id === unit.id ||
      (t.unit_name === unit.unit_name && t.floor_number === parseInt(floorNum))
    );

    if (!tenant) {
      return 'vacant';
    }

    return tenant.payment_status || tenant.full_unit_info?.payment_status || 'due';
  };

  const processedFloors = useMemo(() => {
    if (!floorData) return [];



    return Object.entries(floorData).map(([floorNum, floor]) => {
      if (!floor || !floor.units || floor.units.length === 0) return null;

      const gridCells = floor.units.map(unit => {
        const paymentStatus = getUnitPaymentStatus(unit);

        const tenant = tenantsData.find(t =>
          t.unit_id === unit.id ||
          (t.unit_name === unit.unit_name && t.floor_number === parseInt(floorNum))
        );

        return {
          cellIndex: unit.svg_id,
          unitName: unit.unit_name,
          tenant: tenant?.tenant || unit.current_tenant,
          status: unit.status,
          rentAmount: tenant?.rent_amount || unit.rent_amount,
          paymentStatus: paymentStatus,
          isOccupied: !!tenant?.tenant
        };
      })
        .filter(unit => unit.cellIndex !== undefined && unit.cellIndex !== null)
        .sort((a, b) => a.cellIndex - b.cellIndex);

      const occupiedCount = gridCells.filter(unit => unit.isOccupied).length;
      const occupancyRate = gridCells.length > 0 ? Math.round((occupiedCount / gridCells.length) * 100) : 0;

      return {
        floorNumber: parseInt(floorNum),
        floorNo: floor.floor_no,
        units: gridCells,
        totalUnits: floor.units_total || gridCells.length,
        occupiedUnits: occupiedCount,
        occupancyRate: occupancyRate,
        configured: gridCells.length > 0
      };
    })
      .filter(floor => floor !== null)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [floorData, tenantsData]);

  const generateFloorGrid = (floor) => {
    const cells = [];

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

      let cellColor, borderColor, textColor, statusText;

      switch (unit.paymentStatus) {
        case 'paid':
          cellColor = '#10b981';
          borderColor = '#047857';
          textColor = '#ffffff';
          statusText = 'Rent Paid';
          break;
        case 'overdue':
          cellColor = '#ef4444';
          borderColor = '#dc2626';
          textColor = '#ffffff';
          statusText = 'Rent Overdue';
          break;
        case 'due':
          cellColor = '#f59e0b';
          borderColor = '#d97706';
          textColor = '#ffffff';
          statusText = 'Rent Due';
          break;
        case 'vacant':
        default:
          cellColor = '#6b7280';
          borderColor = '#4b5563';
          textColor = '#ffffff';
          statusText = 'Vacant';
          break;
      }

      cells.push(
        <div
          key={unit.cellIndex}
          className="absolute border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 rounded-sm shadow-sm hover:scale-105 cursor-pointer"
          style={{
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cellColor,
            borderColor: borderColor,
            color: textColor
          }}
          title={`${unit.unitName} - ${statusText}${unit.tenant ? ` (${unit.tenant.full_name})` : ''
            }${unit.rentAmount ? ` - ${unit.rentAmount} TZS` : ''}`}
          onClick={() => handleUnitClick(unit, floor.floorNumber)}
        >
          {index + 1}
        </div>
      );
    });

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
      {/* Payment Status Legend */}
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
          </div>
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Floor Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {processedFloors.map((floor) => (
          <CloudflareCard key={floor.floorNumber}>
            <CloudflareCardHeader
              title={`Floor ${floor.floorNumber}`}
              subtitle={`${floor.totalUnits} units • ${floor.occupancyRate}% occupied`}
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    className="relative bg-white rounded-lg p-4 border border-gray-200"
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

                {/* Detailed Floor Stats */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t">
                  <div>
                    <div className="text-green-600 font-semibold">
                      {floor.units.filter(u => u.paymentStatus === 'paid').length}
                    </div>
                    <div className="text-xs text-gray-500">Paid</div>
                  </div>
                  <div>
                    <div className="text-orange-600 font-semibold">
                      {floor.units.filter(u => u.paymentStatus === 'due').length}
                    </div>
                    <div className="text-xs text-gray-500">Due</div>
                  </div>
                  <div>
                    <div className="text-red-600 font-semibold">
                      {floor.units.filter(u => u.paymentStatus === 'overdue').length}
                    </div>
                    <div className="text-xs text-gray-500">Overdue</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold">
                      {floor.units.filter(u => u.paymentStatus === 'vacant').length}
                    </div>
                    <div className="text-xs text-gray-500">Vacant</div>
                  </div>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Loading payment data...</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {selectedUnit?.unitName || 'Unit Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedUnit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Floor {selectedUnit.floorNumber}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedUnit.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedUnit.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      selectedUnit.paymentStatus === 'due' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                  }`}>
                  {selectedUnit.paymentStatus === 'paid' ? 'Rent Paid' :
                    selectedUnit.paymentStatus === 'overdue' ? 'Rent Overdue' :
                      selectedUnit.paymentStatus === 'due' ? 'Rent Due' : 'Vacant'}
                </span>
              </div>

              {selectedUnit.tenant ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedUnit.tenant.tenant?.full_name || selectedUnit.tenant.full_name}</p>
                      <p className="text-sm text-gray-500">Tenant</p>
                    </div>
                  </div>

                  {selectedUnit.tenant.tenant?.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm">{selectedUnit.tenant.tenant.phone_number}</p>
                        <p className="text-xs text-gray-500">Phone Number</p>
                      </div>
                    </div>
                  )}

                  {selectedUnit.tenant.rent_amount && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{selectedUnit.tenant.rent_amount} TZS</p>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                      </div>
                    </div>
                  )}

                  {selectedUnit.tenant.move_in_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm">{new Date(selectedUnit.tenant.move_in_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Move-in Date</p>
                      </div>
                    </div>
                  )}

                  {selectedUnit.tenant.next_payment_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm">{new Date(selectedUnit.tenant.next_payment_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Next Payment Due</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No tenant assigned</p>
                  <p className="text-sm text-gray-400">This unit is currently vacant</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}