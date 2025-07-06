// components/landlord/properties/UnitConfiguration.jsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Generate units from floor plans
  const availableUnits = useMemo(() => {
    const generatedUnits = [];
    
    Object.entries(floorData || {}).forEach(([floorNumber, floor]) => {
      if (floor.units_ids && Array.isArray(floor.units_ids)) {
        floor.units_ids.forEach((gridCellId, index) => {
          const unitData = {
            id: `floor-${floorNumber}-unit-${gridCellId}`,
            unit_name: `F${floorNumber}U${index + 1}`,
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

  // Validation - all units should be saved, validation only checks if units exist
  const isConfigurationValid = useMemo(() => {
    const newErrors = {};
    
    if (units.length === 0) {
      newErrors.units = 'No units available. Please configure floor plans first.';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  }, [units]);

  useEffect(() => {
    // Save all units to parent component whenever units change
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Unit Configuration</h2>
        <p className="text-muted-foreground">
          Configure individual unit details and rent amounts. All units will be saved regardless of configuration status.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Units</p>
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
                <p className="text-sm text-gray-600 mb-1">Configured Units</p>
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

      {/* Units by Floor */}
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
                title={`Floor ${floorNumber} Units (${floorUnits.length})`}
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
                              ? `TZS ${parseFloat(unit.rent_amount).toLocaleString()}` 
                              : 'Not set'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Area:</span>
                          <span className="font-medium">{unit.area_sqm || 150} sq m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bedrooms:</span>
                          <span className="font-medium">{unit.bedrooms || 1}</span>
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
                        {unit.rent_amount > 0 ? 'Edit Details' : 'Configure Unit'}
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

      {/* Unit Configuration Dialog */}
      <UnitConfigDialog
        unit={editingUnit}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveUnit}
      />
    </div>
  );
}

// Simplified Unit Configuration Dialog Component
function UnitConfigDialog({ unit, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    unit_name: '',
    bedrooms: 1,
    area_sqm: 150,
    rent_amount: 0,
    payment_freq: 'monthly',
    status: 'vacant'
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        unit_name: unit.unit_name || '',
        bedrooms: unit.bedrooms || 1,
        area_sqm: unit.area_sqm || 150,
        rent_amount: unit.rent_amount || 0,
        payment_freq: unit.payment_freq || 'monthly',
        status: unit.status || 'vacant'
      });
    }
  }, [unit]);

  const handleSave = useCallback(() => {
    if (onSave && unit) {
      const updatedUnit = {
        ...unit,
        ...formData
      };
      onSave(updatedUnit);
    }
  }, [formData, onSave, unit]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Unit {unit.unit_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unit Name */}
          <div>
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              value={formData.unit_name}
              onChange={(e) => handleChange('unit_name', e.target.value)}
              placeholder="e.g., A1, B2"
            />
          </div>

          {/* Rent Amount - Main focus */}
          <div>
            <Label htmlFor="rent_amount">Monthly Rent (TZS) *</Label>
            <Input
              id="rent_amount"
              type="number"
              min="0"
              step="1000"
              value={formData.rent_amount}
              onChange={(e) => handleChange('rent_amount', parseFloat(e.target.value) || 0)}
              placeholder="Enter rent amount"
            />
            <p className="text-xs text-gray-500 mt-1">
              Monthly rent: TZS {formData.rent_amount.toLocaleString()}
            </p>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select 
                value={formData.bedrooms?.toString()} 
                onValueChange={(value) => handleChange('bedrooms', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Bedroom{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area_sqm">Area (sq m)</Label>
              <Input
                id="area_sqm"
                type="number"
                min="1"
                step="0.01"
                value={formData.area_sqm}
                onChange={(e) => handleChange('area_sqm', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Payment Frequency */}
          <div>
            <Label htmlFor="payment_freq">Payment Frequency</Label>
            <Select
              value={formData.payment_freq}
              onValueChange={(value) => handleChange('payment_freq', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="biannual">Bi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Unit Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600">Bedrooms:</span> {formData.bedrooms}
              </div>
              <div>
                <span className="text-blue-600">Area:</span> {formData.area_sqm} sq m
              </div>
              <div className="col-span-2">
                <span className="text-blue-600">Monthly Rent:</span> TZS {formData.rent_amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Unit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}