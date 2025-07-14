// components/landlord/properties/TenantVacationDialog.jsx - SIMPLIFIED VERSION
"use client";

import { useState, useEffect } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantVacation } from "@/hooks/landlord/useTenantManagement";
import customToast from "@/components/ui/custom-toast";

export default function TenantVacationDialog({ tenant, isOpen, onClose, onSuccess }) {
  const [vacationData, setVacationData] = useState({
    vacate_date: '',
    vacate_reason: '',
    refund_deposit: true
  });
  
  const [errors, setErrors] = useState({});
  const [isVacating, setIsVacating] = useState(false);

  const { vacateTenant, loading, error } = useTenantVacation();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setVacationData({
        vacate_date: '',
        vacate_reason: '',
        refund_deposit: true
      });
      setErrors({});
    }
  }, [isOpen]);

  const updateVacationData = (updates) => {
    setVacationData(prev => ({ ...prev, ...updates }));
    
    // Clear errors when field is updated
    if (updates.vacate_date && errors.vacate_date) {
      setErrors(prev => ({ ...prev, vacate_date: null }));
    }
    if (updates.vacate_reason && errors.vacate_reason) {
      setErrors(prev => ({ ...prev, vacate_reason: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!vacationData.vacate_date) {
      newErrors.vacate_date = "Vacation date is required";
    }
    
    if (!vacationData.vacate_reason) {
      newErrors.vacate_reason = "Vacation reason is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsVacating(true);
      
      await vacateTenant(tenant.id, vacationData);
      
      customToast.success("Tenant Vacated Successfully", {
        description: `${tenant.full_name} has been vacated`
      });
      
      onSuccess?.();
      onClose();
      
    } catch (err) {
      console.error('Error vacating tenant:', err);
      customToast.error("Vacation Failed", {
        description: err.message || "Failed to vacate tenant"
      });
    } finally {
      setIsVacating(false);
    }
  };

  const vacationReasons = [
    { value: 'lease_expired', label: 'Lease Expired' },
    { value: 'tenant_request', label: 'Tenant Request' },
    { value: 'non_payment', label: 'Non-Payment of Rent' },
    { value: 'violation', label: 'Lease Violation' },
    { value: 'other', label: 'Other' }
  ];

  const today = new Date().toISOString().split('T')[0];

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-600" />
            Vacate {tenant.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <p className="text-sm text-orange-700">
              This will permanently end the tenancy agreement.
            </p>
          </div>
        </div>

        {/* Simple Form */}
        <div className="space-y-4">
          <div>
            <Label>Vacation Date *</Label>
            <Input
              type="date"
              min={today}
              value={vacationData.vacate_date}
              onChange={(e) => updateVacationData({ vacate_date: e.target.value })}
            />
            {errors.vacate_date && (
              <p className="text-red-500 text-sm mt-1">{errors.vacate_date}</p>
            )}
          </div>
          
          <div>
            <Label>Reason *</Label>
            <Select 
              value={vacationData.vacate_reason} 
              onValueChange={(value) => updateVacationData({ vacate_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {vacationReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vacate_reason && (
              <p className="text-red-500 text-sm mt-1">{errors.vacate_reason}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="refund_deposit"
              checked={vacationData.refund_deposit}
              onCheckedChange={(checked) => updateVacationData({ refund_deposit: checked })}
            />
            <Label htmlFor="refund_deposit" className="text-sm">
              Refund security deposit
            </Label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVacating || loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!vacationData.vacate_date || !vacationData.vacate_reason || isVacating || loading}
            variant="destructive"
          >
            {isVacating || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Vacate Tenant
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}