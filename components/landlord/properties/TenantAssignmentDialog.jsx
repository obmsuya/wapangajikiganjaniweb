import { useState, useEffect } from "react";
import {
  User, Calendar, DollarSign, CheckCircle,
  UserPlus, ChevronDown, ChevronUp, History, Edit2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import { ScrollArea} from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  useTenantAssignment,
  useExistingTenantRegistration,
} from "@/hooks/landlord/useTenantAssignment";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────

const PAYMENT_FREQUENCY_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} Month${i > 0 ? "s" : ""}`,
}));

const COMMON_OPTIONS   = PAYMENT_FREQUENCY_OPTIONS.slice(0, 5);
const EXTENDED_OPTIONS = PAYMENT_FREQUENCY_OPTIONS.slice(5);

// ─── tiny reusables ───────────────────────────────────────────────────────────

function Field({ label, icon: Icon, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ id, placeholder, value, onChange, disabled, type = "text" }) {
  return (
    <input
      id={id} type={type} placeholder={placeholder}
      value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function FrequencyPicker({ value, onChange, disabled }) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {COMMON_OPTIONS.map((opt) => (
        <Button
          key={opt.value} size="sm"
          variant={value === opt.value ? "default" : "outline"}
          onClick={() => onChange(opt.value)} disabled={disabled}
          className="text-xs"
        >
          {opt.label}
        </Button>
      ))}

      {!showAll ? (
        <Button variant="outline" size="sm" disabled={disabled}
          onClick={() => setShowAll(true)} className="text-xs flex items-center gap-1">
          <ChevronDown className="w-3 h-3" /> More
        </Button>
      ) : (
        <>
          {EXTENDED_OPTIONS.map((opt) => (
            <Button
              key={opt.value} size="sm"
              variant={value === opt.value ? "default" : "outline"}
              onClick={() => onChange(opt.value)} disabled={disabled}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={disabled}
            onClick={() => setShowAll(false)} className="text-xs flex items-center gap-1">
            <ChevronUp className="w-3 h-3" /> Less
          </Button>
        </>
      )}
    </div>
  );
}

// ─── dialog ───────────────────────────────────────────────────────────────────

/**
 * Props
 * ─────
 * isOpen            boolean
 * onClose           () => void
 * unit              object   — the unit being assigned to
 * onSuccess         () => void
 * editMode          boolean  — when true, pre-fills form and PATCHes instead of POSTing
 * existingTenantData object  — pre-fill data when editMode=true
 *   { occupancy_id, full_name, phone_number, payment_frequency,
 *     original_move_in_date, rent_amount, last_payment_amount }
 */
export default function TenantAssignmentDialog({
  isOpen, onClose, unit, onSuccess,
  editMode = false, existingTenantData = null,
}) {
  // "new" | "existing"
  const [mode, setMode] = useState("new");

  const [newForm, setNewForm] = useState({
    full_name: "", phone_number: "",
    payment_frequency: "1",
    start_date: new Date().toISOString().split("T")[0],
    rent_amount: "",
  });

  const [existingForm, setExistingForm] = useState({
    full_name: "", phone_number: "",
    payment_frequency: "1",
    original_move_in_date: "",
    rent_amount: "",
    last_payment_amount: "",
  });

  const { assignTenant, loading: newLoading }                               = useTenantAssignment();
  const { registerExistingTenant, updateExistingTenant, loading: existingLoading } = useExistingTenantRegistration();

  const loading = mode === "new" ? newLoading : existingLoading;

  // ── seed / reset ──
  useEffect(() => {
    if (!isOpen) {
      setMode("new");
      setNewForm({
        full_name: "", phone_number: "", payment_frequency: "1",
        start_date: new Date().toISOString().split("T")[0], rent_amount: "",
      });
      setExistingForm({
        full_name: "", phone_number: "", payment_frequency: "1",
        original_move_in_date: "", rent_amount: "", last_payment_amount: "",
      });
      return;
    }

    const rent = unit?.full_unit_info?.rent_amount ?? unit?.rent_amount ?? "";

    if (editMode && existingTenantData) {
      // Pre-fill for edit — always open in "existing" tab
      setMode("existing");
      setExistingForm({
        full_name:             existingTenantData.full_name             ?? "",
        phone_number:          existingTenantData.phone_number          ?? "",
        payment_frequency:     String(existingTenantData.payment_frequency ?? "1"),
        original_move_in_date: existingTenantData.original_move_in_date
                               ?? existingTenantData.move_in_date       ?? "",
        rent_amount:           existingTenantData.rent_amount           ?? rent,
        last_payment_amount:   existingTenantData.last_payment_amount   ?? "",
      });
    } else {
      setNewForm((p) => ({ ...p, rent_amount: rent }));
    }
  }, [isOpen, unit, editMode, existingTenantData]);

  // ── field setters ──
  const setNew      = (f, v) => setNewForm((p)      => ({ ...p, [f]: v }));
  const setExisting = (f, v) => setExistingForm((p) => ({ ...p, [f]: v }));

  // ── validation ──
  const validateNew = () => {
    const e = [];
    if (!newForm.full_name?.trim())                      e.push("Tenant name is required");
    if (!newForm.phone_number?.trim())                   e.push("Phone number is required");
    if (!newForm.rent_amount || newForm.rent_amount <= 0) e.push("Rent amount is required");
    if (!newForm.payment_frequency)                       e.push("Payment frequency is required");
    return e;
  };

  const validateExisting = () => {
    const e = [];
    if (!existingForm.full_name?.trim())                           e.push("Tenant name is required");
    if (!existingForm.phone_number?.trim())                        e.push("Phone number is required");
    if (!existingForm.rent_amount || existingForm.rent_amount <= 0) e.push("Rent amount is required");
    if (!existingForm.payment_frequency)                            e.push("Payment frequency is required");
    if (!existingForm.original_move_in_date)                        e.push("Original move-in date is required");
    if (!existingForm.last_payment_amount || existingForm.last_payment_amount <= 0)
      e.push("Last payment amount is required");
    return e;
  };

  // ── submit ──
  const handleSubmit = async () => {
    if (mode === "new") {
      const errors = validateNew();
      if (errors.length) {
        toast.error("Please fix these issues", { description: errors.join(", ") });
        return;
      }
      try {
        await assignTenant({
          unit_id: unit.id, ...newForm,
          rent_amount: parseFloat(newForm.rent_amount),
        });
        onSuccess?.();
        onClose();
      } catch { /* hook shows toast */ }

    } else {
      const errors = validateExisting();
      if (errors.length) {
        toast.error("Please fix these issues", { description: errors.join(", ") });
        return;
      }
      const payload = {
        unit_id:               unit.id,
        full_name:             existingForm.full_name.trim(),
        phone_number:          existingForm.phone_number.trim(),
        rent_amount:           parseFloat(existingForm.rent_amount),
        payment_frequency:     parseInt(existingForm.payment_frequency),
        original_move_in_date: existingForm.original_move_in_date,
        last_payment_amount:   parseFloat(existingForm.last_payment_amount),
      };
      try {
        if (editMode && existingTenantData?.occupancy_id) {
          await updateExistingTenant(existingTenantData.occupancy_id, payload);
        } else {
          await registerExistingTenant(payload);
        }
        onSuccess?.();
        onClose();
      } catch { /* hook shows toast */ }
    }
  };

  const title      = editMode ? "Edit Tenant" : "Add Tenant";
  const submitText = loading
    ? (editMode ? "Saving…" : "Adding…")
    : (editMode ? "Save Changes" : "Add Tenant");

  const sharedName  = mode === "new" ? newForm.full_name      : existingForm.full_name;
  const sharedPhone = mode === "new" ? newForm.phone_number   : existingForm.phone_number;
  const sharedRent  = mode === "new" ? newForm.rent_amount    : existingForm.rent_amount;
  const sharedFreq  = mode === "new" ? newForm.payment_frequency : existingForm.payment_frequency;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">

        {/* ── header ── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editMode
              ? <Edit2   className="w-5 h-5 text-blue-600" />
              : <UserPlus className="w-5 h-5 text-blue-600" />
            }
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {editMode ? "Updating tenant for " : "Adding tenant to "}
            <span className="font-medium">{unit?.unit_name}</span>
          </p>
        </DialogHeader>

        {/* ── mode tabs (hidden in edit mode) ── */}
        {!editMode && (
          <div className="space-y-1.5">
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="new" className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> New Tenant
                </TabsTrigger>
                <TabsTrigger value="existing" className="flex items-center gap-1.5">
                  <History className="w-4 h-4" /> Existing Tenant
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-center text-muted-foreground">
              {mode === "new"
                ? "Tenant is moving in for the first time."
                : "Tenant was already living here before this system."}
            </p>
          </div>
        )}

        <Separator />

        {/* ── form body ── */}
        <ScrollArea className="max-h-[55vh] w-full pr-3">
          <div className="space-y-5 py-1">

            {/* shared fields */}
            <Field label="Tenant Full Name" icon={User}>
              <TextInput
                id="full_name" placeholder="Enter full name"
                value={sharedName} disabled={loading}
                onChange={(v) => mode === "new" ? setNew("full_name", v) : setExisting("full_name", v)}
              />
            </Field>

            <Field
              label="Phone Number" icon={User}
              hint={editMode
                ? "Phone number cannot be changed."
                : "Login credentials will be sent to this number."}
            >
              <TextInput
                id="phone_number" placeholder="+255 743 456 789"
                value={sharedPhone}
                disabled={loading || editMode}   // phone locked in edit mode
                onChange={(v) => mode === "new" ? setNew("phone_number", v) : setExisting("phone_number", v)}
              />
            </Field>

            <Field label="Rent Amount (TZS)" icon={DollarSign}>
              <TextInput
                id="rent_amount" type="number" placeholder="e.g. 350000"
                value={sharedRent} disabled={loading}
                onChange={(v) => mode === "new" ? setNew("rent_amount", v) : setExisting("rent_amount", v)}
              />
            </Field>

            <Field label="Payment Frequency" icon={CheckCircle}>
              <FrequencyPicker
                value={sharedFreq} disabled={loading}
                onChange={(v) => mode === "new" ? setNew("payment_frequency", v) : setExisting("payment_frequency", v)}
              />
            </Field>

            {/* new-tenant: simple move-in date */}
            {mode === "new" && (
              <Field label="Move-in Date" icon={Calendar}>
                <TextInput
                  id="start_date" type="date"
                  value={newForm.start_date} disabled={loading}
                  onChange={(v) => setNew("start_date", v)}
                />
              </Field>
            )}

            {/* existing-tenant: pre-system history fields */}
            {mode === "existing" && (
              <>
                <Separator />

                {/* amber callout */}
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Pre-system history
                  </p>
                  <p className="text-xs text-amber-700">
                    Enter the details from before this app was introduced.
                    The system will calculate the next due date automatically.
                  </p>
                </div>

                <Field
                  label="Original Move-in Date" icon={Calendar}
                  hint="The date the tenant first moved in — even if years ago."
                >
                  <TextInput
                    id="original_move_in_date" type="date"
                    value={existingForm.original_move_in_date} disabled={loading}
                    onChange={(v) => setExisting("original_move_in_date", v)}
                  />
                </Field>

                <Field
                  label="Last Payment Amount (TZS)" icon={DollarSign}
                  hint="The amount paid in their most recent payment cycle."
                >
                  <TextInput
                    id="last_payment_amount" type="number" placeholder="e.g. 350000"
                    value={existingForm.last_payment_amount} disabled={loading}
                    onChange={(v) => setExisting("last_payment_amount", v)}
                  />
                </Field>
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* ── actions ── */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {submitText}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {editMode
            ? "Changes will be saved and the tenant will be notified."
            : mode === "new"
              ? "A welcome SMS with login details will be sent."
              : "The tenant will be registered and next due date calculated automatically."}
        </p>

      </DialogContent>
    </Dialog>
  );
}