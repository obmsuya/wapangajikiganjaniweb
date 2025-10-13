import { useState, useEffect } from "react";
import { User, Calendar, DollarSign, CheckCircle, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTenantAssignment } from "@/hooks/landlord/useTenantAssignment";
import { toast } from "sonner";

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Months" },
  { value: "3", label: "3 Months" },
  { value: "4", label: "4 Months" },
  { value: "5", label: "5 Months" },
  { value: "6", label: "6 Months" },
  { value: "7", label: "7 Months" },
  { value: "8", label: "8 Months" },
  { value: "9", label: "9 Months" },
  { value: "10", label: "10 Months" },
  { value: "11", label: "11 Months" },
  { value: "12", label: "12 Months" },
  { value: "13", label: "13 Months" },
  { value: "14", label: "14 Months" },
  { value: "15", label: "15 Months" },
  { value: "16", label: "16 Months" },
  { value: "17", label: "17 Months" },
  { value: "18", label: "18 Months" },
  { value: "19", label: "19 Months" },
  { value: "20", label: "20 Months" },
  { value: "21", label: "21 Months" },
  { value: "22", label: "22 Months" },
  { value: "23", label: "23 Months" },
  { value: "24", label: "24 Months" },
];

export default function TenantAssignmentDialog({
  isOpen,
  onClose,
  unit,
  onSuccess,
}) {
  const { assignTenant, loading } = useTenantAssignment();

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    payment_frequency: "1",
    start_date: new Date().toISOString().split("T")[0],
    rent_amount: "",
  });

  const [showAllFrequencies, setShowAllFrequencies] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      const rent = unit.full_unit_info?.rent_amount ?? unit.rent_amount ?? '';
      setFormData(prev => ({
        ...prev,
        rent_amount: rent !== undefined && rent !== null ? rent : "",
      }));
    }
    if (!isOpen) {
      setFormData({
        full_name: "",
        phone_number: "",
        payment_frequency: "1",
        start_date: new Date().toISOString().split("T")[0],
        rent_amount: "",
      });
      setShowAllFrequencies(false);
    }
  }, [isOpen, unit]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentFrequencyChange = (value) => {
    setFormData(prev => ({ ...prev, payment_frequency: value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.full_name?.trim()) errors.push("Tenant name is required");
    if (!formData.phone_number?.trim()) errors.push("Phone number is required");
    if (!formData.rent_amount || formData.rent_amount <= 0)
      errors.push("Rent amount is required");
    if (!formData.payment_frequency)
      errors.push("Payment frequency is required");
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length) {
      toast.error("Please fix these issues", { description: errors.join(", ") });
      return;
    }

    try {
      const payload = {
        unit_id: unit.id,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        rent_amount: parseFloat(formData.rent_amount),
        payment_frequency: formData.payment_frequency,
        start_date: formData.start_date,
      };

      await assignTenant(payload);

      onSuccess?.();
      onClose();
    } catch {
    }
  };

  const isRentInputDisabled = loading;

  const commonOptions = PAYMENT_FREQUENCY_OPTIONS.slice(0, 5);
  const remainingOptions = PAYMENT_FREQUENCY_OPTIONS.slice(5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New Tenant
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Adding tenant to <span className="font-medium">{unit?.unit_name}</span>
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] w-full pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Tenant Name
              </Label>
              <input
                id="tenant-name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Phone Number
              </Label>
              <input
                id="phone"
                placeholder="+255 743 456 789"
                value={formData.phone_number}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">
                Login details will be sent to this number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Rent Amount (TZS)
              </Label>
              <div className="relative">
                <input
                  id="rent"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.rent_amount}
                  onChange={(e) => handleInputChange("rent_amount", e.target.value)}
                  disabled={isRentInputDisabled}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  TZS
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  TZS
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Payment Frequency
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {commonOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={formData.payment_frequency === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePaymentFrequencyChange(option.value)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs whitespace-nowrap"
                  >
                    {option.label}
                  </Button>
                ))}
                {!showAllFrequencies && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllFrequencies(true)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center justify-center"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    More
                  </Button>
                )}
                {showAllFrequencies && (
                  <>
                    {remainingOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={formData.payment_frequency === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePaymentFrequencyChange(option.value)}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs whitespace-nowrap"
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllFrequencies(false)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center justify-center"
                    >
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Less
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Move-in Date
              </Label>
              <input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </ScrollArea>

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
            {loading ? "Adding..." : "Add Tenant"}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center pb-2">
          A welcome message with login details will be sent via SMS
        </div>
      </DialogContent>
    </Dialog>
  );
}