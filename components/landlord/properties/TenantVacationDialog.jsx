// components/landlord/properties/TenantVacationDialog.jsx
"use client";

import { useEffect } from "react";
import { LogOut, AlertTriangle, Calendar, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { useTenantVacation } from "@/hooks/landlord/useTenantAssignment";

export default function TenantVacationDialog({ tenant, isOpen, onClose, onSuccess }) {
  const {
    vacationData,
    errors,
    success,
    isVacating,
    isVacationValid,
    updateVacationData,
    submitVacation,
    resetVacationForm
  } = useTenantVacation(tenant?.id);

  useEffect(() => {
    if (success) {
      onSuccess?.();
      resetVacationForm();
    }
  }, [success, onSuccess, resetVacationForm]);

  const handleSubmit = async () => {
    await submitVacation();
  };

  const vacationReasons = [
    { value: 'lease_expired', label: 'Lease Expired' },
    { value: 'tenant_request', label: 'Tenant Request' },
    { value: 'non_payment', label: 'Non-Payment of Rent' },
    { value: 'violation', label: 'Lease Violation' },
    { value: 'property_sale', label: 'Property Sale/Renovation' },
    { value: 'other', label: 'Other' }
  ];

  // Get today's date for minimum vacation date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-600" />
            Vacate Tenant - {tenant?.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Warning Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Important Notice</p>
              <p className="text-sm text-orange-700">
                This action will permanently end the tenancy agreement and cannot be undone.
                Please ensure all necessary communications and documentation are complete.
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Information Summary */}
        <CloudflareCard className="mb-4">
          <div className="p-4">
            <h4 className="font-medium mb-3">Current Tenant Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{tenant?.full_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2">{tenant?.phone_number}</span>
              </div>
              <div>
                <span className="text-gray-500">Unit:</span>
                <span className="ml-2 font-medium">{tenant?.unit?.unit_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Move-in Date:</span>
                <span className="ml-2">{tenant?.start_date}</span>
              </div>
              <div>
                <span className="text-gray-500">Monthly Rent:</span>
                <span className="ml-2 font-medium">TSh {parseFloat(tenant?.rent_amount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Deposit Paid:</span>
                <span className="ml-2">TSh {parseFloat(tenant?.deposit_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CloudflareCard>

        {/* Vacation Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vacation Date *</Label>
              <Input
                type="date"
                min={today}
                value={vacationData.vacate_date}
                onChange={(e) => updateVacationData({ vacate_date: e.target.value })}
              />
              {errors.vacate_date && <p className="text-red-500 text-sm mt-1">{errors.vacate_date}</p>}
            </div>
            
            <div>
              <Label>Vacation Reason *</Label>
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
              {errors.vacate_reason && <p className="text-red-500 text-sm mt-1">{errors.vacate_reason}</p>}
            </div>
          </div>

          {/* Deposit Handling */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Deposit Handling</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="refund_deposit"
                checked={vacationData.refund_deposit}
                onCheckedChange={(checked) => updateVacationData({ refund_deposit: checked })}
              />
              <Label htmlFor="refund_deposit" className="text-sm font-normal">
                Refund security deposit to tenant
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Uncheck if deposit will be withheld for damages, unpaid rent, or other deductions
            </p>
          </div>

          {/* Final Notes */}
          <div>
            <Label>Final Notes</Label>
            <Textarea
              value={vacationData.final_notes}
              onChange={(e) => updateVacationData({ final_notes: e.target.value })}
              placeholder="Record any final notes about the vacation, condition of unit, outstanding payments, etc."
              rows={4}
            />
          </div>
        </div>

        {/* Error Messages */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Confirmation Summary */}
        {vacationData.vacate_date && vacationData.vacate_reason && (
          <CloudflareCard className="bg-gray-50">
            <div className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Vacation Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Tenant:</span>
                  <span className="ml-1 font-medium">{tenant?.full_name}</span> will vacate 
                  <span className="ml-1 font-medium">{tenant?.unit?.unit_name}</span>
                </p>
                <p>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-1 font-medium">{vacationData.vacate_date}</span>
                </p>
                <p>
                  <span className="text-gray-600">Reason:</span>
                  <span className="ml-1">{vacationReasons.find(r => r.value === vacationData.vacate_reason)?.label}</span>
                </p>
                <p>
                  <span className="text-gray-600">Deposit:</span>
                  <span className="ml-1">{vacationData.refund_deposit ? 'Will be refunded' : 'Will be withheld'}</span>
                </p>
              </div>
            </div>
          </CloudflareCard>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVacating}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isVacationValid || isVacating}
            variant="destructive"
          >
            {isVacating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Confirm Vacation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}