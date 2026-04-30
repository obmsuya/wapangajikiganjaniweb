"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Home, Edit } from "lucide-react";
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

  const availableUnits = useMemo(() => {
    const generatedUnits = [];
    
    Object.entries(floorData || {}).forEach(([floorNumber, floor]) => {
      if (floor.units_ids && Array.isArray(floor.units_ids)) {
        floor.units_ids.forEach((gridCellId, index) => {
          const unitData = {
            id: `floor-${floorNumber}-unit-${gridCellId}`,
            unit_name: `F${floorNumber}R${index + 1}`,
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

  // validation — all units must have rent set
  const isConfigurationValid = useMemo(() => {
    const newErrors = {};
    
    if (units.length === 0) {
      newErrors.units = 'No units available. Please configure floor plans first.';
    } else if (units.some(unit => !unit.rent_amount || unit.rent_amount <= 0)) {
      newErrors.units = 'Please set a rent amount for every unit before continuing.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [units]);

  useEffect(() => {
    units.forEach(unit => {
      if (addUnitData) addUnitData(unit);
    });
    if (onValidationChange) onValidationChange(isConfigurationValid);
  }, [units, addUnitData, isConfigurationValid, onValidationChange]);

  const handleEditUnit = useCallback((unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  }, []);

  const handleSaveUnit = useCallback((unitData) => {
    setUnits(prevUnits => prevUnits.map(unit => unit.id === unitData.id ? unitData : unit));
    setIsDialogOpen(false);
    setEditingUnit(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUnit(null);
  }, []);

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
        <h2 className="text-2xl font-bold text-foreground">Unit Details</h2>
        <p className="text-muted-foreground">
          Set the monthly rent for each unit. All units must be configured before continuing.
        </p>
      </div>

      {units.length === 0 ? (
        <CloudflareCard>
          <CloudflareCardContent className="p-8 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Units Available</h3>
            <p className="text-muted-foreground mb-4">
              Please configure floor plans first to generate units.
            </p>
          </CloudflareCardContent>
        </CloudflareCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(unitsByFloor).map(([floorNumber, floorUnits]) => (
            <CloudflareCard key={floorNumber}>
              <CloudflareCardHeader 
                title={`Floor ${floorNumber} – ${floorUnits.length} units`}
                icon={<Home className="w-5 h-5" />}
              />
              <CloudflareCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {floorUnits.map((unit) => (
                    <motion.div
                      key={unit.id}
                      className="border rounded-3xl p-4 cursor-pointer"
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
                        className="w-full sm:w-fit mt-3"
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

      {Object.entries(errors).map(([key, error]) => (
        <div key={key} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      ))}

      <UnitConfigDialog
        unit={editingUnit}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveUnit}
      />
    </div>
  );
}

function UnitConfigDialog({ unit, isOpen, onClose, onSave }) {
  const [rentStr, setRentStr] = useState("");
  const [unitName, setUnitName] = useState("");

  useEffect(() => {
    if (unit) {
      setUnitName(unit.unit_name || "");
      setRentStr(unit.rent_amount ? String(unit.rent_amount) : "");
    }
  }, [unit]);

  const parseRent = (val) => {
    const cleaned = val.replace(/[^\d]/g, "");
    return cleaned === "" ? 0 : Number(cleaned);
  };

  const formatRent = (num) => num === 0 ? "" : num.toLocaleString();

  const handleSave = useCallback(() => {
    if (!unit) return;
    const updated = {
      ...unit,
      unit_name: unitName || unit.unit_name,
      rent_amount: parseRent(rentStr),
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
      <DialogContent className="max-w-72 sm:max-w-96">
        <DialogHeader>
          <DialogTitle>Unit {unit.unit_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="unit_name">Unit name (optional)</Label>
            <Input
              id="unit_name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g. A1, B2"
            />
          </div>

          <div className="space-y-2">
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="w-fit px-8" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} className="w-fit px-8">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}