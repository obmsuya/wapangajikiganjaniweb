// components/landlord/properties/TenantAssignmentDialog.jsx - SIMPLIFIED MVP
"use client";

import { useState } from "react";
import { User, Calendar, DollarSign, CheckCircle, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantAssignment } from "@/hooks/landlord/useTenantAssignment";
import customToast from "@/components/ui/custom-toast";

/**
 * Simplified Tenant Assignment Dialog
 * Clean UI with simple English and minimal required fields
 */
export default function TenantAssignmentDialog({ 
  isOpen, 
  onClose, 
  unit, 
  onSuccess 
}) {
  const { assignTenant, loading, error } = useTenantAssignment();
  
  // Simple form state - only essential fields
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    rent_amount: unit?.rent_amount || '',
    payment_frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.full_name?.trim()) {
      errors.push('Please enter tenant name');
    }
    
    if (!formData.phone_number?.trim()) {
      errors.push('Please enter phone number');
    }
    
    if (!formData.rent_amount || formData.rent_amount <= 0) {
      errors.push('Please enter rent amount');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      customToast.error("Please fix these issues", {
        description: errors.join(', ')
      });
      return;
    }

    try {
      // Prepare simplified assignment data
      const assignmentData = {
        unit_id: unit.id,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        rent_amount: parseFloat(formData.rent_amount),
        payment_frequency: formData.payment_frequency,
        start_date: formData.start_date
      };

      console.log('Submitting assignment:', assignmentData);
      
      const result = await assignTenant(assignmentData);
      
      if (result) {
        customToast.success("Tenant Added Successfully!", {
          description: `${formData.full_name} has been added to ${unit.unit_name}. Welcome message sent via SMS.`
        });
        onSuccess?.();
        onClose();
        
        // Reset form
        setFormData({
          full_name: '',
          phone_number: '',
          rent_amount: unit?.rent_amount || '',
          payment_frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      customToast.error("Failed to Add Tenant", {
        description: err.message || "Please try again or contact support"
      });
    }
  };

  // Payment frequency options with simple English
  const paymentOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Every 3 Months' },
    { value: 'annual', label: 'Yearly' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New Tenant
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Adding tenant to <span className="font-medium">{unit?.unit_name}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tenant Name */}
          <div className="space-y-2">
            <Label htmlFor="tenant-name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Tenant Name
            </Label>
            <Input
              id="tenant-name"
              placeholder="Enter full name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="+255 123 456 789"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Login details will be sent to this number
            </p>
          </div>

          {/* Rent Amount */}
          <div className="space-y-2">
            <Label htmlFor="rent" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Rent
            </Label>
            <div className="relative">
              <Input
                id="rent"
                type="number"
                placeholder="Enter amount"
                value={formData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                disabled={loading}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                TZS
              </span>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Payment Schedule
            </Label>
            <Select
              value={formData.payment_frequency}
              onValueChange={(value) => handleInputChange('payment_frequency', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="How often will they pay?" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Move-in Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add Tenant'}
          </Button>
        </div>

        {/* Info Note */}
        <div className="text-xs text-gray-500 text-center pb-2">
          A welcome message with login details will be sent via SMS
        </div>
      </DialogContent>
    </Dialog>
  );
}