"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PropertyService from "@/services/landlord/property";
import TenantService from "@/services/landlord/tenant";
import { toast } from "sonner";

export default function UnitConfigurationDialog({ unit, isOpen, onClose, onSaveSuccess }) {
  const [unitName, setUnitName]   = useState("");
  const [tenantForm, setTenantForm] = useState({});   // name + phone live here
  const [occupancyForm, setOccupancyForm] = useState({});
  const [isSaving, setIsSaving]   = useState(false);

  // Unit is occupied when it has an active tenant
  const isOccupied = !!(unit?.current_tenant || unit?.occupancy_id);

  // Payment frequency is locked once a payment has been made
  const isFrequencyLocked = unit?.payment_status === "paid";

  useEffect(() => {
    if (!unit) return;

    // Unit table — only unit_name is editable here
    setUnitName(unit.unit_name || "");

    if (isOccupied) {
      const tenant = unit.current_tenant || unit.tenant || {};

      setTenantForm({
      full_name:    tenant.full_name    || unit.full_name    || "",
      phone_number: String(tenant.phone_number || unit.phone_number || ""),
    });

      // Occupancy fields
      setOccupancyForm({
        rent_amount:           unit.rent_amount || 0,
        payment_frequency:     Number(unit.payment_frequency || unit.payment_freq || 1),
        original_move_in_date: unit.move_in_date || unit.current_tenant?.move_in_date || "",
      });
    }
  }, [unit, isOccupied]);

  const handleTenantChange = useCallback((field, value) => {
    setTenantForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleOccupancyChange = useCallback((field, value) => {
    setOccupancyForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!unit) return;

    // Validation
    if (!unitName.trim()) {
      toast.error("Validation Error", { description: "Unit name is required." });
      return;
    }
    if (isOccupied && !tenantForm.full_name?.trim()) {
      toast.error("Validation Error", { description: "Tenant name is required." });
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
        // 1. Always update the unit name
        await PropertyService.updateUnitDetails(unit.id, { unit_name: unitName });

        // 2. If occupied, patch the occupancy record with all editable fields
        if (isOccupied && unit.occupancy_id) {
          const occupancyPayload = {
            full_name:              tenantForm.full_name,
            phone_number:           tenantForm.phone_number,
            rent_amount:            parseFloat(occupancyForm.rent_amount) || 0,
            original_move_in_date:  occupancyForm.original_move_in_date || undefined,
          };

          // Only send payment_frequency if not locked
          if (!isFrequencyLocked) {
            occupancyPayload.payment_frequency = Number(occupancyForm.payment_frequency);
          }

          await TenantService.updateExistingTenant(unit.occupancy_id, occupancyPayload);
        }

        toast.success("Updated", {
          description: `${unitName} has been updated successfully.`,
        });

        onSaveSuccess?.({ ...unit, unit_name: unitName, ...tenantForm });
      } else {
        // Pre-save wizard — local state only
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
              ? "Update tenant and occupancy details."
              : "No tenant assigned — only the unit name can be edited."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">

          {/* ── Unit name — always editable ─────────────────────────────── */}
          <div>
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g., A1, B2"
            />
          </div>

          {/* ── Tenant identity — only when occupied ────────────────────── */}
          {isOccupied && (
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Tenant Details
              </p>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={tenantForm.full_name}
                  onChange={(e) => handleTenantChange("full_name", e.target.value)}
                  placeholder="Tenant full name"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={tenantForm.phone_number}
                  onChange={(e) => handleTenantChange("phone_number", e.target.value)}
                  placeholder="+255..."
                />
              </div>
            </div>
          )}

          {/* ── Occupancy fields — only when occupied ───────────────────── */}
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
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}