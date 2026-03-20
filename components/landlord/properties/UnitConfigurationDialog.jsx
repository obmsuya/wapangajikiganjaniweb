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
import TenantService from "@/services/landlord/tenant";
import { toast } from "sonner";

export default function UnitConfigurationDialog({ unit, isOpen, onClose, onSaveSuccess }) {
  const [unitForm, setUnitForm] = useState({});
  const [occupancyForm, setOccupancyForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Determine if this unit has an active occupancy to also patch
  const isOccupied = unit?.status === "occupied" || !!unit?.current_tenant;

  useEffect(() => {
    if (unit) {
      // Unit-level fields
      setUnitForm({
        unit_name:    unit.unit_name    || "",
        rooms:        unit.rooms        || 1,
        rent_amount:  unit.rent_amount  || 0,
        payment_freq: String(unit.payment_freq || "1"),
        status:       unit.status       || "available",
      });

      // Occupancy-level fields — only relevant when occupied
      setOccupancyForm({
        rent_amount:          unit.rent_amount       || 0,
        payment_frequency:    unit.payment_freq      || 1,   // numeric for backend
        original_move_in_date: unit.current_tenant?.move_in_date
                               || unit.move_in_date
                               || "",
      });
    }
  }, [unit]);

  const handleUnitChange = useCallback((field, value) => {
    setUnitForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleOccupancyChange = useCallback((field, value) => {
    setOccupancyForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!unit) return;

    // Basic validation
    if (!unitForm.unit_name?.trim()) {
      toast.error("Validation Error", { description: "Unit name is required." });
      return;
    }
    if (unitForm.rent_amount < 0) {
      toast.error("Validation Error", { description: "Rent amount cannot be negative." });
      return;
    }

    setIsSaving(true);
    try {
      const isRealUnit = unit.id && typeof unit.id === "number" && unit.id > 0;

      if (isRealUnit) {
        // 1 — always patch the unit itself
        await PropertyService.updateUnitDetails(unit.id, {
          unit_name:    unitForm.unit_name,
          rooms:        unitForm.rooms,
          rent_amount:  parseFloat(unitForm.rent_amount) || 0,
          payment_freq: unitForm.payment_freq,  // string "1","2"… stored on Unit model
          status:       unitForm.status,
        });

        // 2 — if occupied, also patch the occupancy (move-in date, frequency, rent)
        if (isOccupied && unit.occupancy_id) {
          await TenantService.updateExistingTenant(unit.occupancy_id, {
            rent_amount:           parseFloat(occupancyForm.rent_amount) || 0,
            payment_frequency:     Number(occupancyForm.payment_frequency),   // numeric
            original_move_in_date: occupancyForm.original_move_in_date || undefined,
          });
        }

        toast.success("Unit Updated", {
          description: `${unitForm.unit_name} has been updated successfully.`,
        });

        onSaveSuccess?.({ ...unit, ...unitForm });
      } else {
        // Pre-save (setup wizard) — just update local state
        toast.success("Unit Configured", {
          description: `${unitForm.unit_name} configuration saved.`,
        });
        onSaveSuccess?.({ ...unit, ...unitForm });
      }

      onClose();
    } catch (error) {
      console.error("Failed to update unit:", error);
      toast.error("Update Failed", {
        description: error.message || "Could not update unit details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {unit.unit_name}</DialogTitle>
          <DialogDescription>
            Edit unit details.
            {isOccupied && " Occupancy fields (rent, frequency, move-in) will also be updated."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          {/* ── Unit fields ─────────────────────────────────────── */}
          <div>
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              value={unitForm.unit_name}
              onChange={(e) => handleUnitChange("unit_name", e.target.value)}
              placeholder="e.g., A1, B2"
            />
          </div>

          <div>
            <Label htmlFor="rooms">Rooms</Label>
            <Input
              id="rooms"
              type="number"
              min="1"
              value={unitForm.rooms}
              onChange={(e) => handleUnitChange("rooms", parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor="rent_amount">Rent Amount (TZS)</Label>
            <Input
              id="rent_amount"
              type="number"
              min="0"
              step="1000"
              value={unitForm.rent_amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                handleUnitChange("rent_amount", val);
                // Keep occupancy rent in sync
                handleOccupancyChange("rent_amount", val);
              }}
              placeholder="Enter rent amount"
            />
          </div>

          <div>
            <Label htmlFor="payment_freq">Payment Frequency</Label>
            <Select
              value={String(unitForm.payment_freq)}
              onValueChange={(value) => {
                handleUnitChange("payment_freq", value);
                // Keep occupancy frequency in sync (numeric)
                handleOccupancyChange("payment_frequency", Number(value));
              }}
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
              value={unitForm.status}
              onValueChange={(value) => handleUnitChange("status", value)}
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

          {/* ── Occupancy fields — only shown when unit is occupied ── */}
          {isOccupied && (
            <>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Occupancy Details
                </p>

                <div>
                  <Label htmlFor="move_in_date">Move-in Date</Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={occupancyForm.original_move_in_date}
                    onChange={(e) =>
                      handleOccupancyChange("original_move_in_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}