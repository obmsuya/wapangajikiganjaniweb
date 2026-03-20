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
  const [unitName, setUnitName] = useState("");
  const [occupancyForm, setOccupancyForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // A unit is occupied when it has an active tenant assigned
  const isOccupied = !!(unit?.current_tenant || unit?.occupancy_id);

  // Payment frequency is locked once a payment has been made
  const isFrequencyLocked = unit?.payment_status === "paid";

  useEffect(() => {
    if (unit) {
      // Unit table: only unit_name is editable
      setUnitName(unit.unit_name || "");

      // Occupancy fields — sourced from occupancy, NOT from the unit table
      if (isOccupied) {
        setOccupancyForm({
          rent_amount: unit.rent_amount || 0,
          payment_frequency: Number(unit.payment_frequency || unit.payment_freq || 1),
          original_move_in_date: unit.move_in_date || unit.current_tenant?.move_in_date || "",
        });
      }
    }
  }, [unit, isOccupied]);

  const handleOccupancyChange = useCallback((field, value) => {
    setOccupancyForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!unit) return;

    if (!unitName.trim()) {
      toast.error("Validation Error", { description: "Unit name is required." });
      return;
    }

    if (isOccupied && occupancyForm.rent_amount < 0) {
      toast.error("Validation Error", { description: "Rent amount cannot be negative." });
      return;
    }

    setIsSaving(true);
    try {
      const isRealUnit = unit.id && typeof unit.id === "number" && unit.id > 0;

      if (isRealUnit) {
        // Always patch unit_name on the unit table
        await PropertyService.updateUnitDetails(unit.id, { unit_name: unitName });

        // If occupied, patch the occupancy record — nothing else touches the unit table
        if (isOccupied && unit.occupancy_id) {
          const occupancyPayload = {
            rent_amount: parseFloat(occupancyForm.rent_amount) || 0,
            original_move_in_date: occupancyForm.original_move_in_date || undefined,
          };

          // Only include payment_frequency if it is not locked
          if (!isFrequencyLocked) {
            occupancyPayload.payment_frequency = Number(occupancyForm.payment_frequency);
          }

          await TenantService.updateExistingTenant(unit.occupancy_id, occupancyPayload);
        }

        toast.success("Updated", {
          description: `${unitName} has been updated successfully.`,
        });

        onSaveSuccess?.({ ...unit, unit_name: unitName });
      } else {
        // Pre-save setup wizard — local state only
        toast.success("Configured", { description: `${unitName} configuration saved.` });
        onSaveSuccess?.({ ...unit, unit_name: unitName });
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
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit {unit.unit_name}</DialogTitle>
          <DialogDescription>
            {isOccupied
              ? "Update occupancy details. Unit name changes apply to the unit record."
              : "No tenant assigned — only the unit name can be edited."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">

          {/* ── Unit name — always editable ─────────────────────── */}
          <div>
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g., A1, B2"
            />
          </div>

          {/* ── Occupancy fields — only when tenant is assigned ─── */}
          {isOccupied && (
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Occupancy Details
              </p>

              <div>
                <Label htmlFor="rent_amount">Rent Amount (TZS)</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  min="0"
                  step="1000"
                  value={occupancyForm.rent_amount}
                  onChange={(e) =>
                    handleOccupancyChange("rent_amount", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div>
                <Label htmlFor="payment_frequency">
                  Payment Frequency
                  {isFrequencyLocked && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      (locked — unit has active payments)
                    </span>
                  )}
                </Label>
                <Select
                  value={String(occupancyForm.payment_frequency)}
                  onValueChange={(value) =>
                    handleOccupancyChange("payment_frequency", Number(value))
                  }
                  disabled={isFrequencyLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => String(i + 1)).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v === "1" ? "Monthly (1 month)" : `${v} months`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
          )}
        </div>

        <DialogFooter className="flex flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}