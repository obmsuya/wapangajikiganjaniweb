// components/landlord/properties/TenantAssignmentDialog.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User, Calendar, DollarSign, CheckCircle,
  UserPlus, ChevronDown, ChevronUp, History,
  Edit2, Phone, Info, Calculator, AlertCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button }     from "@/components/ui/button";
import { Label }      from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator }  from "@/components/ui/separator";
import { Badge }      from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTenantAssignment,
  useExistingTenantRegistration,
} from "@/hooks/landlord/useTenantAssignment";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────

const PAYMENT_FREQUENCY_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value:     String(i + 1),
  label:     `${i + 1} Mo${i > 0 ? "s" : ""}`,
  fullLabel: `${i + 1} Month${i > 0 ? "s" : ""}`,
}));

const COMMON_FREQS   = PAYMENT_FREQUENCY_OPTIONS.slice(0, 6);
const EXTENDED_FREQS = PAYMENT_FREQUENCY_OPTIONS.slice(6);

// ─── phone helpers ────────────────────────────────────────────────────────────
// The prefix +255 is always shown in the UI. The user types ONLY the 9-digit
// local number (e.g. 712433665). We prepend +255 before sending to the server.

function buildFullPhone(localPart) {
  const clean = localPart.replace(/\D/g, ""); // digits only
  return "+255" + clean;
}

function validateLocalPhone(localPart) {
  if (!localPart || !localPart.trim())
    return "Phone number is required";
  const digits = localPart.replace(/\D/g, "");
  // Local part: 9 digits, starting with 6 or 7
  if (!/^[67]\d{8}$/.test(digits))
    return "Enter 9 digits starting with 6 or 7 — e.g. 712 433 665";
  return null;
}

// ─── currency formatter — commas, no decimals ─────────────────────────────────

