// components/landlord/properties/TenantAssignmentDialog.jsx
"use client";

import { useState, useEffect } from "react";
import { Search, User, FileText, CheckCircle, UserPlus } from "lucide-react";
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
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({
    // Required fields
    unit_id: unit?.id || '',
    rent_amount: unit?.rent_amount || '',
    deposit_amount: '',
    payment_frequency: 'monthly',
    
    // Tenant info (if creating new)
    full_name: '',
    phone_number: '',
    
    // Contract details
    start_date: new Date().toISOString().split('T')[0],
    payment_day: 1,
    key_deposit: 0,
    allowed_occupants: 1,
    special_conditions: '',
    
    // Optional tenant details
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  const {
    loading,
    error,
    searchResults,
    searchLoading,
    searchTenants,
    assignTenant,
    clearSearch
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
      clearSearch();
      setCurrentStep(1);
      setSelectedTenant(null);
      // Reset form data when dialog opens
      setFormData({
        unit_id: unit?.id || '',
        rent_amount: unit?.rent_amount || '',
        deposit_amount: '',
        payment_frequency: 'monthly',
        full_name: '',
        phone_number: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_day: 1,
        key_deposit: 0,
        allowed_occupants: 1,
        special_conditions: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: ''
      });
    }
  }, [isOpen, unit, clearSearch]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    if (term.length >= 2) {
      searchTenants(term);
    } else {
      clearSearch();
    }
  };

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setFormData(prev => ({
      ...prev,
      tenant_id: tenant.id,
      full_name: tenant.full_name,
      phone_number: tenant.phone_number
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return selectedTenant || (formData.full_name && formData.phone_number);
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
      const assignmentData = {
        ...formData,
        rent_amount: parseFloat(formData.rent_amount),
        deposit_amount: parseFloat(formData.deposit_amount),
        key_deposit: parseFloat(formData.key_deposit || 0)
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
    { number: 1, title: "Select Tenant", icon: User },
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
              <span className={`ml-2 text-sm ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Search Existing Tenant or Create New</h3>
                
                {/* Search Existing */}
                <div className="mb-6">
                  <Label>Search Existing Tenants</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or phone number..."
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                  
                  {searchLoading && (
                    <div className="mt-2 text-sm text-gray-500">Searching...</div>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {searchResults.map((tenant) => (
                        <CloudflareCard 
                          key={tenant.id}
                          className={`p-3 cursor-pointer hover:bg-blue-50 ${
                            selectedTenant?.id === tenant.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => handleSelectTenant(tenant)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{tenant.full_name}</p>
                              <p className="text-sm text-gray-500">{tenant.phone_number}</p>
                            </div>
                            {selectedTenant?.id === tenant.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </CloudflareCard>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create New Tenant */}
                {!selectedTenant && (
                  <div>
                    <Label className="text-base">Or Create New Tenant</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Enter full name"
                        />
                      </div>
                      
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          value={formData.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      
                      <div>
                        <Label>Emergency Contact Name</Label>
                        <Input
                          value={formData.emergency_contact_name}
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                          placeholder="Emergency contact name"
                        />
                      </div>
                      
                      <div>
                        <Label>Emergency Contact Phone</Label>
                        <Input
                          value={formData.emergency_contact_phone}
                          onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                          placeholder="Emergency contact phone"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Emergency Contact Relationship</Label>
                        <Input
                          value={formData.emergency_contact_relationship}
                          onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                          placeholder="e.g., Parent, Spouse, Sibling"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4">Contract Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Monthly Rent (TSh) *</Label>
                  <Input
                    type="number"
                    value={formData.rent_amount}
                    onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                    placeholder="500000"
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
                    placeholder="500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typically 1-2 months rent
                  </p>
                </div>
                
                <div>
                  <Label>Key Deposit (TSh)</Label>
                  <Input
                    type="number"
                    value={formData.key_deposit}
                    onChange={(e) => handleInputChange('key_deposit', e.target.value)}
                    placeholder="50000"
                  />
                </div>
                
                <div>
                  <Label>Payment Frequency *</Label>
                  <Select 
                    value={formData.payment_frequency} 
                    onValueChange={(value) => handleInputChange('payment_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannual">Bi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Payment Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payment_day}
                    onChange={(e) => handleInputChange('payment_day', e.target.value)}
                    placeholder="1"
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
                  />
                </div>
              </div>
              
              <div>
                <Label>Special Conditions</Label>
                <Textarea
                  value={formData.special_conditions}
                  onChange={(e) => handleInputChange('special_conditions', e.target.value)}
                  placeholder="Any special terms or conditions..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4">Review Assignment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Information */}
                <CloudflareCard>
                  <div className="p-4">
                    <h4 className="font-medium mb-3">Tenant Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium">{formData.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Phone:</span>
                        <span className="text-sm">{formData.phone_number}</span>
                      </div>
                      {formData.emergency_contact_name && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Emergency Contact:</span>
                          <span className="text-sm">{formData.emergency_contact_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CloudflareCard>

                {/* Contract Details */}
                <CloudflareCard>
                  <div className="p-4">
                    <h4 className="font-medium mb-3">Contract Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Unit:</span>
                        <span className="text-sm font-medium">{unit?.unit_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Start Date:</span>
                        <span className="text-sm">{formData.start_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Monthly Rent:</span>
                        <span className="text-sm font-medium">TSh {parseFloat(formData.rent_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Deposit:</span>
                        <span className="text-sm">TSh {parseFloat(formData.deposit_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Payment:</span>
                        <span className="text-sm capitalize">{formData.payment_frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Payment Day:</span>
                        <span className="text-sm">Day {formData.payment_day} of month</span>
                      </div>
                    </div>
                  </div>
                </CloudflareCard>
              </div>

              {formData.special_conditions && (
                <CloudflareCard>
                  <div className="p-4">
                    <h4 className="font-medium mb-2">Special Conditions</h4>
                    <p className="text-sm text-gray-600">{formData.special_conditions}</p>
                  </div>
                </CloudflareCard>
              )}
            </div>
          )}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            disabled={loading}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <Button
            onClick={currentStep === 3 ? handleSubmit : handleNext}
            disabled={!validateStep(currentStep) || loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Assigning...
              </>
            ) : currentStep === 3 ? (
              'Assign Tenant'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}