import { useState, useEffect } from "react";
import {
  UserPlus,
  User,
  Phone,
  CalendarDays,
  Banknote,
  Repeat2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTenantAssignment } from "@/hooks/landlord/useTenantAssignment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 1–24 months generated programmatically
const PAYMENT_FREQUENCY_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}mo`,
}));

const QUICK_OPTIONS = PAYMENT_FREQUENCY_OPTIONS.slice(0, 6);
const EXTENDED_OPTIONS = PAYMENT_FREQUENCY_OPTIONS.slice(6);

function FormField({ label, icon: Icon, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-3.5 text-muted-foreground shrink-0" />
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

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
      const rent = unit.full_unit_info?.rent_amount ?? unit.rent_amount ?? "";
      setFormData((prev) => ({
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

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const setFreq = (value) =>
    setFormData((prev) => ({ ...prev, payment_frequency: value }));

  const validateForm = () => {
    const errors = [];
    if (!formData.full_name?.trim()) errors.push("Tenant name is required");
    if (!formData.phone_number?.trim()) errors.push("Phone number is required");
    if (!formData.rent_amount || Number(formData.rent_amount) <= 0)
      errors.push("Rent amount is required");
    if (!formData.payment_frequency)
      errors.push("Payment frequency is required");
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length) {
      toast.error("Please fix these issues", {
        description: errors.join(", "),
      });
      return;
    }
    try {
      await assignTenant({
        unit_id: unit.id,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        rent_amount: parseFloat(formData.rent_amount),
        payment_frequency: formData.payment_frequency,
        start_date: formData.start_date,
      });
      onSuccess?.();
      onClose();
    } catch {
      // handled by hook
    }
  };

  const visibleOptions = showAllFrequencies
    ? PAYMENT_FREQUENCY_OPTIONS
    : QUICK_OPTIONS;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <UserPlus className="size-4 text-primary" />
            </span>
            Add New Tenant
          </DialogTitle>
          {unit?.unit_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Assigning to{" "}
              <span className="font-semibold text-foreground">
                {unit.unit_name}
              </span>
            </p>
          )}
        </DialogHeader>

        {/* ── Form ── */}
        <ScrollArea className="max-h-[65vh]">
          <div className="px-5 py-4 space-y-5">

            {/* Name */}
            <FormField label="Full Name" icon={User}>
              <Input
                placeholder="e.g. Amina Juma"
                value={formData.full_name}
                onChange={set("full_name")}
                disabled={loading}
              />
            </FormField>

            {/* Phone */}
            <FormField
              label="Phone Number"
              icon={Phone}
              hint="Login details will be sent to this number via SMS"
            >
              <Input
                placeholder="+255 743 456 789"
                value={formData.phone_number}
                onChange={set("phone_number")}
                disabled={loading}
              />
            </FormField>

            {/* Rent amount */}
            <FormField label="Rent Amount (TZS)" icon={Banknote}>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center text-xs font-medium text-muted-foreground pointer-events-none select-none">
                  TZS
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.rent_amount}
                  onChange={set("rent_amount")}
                  disabled={loading}
                  className="pl-11"
                />
              </div>
            </FormField>

            {/* Payment frequency */}
            <FormField label="Payment Frequency" icon={Repeat2}>
              <div className="space-y-2">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {visibleOptions.map((opt) => {
                    const isSelected = formData.payment_frequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFreq(opt.value)}
                        disabled={loading}
                        className={cn(
                          "h-9 rounded-lg border text-xs font-medium transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllFrequencies((v) => !v)}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllFrequencies ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      Show all 24 months
                    </>
                  )}
                </button>
              </div>
            </FormField>

            {/* Move-in date */}
            <FormField label="Move-in Date" icon={CalendarDays}>
              <Input
                type="date"
                value={formData.start_date}
                onChange={set("start_date")}
                disabled={loading}
              />
            </FormField>
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-border space-y-3">
          <div className="flex gap-2.5">
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
              className="flex-1 gap-2"
            >
              <UserPlus className="size-3.5" />
              {loading ? "Adding…" : "Add Tenant"}
            </Button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="size-3 shrink-0" />
            A welcome SMS with login details will be sent automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}