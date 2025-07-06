// components/landlord/properties/UnitConfigModal.jsx
"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Home, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";
import PropertyService from "@/services/landlord/property";

const UNIT_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Under Maintenance' },
  { value: 'reserved', label: 'Reserved' }
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Bi-Annual' },
  { value: 'annual', label: 'Annual' }
];

export default function UnitConfigModal({ unit, onSave, onCancel }) {
  const [unitData, setUnitData] = useState({
    unit_name: '',
    rooms: 1,
    area_sqm: 150,
    rent_amount: 0,
    payment_freq: 'monthly',
    status: 'available'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing unit data
  useEffect(() => {
    if (unit) {
      setUnitData({
        unit_name: unit.unit_name || '',
        rooms: unit.rooms || 1,
        area_sqm: unit.area_sqm || 150,
        rent_amount: unit.rent_amount || 0,
        payment_freq: unit.payment_freq || 'monthly',
        status: unit.status || 'available'
      });
    }
  }, [unit]);

  const handleInputChange = (field, value) => {
    setUnitData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveUnit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!unitData.unit_name.trim()) {
        throw new Error('Unit name is required');
      }

      if (unitData.rent_amount < 0) {
        throw new Error('Rent amount cannot be negative');
      }

      if (unitData.area_sqm <= 0) {
        throw new Error('Area must be greater than 0');
      }

      // Update unit via API if it has an ID, otherwise just call onSave
      if (unit.id && unit.id.toString().length > 10) {
        // This is an existing unit with a real database ID
        const response = await PropertyService.updateUnit(unit.id, unitData);
        console.log('Unit updated successfully:', response);
      }
      
      // Always call onSave to update local state
      onSave();
    } catch (err) {
      console.error('Error updating unit:', err);
      setError(err.message || 'Failed to update unit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Home className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Unit Configuration</h3>
          <p className="text-sm text-gray-600">
            Configure unit details and rent amount
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <CloudflareCard>
          <CloudflareCardHeader title="Basic Information" />
          <CloudflareCardContent className="space-y-4">
            <div>
              <Label htmlFor="unit_name">Unit Name *</Label>
              <Input
                id="unit_name"
                value={unitData.unit_name}
                onChange={(e) => handleInputChange('unit_name', e.target.value)}
                placeholder="e.g., A1, B2, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rooms">Bedrooms</Label>
                <Select
                  value={unitData.rooms.toString()}
                  onValueChange={(value) => handleInputChange('rooms', parseInt(value) || 1)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Bedroom{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="area_sqm">Area (sq m) *</Label>
                <Input
                  id="area_sqm"
                  type="number"
                  min="1"
                  step="0.01"
                  value={unitData.area_sqm}
                  onChange={(e) => handleInputChange('area_sqm', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={unitData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        {/* Rent Configuration - Main Focus */}
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Rent Configuration" 
            icon={<DollarSign className="w-5 h-5" />}
          />
          <CloudflareCardContent className="space-y-4">
            <div>
              <Label htmlFor="rent_amount">Monthly Rent Amount (TZS) *</Label>
              <Input
                id="rent_amount"
                type="number"
                min="0"
                step="1000"
                value={unitData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', parseFloat(e.target.value) || 0)}
                placeholder="Enter rent amount"
                className="text-lg font-medium"
              />
              <p className="text-sm text-gray-600 mt-1">
                Monthly rent: TZS {unitData.rent_amount.toLocaleString()}
              </p>
            </div>

            <div>
              <Label htmlFor="payment_freq">Payment Frequency</Label>
              <Select
                value={unitData.payment_freq}
                onValueChange={(value) => handleInputChange('payment_freq', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        {/* Summary */}
        <CloudflareCard>
          <CloudflareCardHeader title="Unit Summary" />
          <CloudflareCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{unitData.rooms}</p>
                <p className="text-sm text-blue-700">Bedrooms</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{unitData.area_sqm}</p>
                <p className="text-sm text-green-700">sq m</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">
                  TZS {unitData.rent_amount.toLocaleString()}
                </p>
                <p className="text-sm text-purple-700">Rent</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Badge variant="outline">{unitData.status}</Badge>
                <p className="text-sm text-orange-700 mt-1">Status</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSaveUnit} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Unit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}