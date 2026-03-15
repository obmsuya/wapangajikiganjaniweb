// components/landlord/properties/UnitConfigurationDialog.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropertyService from "@/services/landlord/property";
import customToast from "@/components/ui/custom-toast";

export default function UnitConfigurationDialog({ unit, isOpen, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setFormData({
        unit_name: unit.unit_name || "",
        rooms: unit.rooms || 1,                       
        rent_amount: unit.rent_amount || 0,
        payment_freq: unit.payment_freq || "1",       
        status: unit.status || "available",          
      });
    }
  }, [unit]);

  const handleSave = async () => {
    if (!unit) return;

    setIsSaving(true);
    try {
      // Validate the form data
      if (!formData.unit_name || formData.unit_name.trim() === '') {
        throw new Error("Unit name is required");
      }

      if (formData.rent_amount < 0) {
        throw new Error("Rent amount cannot be negative");
      }

      if (formData.area_sqm <= 0) {
        throw new Error("Area must be greater than 0");
      }

      console.log("Saving unit with ID:", unit.id, "Data:", formData);

      // Check if this is a real database unit or a temporary one
      const isRealUnit = unit.id && typeof unit.id === 'number' && unit.id > 0;
      
      if (isRealUnit) {
        // Update existing unit via API
        const { ...dataToSend } = formData;
        const updatedUnit = await PropertyService.updateUnitDetails(unit.id, dataToSend);
        
        customToast.success("Unit Updated", {
          description: `Unit ${formData.unit_name} has been updated successfully.`,
        });

        if (onSaveSuccess) {
          onSaveSuccess(updatedUnit);
        }
      } else {
        // For units that are just configured during setup (not yet saved to DB)
        // Just update the local state
        const updatedUnit = { ...unit, ...formData };
        
        customToast.success("Unit Configured", {
          description: `Unit ${formData.unit_name} configuration saved.`,
        });

        if (onSaveSuccess) {
          onSaveSuccess(updatedUnit);
        }
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to update unit:", error);
      customToast.error("Update Failed", {
        description: error.message || "Could not update unit details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {unit.unit_name}</DialogTitle>
          <DialogDescription>
            Edit the details for this unit. Changes will be saved when you click "Save Changes".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              value={formData.unit_name}
              onChange={(e) => handleChange("unit_name", e.target.value)}
              placeholder="e.g., A1, B2"
            />
          </div>

          <div>
            <Label htmlFor="rent_amount">Monthly Rent (TZS)</Label>
            <Input
              id="rent_amount"
              type="number"
              min="0"
              step="1000"
              value={formData.rent_amount}
              onChange={(e) => handleChange("rent_amount", parseFloat(e.target.value) || 0)}
              placeholder="Enter rent amount"
            />
          </div>

          <div>
            <Label htmlFor="payment_freq">Payment Frequency</Label>
            <Select
              value={formData.payment_freq}
              onValueChange={(value) => handleChange("payment_freq", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monthly (1 month)</SelectItem>
                <SelectItem value="2">2 Months</SelectItem>
                <SelectItem value="3">Quarterly (3 months)</SelectItem>
                <SelectItem value="6">Bi-Annual (6 months)</SelectItem>
                <SelectItem value="12">Annual (12 months)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-fit" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="w-fit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}