function fmt(amount) {
  if (!amount || isNaN(amount)) return "—";
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency", currency: "TZS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

// Format a raw number string with commas while typing (no decimals)
function addCommas(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("en-TZ");
}

// Strip commas to get a plain number string for calculation
function stripCommas(formatted) {
  return formatted.replace(/,/g, "");
}

// ─── small reusables ──────────────────────────────────────────────────────────

function FieldLabel({ icon: Icon, label, tooltip }) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      <span className="text-sm font-medium">{label}</span>
      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-56 text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function Field({ icon, label, tooltip, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>
        <FieldLabel icon={icon} label={label} tooltip={tooltip} />
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// ─── phone input — prefix fixed, user types 9 local digits ───────────────────

function PhoneInput({ value, onChange, disabled, error }) {
  const [touched, setTouched] = useState(false);
  const displayError = touched ? error : null;

  // Only allow digits, max 9
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(digits);
  };

  // Format for display: add spaces e.g. 712 433 665
  const display = value
    ? value.replace(/(\d{3})(\d{3})(\d{0,3})/, (_, a, b, c) =>
        c ? `${a} ${b} ${c}` : `${a} ${b}`
      )
    : "";

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {/* Fixed +255 prefix */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pointer-events-none select-none">
          <span className="text-base leading-none">🇹🇿</span>
          <span className="ml-1.5 text-sm font-medium text-foreground">+255</span>
          <span className="ml-1.5 h-5 w-px bg-border" />
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="712 433 665"
          value={display}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          maxLength={11} /* 9 digits + 2 spaces */
          className={`flex h-10 w-full rounded-md border bg-background pl-[5.5rem] pr-3 py-2 text-sm
                      placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50
                      ${displayError ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
        />
      </div>
      {displayError ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" /> {displayError}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Enter 9 digits — e.g. 712 433 665
        </p>
      )}
    </div>
  );
}

// ─── rent amount input — commas, no decimals ──────────────────────────────────

function RentInput({ id, placeholder, value, onChange, disabled, error }) {
  // value stored internally as formatted string with commas
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // digits only
    if (!raw) { onChange(""); return; }
    onChange(addCommas(raw));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
                  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50
                  ${error ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
    />
  );
}

// ─── plain text / date input ──────────────────────────────────────────────────

function TextInput({ id, type = "text", placeholder, value, onChange, disabled, error }) {
  return (
    <input
      id={id} type={type} placeholder={placeholder}
      value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
                  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50
                  ${error ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
    />
  );
}

// ─── rent calculator — landlord said keep its colors ─────────────────────────

function RentCalculator({ monthlyRent, frequency, mode }) {
  const monthly = parseFloat(stripCommas(monthlyRent));
  const freq    = parseInt(frequency) || 1;
  const total   = isNaN(monthly) || monthly <= 0 ? null : monthly * freq;

  if (!total) return null;

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
        <Calculator className="w-3.5 h-3.5" />
        {mode === "new" ? "Rent summary" : "Rent summary (pre-system)"}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-blue-600 uppercase tracking-wide">Monthly</p>
          <p className="text-sm font-semibold text-blue-900">{fmt(monthly)}</p>
        </div>
        <div className="flex items-center justify-center text-blue-400 text-lg font-light">×</div>
        <div>
          <p className="text-[10px] text-blue-600 uppercase tracking-wide">Months</p>
          <p className="text-sm font-semibold text-blue-900">{freq}</p>
        </div>
      </div>
      <Separator className="bg-blue-200" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-800">Total charged per cycle</p>
        <Badge className="bg-blue-600 text-white text-xs font-bold">{fmt(total)}</Badge>
      </div>
      <p className="text-[10px] text-blue-600">
        The tenant will be asked to pay this every {freq} month{freq > 1 ? "s" : ""}.
      </p>
    </div>
  );
}

// ─── frequency picker ─────────────────────────────────────────────────────────

function FrequencyPicker({ value, onChange, disabled }) {
  const [showAll, setShowAll] = useState(false);
  const selected = PAYMENT_FREQUENCY_OPTIONS.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {COMMON_FREQS.map((opt) => (
          <Button
            key={opt.value} size="sm"
            variant={value === opt.value ? "default" : "outline"}
            onClick={() => onChange(opt.value)} disabled={disabled}
            className="text-xs h-8"
            title={opt.fullLabel}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {showAll && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {EXTENDED_FREQS.map((opt) => (
            <Button
              key={opt.value} size="sm"
              variant={value === opt.value ? "default" : "outline"}
              onClick={() => onChange(opt.value)} disabled={disabled}
              className="text-xs h-8"
              title={opt.fullLabel}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost" size="sm"
          onClick={() => setShowAll((p) => !p)} disabled={disabled}
          className="text-xs h-7 px-2 text-muted-foreground"
        >
          {showAll
            ? <><ChevronUp   className="w-3 h-3 mr-1" /> Show less</>
            : <><ChevronDown className="w-3 h-3 mr-1" /> Show all 24</>}
        </Button>
        {selected && (
          <span className="text-xs text-muted-foreground">
            Selected:{" "}
            <span className="font-medium text-foreground">{selected.fullLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── main dialog ──────────────────────────────────────────────────────────────

const EMPTY_NEW = {
  full_name:         "",
  phone_number:      "",   // stores local 9 digits only
  payment_frequency: "1",
  start_date:        new Date().toISOString().split("T")[0],
  monthly_rent:      "",   // formatted with commas
};

const EMPTY_EXISTING = {
  full_name:              "",
  phone_number:           "",   // local 9 digits
  payment_frequency:      "1",
  original_move_in_date:  "",
  monthly_rent:           "",   // formatted with commas
  last_payment_monthly:   "",   // formatted with commas
};

export default function TenantAssignmentDialog({
  isOpen, onClose, unit, onSuccess,
  editMode = false, existingTenantData = null,
}) {
  const [mode, setMode]             = useState("new");
  const [newForm, setNewForm]       = useState(EMPTY_NEW);
  const [exForm,  setExForm]        = useState(EMPTY_EXISTING);
  const [fieldErrors, setFieldErrors] = useState({});

  const { assignTenant,             loading: newLoading }      = useTenantAssignment();
  const { registerExistingTenant,   updateExistingTenant,
          loading: existingLoading }                           = useExistingTenantRegistration();

  const loading = mode === "new" ? newLoading : existingLoading;

  // ── derived totals (strip commas before calculating) ──────────────────────
  const calcTotal = (monthlyFormatted, freq) => {
    const m = parseFloat(stripCommas(monthlyFormatted));
    const f = parseInt(freq) || 1;
    return isNaN(m) || m <= 0 ? "" : String(Math.round(m * f));
  };

  const newTotal    = calcTotal(newForm.monthly_rent,          newForm.payment_frequency);
  const exTotal     = calcTotal(exForm.monthly_rent,           exForm.payment_frequency);
  const exLastTotal = calcTotal(exForm.last_payment_monthly,   exForm.payment_frequency);

  // ── seed / reset ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setMode("new");
      setNewForm(EMPTY_NEW);
      setExForm(EMPTY_EXISTING);
      setFieldErrors({});
      return;
    }

    if (editMode && existingTenantData) {
      setMode("existing");
      const freq      = String(existingTenantData.payment_frequency ?? "1");
      const totalRent = parseFloat(existingTenantData.rent_amount ?? 0);
      const freqNum   = parseInt(freq) || 1;
      const monthly   = freqNum > 0 ? Math.round(totalRent / freqNum) : Math.round(totalRent);

      // Extract local 9 digits from existing phone
      const rawPhone = String(existingTenantData.phone_number ?? "").replace(/\D/g, "");
      const localDigits = rawPhone.startsWith("255") ? rawPhone.slice(3) : rawPhone;

      setExForm({
        full_name:             existingTenantData.full_name             ?? "",
        phone_number:          localDigits,
        payment_frequency:     freq,
        original_move_in_date: existingTenantData.original_move_in_date
                               ?? existingTenantData.move_in_date       ?? "",
        monthly_rent:          monthly > 0 ? addCommas(String(monthly)) : "",
        last_payment_monthly:  "",
      });
    } else {
      const unitRent = unit?.full_unit_info?.rent_amount ?? unit?.rent_amount ?? "";
      setNewForm((p) => ({
        ...p,
        monthly_rent: unitRent ? addCommas(String(Math.round(parseFloat(unitRent)))) : "",
      }));
    }
  }, [isOpen, unit, editMode, existingTenantData]);

  const setNew = (f, v) => setNewForm((p) => ({ ...p, [f]: v }));
  const setEx  = (f, v) => setExForm((p)  => ({ ...p, [f]: v }));

  // ── validation ────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errors = {};
    const f = mode === "new" ? newForm : exForm;

    if (!f.full_name?.trim())
      errors.full_name = "Name is required";

    const phoneErr = validateLocalPhone(f.phone_number);
    if (phoneErr)
      errors.phone_number = phoneErr;

    const monthlyVal = parseFloat(stripCommas(f.monthly_rent));
    if (!f.monthly_rent || isNaN(monthlyVal) || monthlyVal <= 0)
      errors.monthly_rent = "Enter a valid monthly rent";

    if (!f.payment_frequency)
      errors.payment_frequency = "Select a frequency";

    if (mode === "new") {
      if (!newForm.start_date)
        errors.start_date = "Move-in date is required";
    } else {
      if (!exForm.original_move_in_date)
        errors.original_move_in_date = "Move-in date is required";
      if (!editMode) {
        const lastVal = parseFloat(stripCommas(exForm.last_payment_monthly));
        if (!exForm.last_payment_monthly || isNaN(lastVal) || lastVal <= 0)
          errors.last_payment_monthly = "Enter last payment monthly amount";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, newForm, exForm, editMode]);

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      if (mode === "new") {
        await assignTenant({
          unit_id:           unit.id,
          full_name:         newForm.full_name.trim(),
          phone_number:      buildFullPhone(newForm.phone_number),
          rent_amount:       parseFloat(newTotal),
          payment_frequency: newForm.payment_frequency,
          start_date:        newForm.start_date,
        });
      } else {
        const payload = {
          unit_id:               unit.id,
          full_name:             exForm.full_name.trim(),
          phone_number:          buildFullPhone(exForm.phone_number),
          rent_amount:           parseFloat(exTotal),
          payment_frequency:     parseInt(exForm.payment_frequency),
          original_move_in_date: exForm.original_move_in_date,
          last_payment_amount:   parseFloat(exLastTotal) || 0,
        };

        if (editMode && existingTenantData?.occupancy_id) {
          await updateExistingTenant(existingTenantData.occupancy_id, payload);
        } else {
          await registerExistingTenant(payload);
        }
      }
      onSuccess?.();
      onClose();
    } catch { /* hooks handle toasts */ }
  };

  // ── shared values for rendering ───────────────────────────────────────────
  const sharedName  = mode === "new" ? newForm.full_name         : exForm.full_name;
  const sharedPhone = mode === "new" ? newForm.phone_number      : exForm.phone_number;
  const sharedRent  = mode === "new" ? newForm.monthly_rent      : exForm.monthly_rent;
  const sharedFreq  = mode === "new" ? newForm.payment_frequency : exForm.payment_frequency;
  const sharedTotal = mode === "new" ? newTotal                  : exTotal;

  const title      = editMode ? "Edit Tenant" : "Add Tenant";
  const submitText = loading
    ? (editMode ? "Saving…" : "Adding…")
    : (editMode ? "Save Changes" : "Add Tenant");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        max-h keeps the dialog from overflowing the screen.
        overflow-hidden on DialogContent + ScrollArea inside handles the rest.
      */}
      <DialogContent className="max-w-md sm:max-w-lg flex flex-col max-h-[92dvh] overflow-hidden p-0">

        {/* ── header — outside scroll so it stays pinned ── */}
        <div className="px-6 pt-6 pb-4 space-y-3 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode
                ? <Edit2    className="w-5 h-5 text-primary" />
                : <UserPlus className="w-5 h-5 text-primary" />}
              {title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editMode ? "Updating tenant for " : "Adding tenant to "}
              <span className="font-medium">{unit?.unit_name}</span>
            </p>
          </DialogHeader>

          {/* mode tabs */}
          {!editMode && (
            <div className="space-y-1">
              <Tabs value={mode} onValueChange={(v) => { setMode(v); setFieldErrors({}); }}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="new" className="flex items-center gap-1.5 text-xs">
                    <UserPlus className="w-3.5 h-3.5" /> New Tenant
                  </TabsTrigger>
                  <TabsTrigger value="existing" className="flex items-center gap-1.5 text-xs">
                    <History className="w-3.5 h-3.5" /> Existing Tenant
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
        </div>

        {/* ── scrollable body — fields + actions all inside here ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6 space-y-5">

            {/* full name */}
            <Field icon={User} label="Tenant Full Name" error={fieldErrors.full_name}>
              <TextInput
                id="full_name" placeholder="e.g. Amina Juma"
                value={sharedName} disabled={loading}
                error={!!fieldErrors.full_name}
                onChange={(v) => mode === "new" ? setNew("full_name", v) : setEx("full_name", v)}
              />
            </Field>

            {/* phone */}
            <Field
              icon={Phone} label="Phone Number"
              tooltip="The tenant will use this number to log in."
              error={fieldErrors.phone_number}
            >
              <PhoneInput
                value={sharedPhone}
                disabled={loading || (editMode ? true : false)}
                error={fieldErrors.phone_number}
                onChange={(v) => mode === "new" ? setNew("phone_number", v) : setEx("phone_number", v)}
              />
              {editMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  Phone number cannot be changed.
                </p>
              )}
            </Field>

            {/* monthly rent */}
            <Field
              icon={DollarSign}
              label="Monthly Rent (TZS)"
              tooltip="Enter rent for ONE month. The cycle total is calculated automatically."
              error={fieldErrors.monthly_rent}
              hint={
                sharedTotal
                  ? `Cycle total = ${fmt(parseFloat(sharedTotal))}`
                  : "Enter monthly rent to see the cycle total"
              }
            >
              <RentInput
                id="monthly_rent" placeholder="e.g. 150,000"
                value={sharedRent} disabled={loading}
                error={!!fieldErrors.monthly_rent}
                onChange={(v) => mode === "new" ? setNew("monthly_rent", v) : setEx("monthly_rent", v)}
              />
            </Field>

            {/* frequency */}
            <Field
              icon={CheckCircle}
              label="Payment Frequency"
              tooltip="How many months does the tenant pay at once? Monthly = 1, Quarterly = 3, etc."
              error={fieldErrors.payment_frequency}
            >
              <FrequencyPicker
                value={sharedFreq} disabled={loading}
                onChange={(v) => mode === "new" ? setNew("payment_frequency", v) : setEx("payment_frequency", v)}
              />
            </Field>

            {/* calculator — keeps its colors per user request */}
            {sharedRent && parseFloat(stripCommas(sharedRent)) > 0 && (
              <RentCalculator
                monthlyRent={sharedRent}
                frequency={sharedFreq}
                mode={mode}
              />
            )}

            {/* new tenant: move-in date */}
            {mode === "new" && (
              <Field
                icon={Calendar} label="Move-in Date"
                error={fieldErrors.start_date}
                hint="The date the tenant is starting their lease."
              >
                <TextInput
                  id="start_date" type="date"
                  value={newForm.start_date} disabled={loading}
                  error={!!fieldErrors.start_date}
                  onChange={(v) => setNew("start_date", v)}
                />
              </Field>
            )}

            {/* existing tenant: pre-system fields */}
            {mode === "existing" && (
              <>
                <Separator />

                <Alert>
                  <History className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <span className="font-semibold">Pre-system history</span> — Enter details from
                    before this app was introduced. The next due date is calculated automatically.
                  </AlertDescription>
                </Alert>

                <Field
                  icon={Calendar} label="Original Move-in Date"
                  error={fieldErrors.original_move_in_date}
                  hint="The date the tenant first moved in — even if years ago."
                >
                  <TextInput
                    id="original_move_in_date" type="date"
                    value={exForm.original_move_in_date} disabled={loading}
                    error={!!fieldErrors.original_move_in_date}
                    onChange={(v) => setEx("original_move_in_date", v)}
                  />
                </Field>

                <Field
                  icon={DollarSign}
                  label={`Last Payment — Monthly Amount (TZS)${editMode ? " (optional)" : ""}`}
                  tooltip="Monthly rate of their last payment. The cycle total is calculated automatically."
                  error={fieldErrors.last_payment_monthly}
                  hint={
                    exLastTotal
                      ? `Last cycle total = ${fmt(parseFloat(exLastTotal))}`
                      : editMode ? "Leave blank to keep existing record" : "Required to calculate the next due date"
                  }
                >
                  <RentInput
                    id="last_payment_monthly" placeholder="e.g. 150,000"
                    value={exForm.last_payment_monthly} disabled={loading}
                    error={!!fieldErrors.last_payment_monthly}
                    onChange={(v) => setEx("last_payment_monthly", v)}
                  />
                </Field>

                {/* last payment cycle badge — keeps green per existing design */}
                {exForm.last_payment_monthly && parseFloat(stripCommas(exForm.last_payment_monthly)) > 0 && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2.5 flex items-center justify-between">
                    <p className="text-xs text-green-700 font-medium">Last payment cycle total</p>
                    <Badge className="bg-green-600 text-white text-xs">
                      {fmt(parseFloat(exLastTotal))}
                    </Badge>
                  </div>
                )}
              </>
            )}

            {/* ── actions inside scroll so they're never cut off ── */}
            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline" onClick={onClose} disabled={loading} className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit} disabled={loading} className="flex-1"
              >
                {submitText}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center pb-1">
              {editMode
                ? "Changes will be saved and the tenant will be notified."
                : mode === "new"
                  ? "A welcome SMS with login details will be sent to the tenant."
                  : "The tenant will be registered and their next due date calculated automatically."}
            </p>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}