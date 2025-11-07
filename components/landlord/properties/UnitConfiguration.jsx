"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Home, Edit, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UnitConfiguration({ 
  onValidationChange, 
  propertyData, 
  floorData, 
  addUnitData 
}) {
  const [units, setUnits] = useState([]);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate units from floor plans (same logic, only default values)
  const availableUnits = useMemo(() => {
    const generatedUnits = [];
    
    Object.entries(floorData || {}).forEach(([floorNumber, floor]) => {
      if (floor.units_ids && Array.isArray(floor.units_ids)) {
        floor.units_ids.forEach((gridCellId, index) => {
          const unitData = {
            id: `floor-${floorNumber}-unit-${gridCellId}`,
            unit_name: `F${floorNumber}R${index + 1}`, // "Room" instead of "Unit"
            floor_no: parseInt(floorNumber),
            svg_id: gridCellId,
            area_sqm: 150,
            bedrooms: 1,
            status: 'vacant',
            rent_amount: 0,
            payment_freq: 'monthly',
            floor_number: parseInt(floorNumber) - 1,
            svg_geom: `<rect width="40" height="40" x="0" y="0" id="unit-${gridCellId}" fill="green" stroke="gray" stroke-width="2" />`,
            block: propertyData.block || 'A'
          };
          
          generatedUnits.push(unitData);
        });
      }
    });
    
    return generatedUnits;
  }, [floorData, propertyData.block]);

  useEffect(() => {
    setUnits(availableUnits);
  }, [availableUnits]);

  // Validation - only checks if units exist
  const isConfigurationValid = useMemo(() => {
    const newErrors = {};
    
    if (units.length === 0) {
      newErrors.units = 'No rooms available. Please configure floor plans first.';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  }, [units]);

  useEffect(() => {
    // Push every unit to parent (for saving)
    units.forEach(unit => {
      if (addUnitData) {
        addUnitData(unit);
      }
    });
    
    if (onValidationChange) {
      onValidationChange(isConfigurationValid);
    }
  }, [units, addUnitData, isConfigurationValid, onValidationChange]);

  const handleEditUnit = useCallback((unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  }, []);

  const handleSaveUnit = useCallback((unitData) => {
    setUnits(prevUnits => 
      prevUnits.map(unit => 
        unit.id === unitData.id ? unitData : unit
      )
    );
    
    setIsDialogOpen(false);
    setEditingUnit(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUnit(null);
  }, []);

  const configuredUnitsCount = useMemo(() => {
    return units.filter(unit => unit.rent_amount > 0).length;
  }, [units]);

  const totalRentAmount = useMemo(() => {
    return units.reduce((total, unit) => total + (unit.rent_amount || 0), 0);
  }, [units]);

  const unitsByFloor = useMemo(() => {
    return units.reduce((acc, unit) => {
      if (!acc[unit.floor_no]) acc[unit.floor_no] = [];
      acc[unit.floor_no].push(unit);
      return acc;
    }, {});
  }, [units]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Room Configuration</h2>
        <p className="text-muted-foreground">
          Set the monthly rent for each room. All rooms will be saved.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                <p className="text-2xl font-bold">{units.length}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Configured</p>
                <p className="text-2xl font-bold">{configuredUnitsCount}</p>
              </div>
              <Edit className="w-8 h-8 text-green-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Monthly Rent</p>
                <p className="text-lg font-bold">TZS {totalRentAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Rooms by Floor */}
      {units.length === 0 ? (
        <CloudflareCard>
          <CloudflareCardContent className="p-8 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Rooms Available</h3>
            <p className="text-muted-foreground mb-4">
              Please configure floor plans first to generate rooms.
            </p>
          </CloudflareCardContent>
        </CloudflareCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(unitsByFloor).map(([floorNumber, floorUnits]) => (
            <CloudflareCard key={floorNumber}>
              <CloudflareCardHeader 
                title={`Floor ${floorNumber} – ${floorUnits.length} rooms`}
                icon={<Home className="w-5 h-5" />}
              />
              <CloudflareCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {floorUnits.map((unit) => (
                    <motion.div
                      key={unit.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEditUnit(unit)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{unit.unit_name}</h4>
                        <Badge variant={unit.rent_amount > 0 ? "default" : "secondary"}>
                          {unit.rent_amount > 0 ? "Configured" : "Pending"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rent:</span>
                          <span className="font-medium">
                            {unit.rent_amount > 0
                              ? `TZS ${Number(unit.rent_amount).toLocaleString()}`
                              : "Not set"}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={unit.rent_amount > 0 ? "outline" : "default"}
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUnit(unit);
                        }}
                      >
                        {unit.rent_amount > 0 ? "Edit Rent" : "Set Rent"}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CloudflareCardContent>
            </CloudflareCard>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {Object.entries(errors).map(([key, error]) => (
        <div key={key} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      ))}

      {/* Room Configuration Dialog */}
      <UnitConfigDialog
        unit={editingUnit}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveUnit}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  UnitConfigDialog – ONLY rent + optional name
// ──────────────────────────────────────────────────────────────
function UnitConfigDialog({ unit, isOpen, onClose, onSave }) {
  const [rentStr, setRentStr] = useState("");
  const [unitName, setUnitName] = useState("");

  // Load data when dialog opens
  useEffect(() => {
    if (unit) {
      setUnitName(unit.unit_name || "");
      setRentStr(unit.rent_amount ? String(unit.rent_amount) : "");
    }
  }, [unit]);

  // Parse raw input → number
  const parseRent = (val) => {
    const cleaned = val.replace(/[^\d]/g, "");
    return cleaned === "" ? 0 : Number(cleaned);
  };

  // Format number for display
  const formatRent = (num) =>
    num === 0 ? "" : num.toLocaleString();

  const handleSave = useCallback(() => {
    if (!unit) return;

    const updated = {
      ...unit,
      unit_name: unitName || unit.unit_name,
      rent_amount: parseRent(rentStr),

      // Hidden defaults (never shown to user)
      bedrooms: 1,
      area_sqm: 150,
      payment_freq: "monthly",
      status: "vacant"
    };

    onSave(updated);
    onClose();
  }, [unit, unitName, rentStr, onSave, onClose]);

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Room {unit.unit_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* Optional room name */}
          <div>
            <Label htmlFor="unit_name">Room name (optional)</Label>
            <Input
              id="unit_name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g. A1, B2"
            />
          </div>

          {/* Rent input – text field with live formatting */}
          <div>
            <Label htmlFor="rent_amount">Monthly rent (TZS) *</Label>
            <Input
              id="rent_amount"
              type="text"
              inputMode="numeric"
              value={formatRent(parseRent(rentStr))}
              onChange={(e) => setRentStr(e.target.value)}
              placeholder="0"
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {parseRent(rentStr) > 0
                ? `TZS ${parseRent(rentStr).toLocaleString()} per month`
                : "Enter the rent amount"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Room</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}