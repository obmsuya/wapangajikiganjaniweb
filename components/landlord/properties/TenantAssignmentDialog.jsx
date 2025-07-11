// components/landlord/properties/TenantAssignmentDialog.jsx
"use client";

import { useState, useEffect } from "react";
import { User, FileText, CheckCircle, UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { useTenantAssignment } from "@/hooks/landlord/useTenantAssignment";
import customToast from "@/components/ui/custom-toast";

export default function TenantAssignmentDialog({ unit, isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Required fields only
    unit_id: unit?.id || '',
    full_name: '',
    phone_number: '',
    rent_amount: unit?.rent_amount || '',
    deposit_amount: '',
    payment_frequency: 'monthly',
    
    // Optional fields with defaults
    start_date: new Date().toISOString().split('T')[0],
    payment_day: 1,
    key_deposit: 0,
    allowed_occupants: 1,
    special_conditions: ''
  });

  const {
    loading,
    error,
    assignTenant
  } = useTenantAssignment();

  useEffect(() => {
    if (unit) {
      setFormData(prev => ({
        ...prev,
        unit_id: unit.id,
        rent_amount: unit.rent_amount || ''
      }));
    }
  }, [unit]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      // Reset form data when dialog opens
      setFormData({
        unit_id: unit?.id || '',
        full_name: '',
        phone_number: '',
        rent_amount: unit?.rent_amount || '',
        deposit_amount: '',
        payment_frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        payment_day: 1,
        key_deposit: 0,
        allowed_occupants: 1,
        special_conditions: ''
      });
    }
  }, [isOpen, unit]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.full_name.trim() && formData.phone_number.trim();
      case 2:
        return formData.rent_amount && formData.deposit_amount && formData.payment_frequency;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const requiredFields = {
        unit_id: formData.unit_id,
        full_name: formData.full_name?.trim(),
        phone_number: formData.phone_number?.trim(),
        rent_amount: formData.rent_amount,
        deposit_amount: formData.deposit_amount,
        payment_frequency: formData.payment_frequency
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare assignment data according to backend serializer
      const assignmentData = {
        // Required fields
        unit_id: parseInt(formData.unit_id),
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        rent_amount: parseFloat(formData.rent_amount),
        deposit_amount: parseFloat(formData.deposit_amount),
        payment_frequency: formData.payment_frequency,
        
        // Optional fields with proper defaults
        start_date: formData.start_date,
        payment_day: parseInt(formData.payment_day) || 1,
        key_deposit: parseFloat(formData.key_deposit) || 0,
        allowed_occupants: parseInt(formData.allowed_occupants) || 1,
        special_conditions: formData.special_conditions || ''
      };

      console.log('Submitting assignment:', assignmentData);
      
      const result = await assignTenant(assignmentData);
      
      if (result) {
        customToast.success("Tenant Assigned Successfully!", {
          description: `${formData.full_name} has been assigned to ${unit.unit_name}`
        });
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      customToast.error("Assignment Failed", {
        description: err.message || "Failed to assign tenant. Please try again."
      });
    }
  };

  const steps = [
    { number: 1, title: "Tenant Information", icon: User },
    { number: 2, title: "Contract Details", icon: FileText },
    { number: 3, title: "Review & Confirm", icon: CheckCircle }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Tenant to {unit?.unit_name}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep >= step.number 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-3 ${
                  currentStep > step.number 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">Tenant Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter tenant's full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Unit Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Unit:</span>
                    <span className="ml-2 font-medium">{unit?.unit_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Floor:</span>
                    <span className="ml-2 font-medium">Floor {unit?.floor_number + 1}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Area:</span>
                    <span className="ml-2 font-medium">{unit?.area_sqm} sqm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{unit?.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">Contract Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Monthly Rent (TSh) *</Label>
                  <Input
                    type="number"
                    value={formData.rent_amount}
                    onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                    placeholder="500000"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default rent for this unit: TSh {parseFloat(unit?.rent_amount || 0).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <Label>Deposit Amount (TSh) *</Label>
                  <Input
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                    placeholder="1000000"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Payment Frequency *</Label>
                  <Select 
                    value={formData.payment_frequency} 
                    onValueChange={(value) => handleInputChange('payment_frequency', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannual">Bi-annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Payment Day</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payment_day}
                    onChange={(e) => handleInputChange('payment_day', e.target.value)}
                    placeholder="1"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Day of month when rent is due
                  </p>
                </div>
                
                <div>
                  <Label>Key Deposit (TSh)</Label>
                  <Input
                    type="number"
                    value={formData.key_deposit}
                    onChange={(e) => handleInputChange('key_deposit', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Allowed Occupants</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.allowed_occupants}
                    onChange={(e) => handleInputChange('allowed_occupants', e.target.value)}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Special Conditions</Label>
                <Textarea
                  value={formData.special_conditions}
                  onChange={(e) => handleInputChange('special_conditions', e.target.value)}
                  placeholder="Any special conditions or notes for this lease"
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium">Review & Confirm</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CloudflareCard>
                  <div className="p-4">
                    <h4 className="font-medium mb-3">Tenant Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{formData.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{formData.phone_number}</span>
                      </div>
                    </div>
                  </div>
                </CloudflareCard>
                
                <CloudflareCard>
                  <div className="p-4">
                    <h4 className="font-medium mb-3">Unit Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit:</span>
                        <span className="font-medium">{unit?.unit_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor:</span>
                        <span className="font-medium">Floor {unit?.floor_number + 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium">{unit?.area_sqm} sqm</span>
                      </div>
                    </div>
                  </div>
                </CloudflareCard>
                
                <CloudflareCard className="md:col-span-2">
                  <div className="p-4">
                    <h4 className="font-medium mb-3">Contract Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 block">Start Date:</span>
                        <span className="font-medium">{formData.start_date}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Monthly Rent:</span>
                        <span className="font-medium">TSh {parseFloat(formData.rent_amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Deposit:</span>
                        <span className="font-medium">TSh {parseFloat(formData.deposit_amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Payment Frequency:</span>
                        <span className="font-medium capitalize">{formData.payment_frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Payment Day:</span>
                        <span className="font-medium">{formData.payment_day}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Key Deposit:</span>
                        <span className="font-medium">TSh {parseFloat(formData.key_deposit || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Occupants:</span>
                        <span className="font-medium">{formData.allowed_occupants}</span>
                      </div>
                    </div>
                    
                    {formData.special_conditions && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="text-gray-600 block mb-2">Special Conditions:</span>
                        <span className="text-sm">{formData.special_conditions}</span>
                      </div>
                    )}
                  </div>
                </CloudflareCard>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Please review all details carefully before confirming. Once confirmed, a welcome SMS will be sent to the tenant.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep) || loading}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}