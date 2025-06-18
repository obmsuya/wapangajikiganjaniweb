// components/landlord/properties/UnitConfiguration.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const paymentFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Bi-Annual' },
  { value: 'annual', label: 'Annual' }
];

const unitStatuses = [
  { value: 'vacant', label: 'Vacant', color: 'bg-green-100 text-green-800' },
  { value: 'occupied', label: 'Occupied', color: 'bg-blue-100 text-blue-800' },
  { value: 'maintenance', label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reserved', label: 'Reserved', color: 'bg-purple-100 text-purple-800' }
];

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

  // Generate available units from floor plans
  const availableUnits = useMemo(() => {
    if (!floorData || typeof floorData !== 'object') {
      return [];
    }

    const generatedUnits = [];
    
    Object.entries(floorData).forEach(([floorNumber, floor]) => {
      if (floor && floor.units_ids && Array.isArray(floor.units_ids) && floor.units_ids.length > 0) {
        floor.units_ids.forEach((gridCellId, index) => {
          const unitId = `${floorNumber}-${gridCellId}`;
          
          const unitData = {
            id: unitId,
            svg_id: gridCellId,
            floor_no: parseInt(floorNumber),
            unit_name: `Floor${floorNumber}-Unit${index + 1}`,
            area_sqm: 150,
            bedrooms: 1,
            status: 'vacant',
            rent_amount: 0,
            payment_freq: 'monthly',
            meter_number: '',
            utilities: {
              electricity: false,
              water: false,
              wifi: false
            },
            included_in_rent: false,
            cost_allocation: 'tenant',
            notes: '',
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

  const isConfigurationValid = useMemo(() => {
    const newErrors = {};
    
    const hasConfiguredUnits = units.some(unit => unit.rent_amount > 0);
    
    if (units.length === 0) {
      newErrors.units = 'No units available. Please configure floor plans first.';
    } else if (!hasConfiguredUnits) {
      newErrors.rent = 'Please configure rent amount for at least one unit.';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0 && hasConfiguredUnits;
    return isValid;
  }, [units]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isConfigurationValid);
    }
  }, [isConfigurationValid, onValidationChange]);

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
    
    if (addUnitData) {
      addUnitData(unitData);
    }
    
    setIsDialogOpen(false);
    setEditingUnit(null);
  }, [addUnitData]);

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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Unit Configuration</h2>
        <p className="text-muted-foreground">
          Configure individual unit details, rent amounts, and amenities
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{units.length}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Edit className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{configuredUnitsCount}</p>
                <p className="text-sm text-muted-foreground">Configured Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">TSh {totalRentAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Monthly Rent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units List */}
      <Card>
        <CardHeader>
          <CardTitle>Units Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  No units available. Please configure your floor plans first.
                </p>
                <p className="text-sm text-gray-500">
                  Go back to the Floor Plans step and design your layout by selecting units on the grid, then click "Save Floor Plan".
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(unitsByFloor).map(([floorNumber, floorUnits]) => (
                <div key={floorNumber}>
                  <h4 className="font-medium text-lg mb-3">Floor {floorNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorUnits.map((unit) => (
                      <motion.div
                        key={unit.id}
                        whileHover={{ scale: 1.02 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium">{unit.unit_name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {unit.area_sqm} sqm • {unit.bedrooms} bedroom(s)
                            </p>
                            <p className="text-xs text-gray-500">
                              Grid Cell: {unit.svg_id}
                            </p>
                          </div>
                          <Badge className={unitStatuses.find(s => s.value === unit.status)?.color}>
                            {unitStatuses.find(s => s.value === unit.status)?.label}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm">Rent:</span>
                            <span className="font-medium">
                              {unit.rent_amount > 0 
                                ? `TSh ${unit.rent_amount.toLocaleString()}` 
                                : 'Not set'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Payment:</span>
                            <span className="text-sm capitalize">{unit.payment_freq}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleEditUnit(unit)}
                          className="w-full"
                          variant={unit.rent_amount > 0 ? "outline" : "default"}
                        >
                          {unit.rent_amount > 0 ? 'Edit Details' : 'Configure Unit'}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Messages */}
      {Object.entries(errors).map(([key, error]) => (
        <div key={key} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
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

// Unit Configuration Dialog Component
function UnitConfigDialog({ unit, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (unit) {
      setFormData({
        ...unit,
        utilities: unit.utilities || {
          electricity: false,
          water: false,
          wifi: false
        }
      });
    }
  }, [unit]);

  const handleSave = useCallback(() => {
    if (onSave && formData.id) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleUtilityChange = useCallback((utility, checked) => {
    setFormData(prev => ({
      ...prev,
      utilities: {
        ...prev.utilities,
        [utility]: checked
      }
    }));
  }, []);

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Unit {unit.unit_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit_name">Unit Name</Label>
              <Input
                id="unit_name"
                value={formData.unit_name || ''}
                onChange={(e) => handleChange('unit_name', e.target.value)}
                placeholder="e.g., A1, B2"
              />
            </div>

            <div>
              <Label htmlFor="bedrooms">Number of Bedrooms</Label>
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
              <Label htmlFor="area">Area (Square Meters)</Label>
              <Input
                id="area"
                type="number"
                value={formData.area_sqm || ''}
                onChange={(e) => handleChange('area_sqm', parseFloat(e.target.value) || 0)}
                placeholder="150"
              />
            </div>

            <div>
              <Label htmlFor="status">Unit Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {unitStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="rent_amount">Monthly Rent (TSh)</Label>
              <Input
                id="rent_amount"
                type="number"
                value={formData.rent_amount || ''}
                onChange={(e) => handleChange('rent_amount', parseFloat(e.target.value) || 0)}
                placeholder="500000"
              />
            </div>

            <div>
              <Label htmlFor="payment_freq">Payment Frequency</Label>
              <Select 
                value={formData.payment_freq} 
                onValueChange={(value) => handleChange('payment_freq', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {paymentFrequencies.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meter_number">Meter Number</Label>
              <Input
                id="meter_number"
                value={formData.meter_number || ''}
                onChange={(e) => handleChange('meter_number', e.target.value)}
                placeholder="Optional meter number"
              />
            </div>

            <div>
              <Label htmlFor="cost_allocation">Utility Cost Allocation</Label>
              <Select 
                value={formData.cost_allocation} 
                onValueChange={(value) => handleChange('cost_allocation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who pays utilities?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant Pays</SelectItem>
                  <SelectItem value="landlord">Landlord Pays</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Utilities */}
        <div className="space-y-4">
          <Label>Available Utilities</Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'electricity', label: 'Electricity' },
              { key: 'water', label: 'Water' },
              { key: 'wifi', label: 'WiFi' }
            ].map(utility => (
              <div key={utility.key} className="flex items-center space-x-2">
                <Switch
                  id={utility.key}
                  checked={formData.utilities?.[utility.key] || false}
                  onCheckedChange={(checked) => handleUtilityChange(utility.key, checked)}
                />
                <Label htmlFor={utility.key}>{utility.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional information about this unit..."
            rows={3}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Unit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}