import { useState, useEffect, useCallback } from "react";
import {
  User, Calendar, DollarSign, CheckCircle,
  UserPlus, ChevronDown, ChevronUp, History,
  Edit2, Phone, Info, Calculator, AlertCircle
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
  value: String(i + 1),
  label: `${i + 1} Mo${i > 0 ? "s" : ""}`,
  fullLabel: `${i + 1} Month${i > 0 ? "s" : ""}`,
}));

const COMMON_FREQS   = PAYMENT_FREQUENCY_OPTIONS.slice(0, 6);
const EXTENDED_FREQS = PAYMENT_FREQUENCY_OPTIONS.slice(6);

// ─── phone normalizer — mirrors server-side logic ────────────────────────────

function normalizeTZPhone(raw) {
  // Strip spaces, dashes, parentheses, dots
  let n = raw.replace(/[\s\-\(\)\.]/g, "");

  if (n.startsWith("0") && n.length === 10)      return "+255" + n.slice(1);
  if (n.startsWith("255") && !n.startsWith("+")) return "+"   + n;
  if (n.startsWith("+255"))                       return n;
  // bare 9-digit local number e.g. 682199981
  if (/^\d{9}$/.test(n))                         return "+255" + n;

  return n; // return as-is, let validation catch it
}

function validateTZPhone(raw) {
  if (!raw || !raw.trim()) return "Phone number is required";
  const normalized = normalizeTZPhone(raw.trim());
  // Must be +255 followed by 9 digits
  if (!/^\+255[67]\d{8}$/.test(normalized)) {
    return "Enter a valid Tanzanian number e.g. 0682 199 819";
  }
  return null; // valid
}

// ─── currency formatter ───────────────────────────────────────────────────────

function fmt(amount) {
  if (!amount || isNaN(amount)) return "—";
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency", currency: "TZS", maximumFractionDigits: 0,
  }).format(amount);
}

// ─── small reusables ─────────────────────────────────────────────────────────

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

// ─── phone input ─────────────────────────────────────────────────────────────

function PhoneInput({ value, onChange, disabled, error }) {
  const [touched, setTouched] = useState(false);
  const displayError = touched ? error : null;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {/* flag + prefix badge */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
          <span className="text-base leading-none">🇹🇿</span>
          <span className="text-xs font-medium text-muted-foreground border-r pr-2">+255</span>
        </div>
        <input
          type="tel"
          placeholder="0682 199 819"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          className={`flex h-10 w-full rounded-md border bg-background pl-[4.5rem] pr-3 py-2 text-sm
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
          Accepted: 0682…, 255682…, +255682…
        </p>
      )}
    </div>
  );
}

// ─── rent calculator block ────────────────────────────────────────────────────

function RentCalculator({ monthlyRent, frequency, mode }) {
  const monthly = parseFloat(monthlyRent);
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
        This is the amount the tenant will be asked to pay every {freq} month{freq > 1 ? "s" : ""}.
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
            ? <><ChevronUp className="w-3 h-3 mr-1" /> Show less</>
            : <><ChevronDown className="w-3 h-3 mr-1" /> Show all 24</>}
        </Button>
        {selected && (
          <span className="text-xs text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selected.fullLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── plain text input ─────────────────────────────────────────────────────────

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

// ─── main dialog ──────────────────────────────────────────────────────────────

const EMPTY_NEW = {
  full_name: "", phone_number: "",
  payment_frequency: "1",
  start_date: new Date().toISOString().split("T")[0],
  monthly_rent: "",          // what landlord types
};

const EMPTY_EXISTING = {
  full_name: "", phone_number: "",
  payment_frequency: "1",
  original_move_in_date: "",
  monthly_rent: "",          // what landlord types
  last_payment_monthly: "",  // monthly equivalent of last payment
};

export default function TenantAssignmentDialog({
  isOpen, onClose, unit, onSuccess,
  editMode = false, existingTenantData = null,
}) {
  const [mode, setMode]       = useState("new");
  const [newForm, setNewForm] = useState(EMPTY_NEW);
  const [exForm,  setExForm]  = useState(EMPTY_EXISTING);
  const [fieldErrors, setFieldErrors] = useState({});

  const { assignTenant,          loading: newLoading }      = useTenantAssignment();
  const { registerExistingTenant, updateExistingTenant,
          loading: existingLoading }                        = useExistingTenantRegistration();

  const loading = mode === "new" ? newLoading : existingLoading;

  // ── derived totals ──
  const newTotal = (() => {
    const m = parseFloat(newForm.monthly_rent);
    const f = parseInt(newForm.payment_frequency) || 1;
    return isNaN(m) || m <= 0 ? "" : (m * f).toFixed(2);
  })();

  const exTotal = (() => {
    const m = parseFloat(exForm.monthly_rent);
    const f = parseInt(exForm.payment_frequency) || 1;
    return isNaN(m) || m <= 0 ? "" : (m * f).toFixed(2);
  })();

  const exLastTotal = (() => {
    const m = parseFloat(exForm.last_payment_monthly);
    const f = parseInt(exForm.payment_frequency) || 1;
    return isNaN(m) || m <= 0 ? "" : (m * f).toFixed(2);
  })();

  // ── seed / reset ──
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
      const freq = String(existingTenantData.payment_frequency ?? "1");
      const totalRent = parseFloat(existingTenantData.rent_amount ?? 0);
      const freqNum   = parseInt(freq) || 1;
      const monthly   = freqNum > 0 ? (totalRent / freqNum).toFixed(2) : totalRent;

      setExForm({
        full_name:             existingTenantData.full_name             ?? "",
        phone_number:          existingTenantData.phone_number          ?? "",
        payment_frequency:     freq,
        original_move_in_date: existingTenantData.original_move_in_date
                               ?? existingTenantData.move_in_date       ?? "",
        monthly_rent:          String(monthly),
        last_payment_monthly:  "",   // landlord re-enters if changing
      });
    } else {
      // Pre-fill rent from unit if available
      const unitRent = unit?.full_unit_info?.rent_amount ?? unit?.rent_amount ?? "";
      setNewForm((p) => ({ ...p, monthly_rent: unitRent ? String(unitRent) : "" }));
    }
  }, [isOpen, unit, editMode, existingTenantData]);

  const setNew = (f, v) => setNewForm((p) => ({ ...p, [f]: v }));
  const setEx  = (f, v) => setExForm((p)  => ({ ...p, [f]: v }));

  // ── validation ──
  const validate = useCallback(() => {
    const errors = {};
    const f      = mode === "new" ? newForm : exForm;

    if (!f.full_name?.trim())        errors.full_name      = "Name is required";
    const phoneErr = validateTZPhone(f.phone_number);
    if (phoneErr)                    errors.phone_number   = phoneErr;

    if (!f.monthly_rent || parseFloat(f.monthly_rent) <= 0)
                                     errors.monthly_rent   = "Enter a valid monthly rent";
    if (!f.payment_frequency)        errors.payment_frequency = "Select a frequency";

    if (mode === "new") {
      if (!newForm.start_date)       errors.start_date     = "Move-in date is required";
    } else {
      if (!exForm.original_move_in_date)
                                     errors.original_move_in_date = "Move-in date is required";
      if (!editMode && (!exForm.last_payment_monthly || parseFloat(exForm.last_payment_monthly) <= 0))
                                     errors.last_payment_monthly  = "Enter last payment monthly amount";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, newForm, exForm, editMode]);

  // ── submit ──
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
          phone_number:      normalizeTZPhone(newForm.phone_number),
          rent_amount:       parseFloat(newTotal),        // ← total sent to server
          payment_frequency: newForm.payment_frequency,
          start_date:        newForm.start_date,
        });
      } else {
        const payload = {
          unit_id:               unit.id,
          full_name:             exForm.full_name.trim(),
          phone_number:          normalizeTZPhone(exForm.phone_number),
          rent_amount:           parseFloat(exTotal),     // ← total sent to server
          payment_frequency:     parseInt(exForm.payment_frequency),
          original_move_in_date: exForm.original_move_in_date,
          last_payment_amount:   parseFloat(exLastTotal), // ← total of last payment cycle
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

  // ── shared values for rendering ──
  const sharedName  = mode === "new" ? newForm.full_name        : exForm.full_name;
  const sharedPhone = mode === "new" ? newForm.phone_number     : exForm.phone_number;
  const sharedRent  = mode === "new" ? newForm.monthly_rent     : exForm.monthly_rent;
  const sharedFreq  = mode === "new" ? newForm.payment_frequency : exForm.payment_frequency;
  const sharedTotal = mode === "new" ? newTotal                 : exTotal;

  const title      = editMode ? "Edit Tenant" : "Add Tenant";
  const submitText = loading
    ? (editMode ? "Saving…" : "Adding…")
    : (editMode ? "Save Changes" : "Add Tenant");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">

        {/* ── header ── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editMode
              ? <Edit2    className="w-5 h-5 text-blue-600" />
              : <UserPlus className="w-5 h-5 text-blue-600" />}
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {editMode ? "Updating tenant for " : "Adding tenant to "}
            <span className="font-medium">{unit?.unit_name}</span>
          </p>
        </DialogHeader>

        {/* ── mode tabs ── */}
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

        <ScrollArea className="max-h-[58vh] w-full pr-3">
          <div className="space-y-5 py-1">

            {/* ── full name ── */}
            <Field
              icon={User} label="Tenant Full Name"
              error={fieldErrors.full_name}
            >
              <TextInput
                id="full_name" placeholder="e.g. Amina Juma"
                value={sharedName} disabled={loading}
                error={!!fieldErrors.full_name}
                onChange={(v) => mode === "new" ? setNew("full_name", v) : setEx("full_name", v)}
              />
            </Field>

            {/* ── phone ── */}
            <Field
              icon={Phone} label="Phone Number"
              tooltip="Must be a valid Tanzanian number. The tenant will use this to log in."
              error={fieldErrors.phone_number}
            >
              <PhoneInput
                value={sharedPhone}
                disabled={loading || editMode}
                error={fieldErrors.phone_number}
                onChange={(v) => mode === "new" ? setNew("phone_number", v) : setEx("phone_number", v)}
              />
              {editMode && (
                <p className="text-xs text-muted-foreground">Phone number cannot be changed.</p>
              )}
            </Field>

            {/* ── monthly rent ── */}
            <Field
              icon={DollarSign}
              label="Monthly Rent (TZS)"
              tooltip="Enter the rent for ONE month. The total due per cycle is calculated automatically."
              error={fieldErrors.monthly_rent}
              hint={sharedTotal
                ? `Total per cycle = ${fmt(parseFloat(sharedTotal))}`
                : "Enter monthly rent to see the total per cycle"}
            >
              <TextInput
                id="monthly_rent" type="number" placeholder="e.g. 150,000"
                value={sharedRent} disabled={loading}
                error={!!fieldErrors.monthly_rent}
                onChange={(v) => mode === "new" ? setNew("monthly_rent", v) : setEx("monthly_rent", v)}
              />
            </Field>

            {/* ── frequency ── */}
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

            {/* ── rent calculator summary ── */}
            {sharedRent && parseFloat(sharedRent) > 0 && (
              <RentCalculator
                monthlyRent={sharedRent}
                frequency={sharedFreq}
                mode={mode}
              />
            )}

            {/* ── new tenant: move-in date ── */}
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

            {/* ── existing tenant: pre-system fields ── */}
            {mode === "existing" && (
              <>
                <Separator />

                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Pre-system history
                  </p>
                  <p className="text-xs text-amber-700">
                    Enter the details from before this app was introduced.
                    The system calculates their next due date automatically from the move-in date and frequency.
                  </p>
                </div>

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

                {/* last payment — only required on first registration, optional on edit */}
                <Field
                  icon={DollarSign}
                  label={`Last Payment — Monthly Amount (TZS)${editMode ? " (optional)" : ""}`}
                  tooltip="Enter the monthly rate for their last payment. The total for that cycle is calculated automatically."
                  error={fieldErrors.last_payment_monthly}
                  hint={exLastTotal
                    ? `Last cycle total = ${fmt(parseFloat(exLastTotal))}`
                    : editMode ? "Leave blank to keep existing record" : "Enter to calculate the last cycle total"}
                >
                  <TextInput
                    id="last_payment_monthly" type="number" placeholder="e.g. 150,000"
                    value={exForm.last_payment_monthly} disabled={loading}
                    error={!!fieldErrors.last_payment_monthly}
                    onChange={(v) => setEx("last_payment_monthly", v)}
                  />
                </Field>

                {/* show last payment calculator only when filled */}
                {exForm.last_payment_monthly && parseFloat(exForm.last_payment_monthly) > 0 && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2.5 flex items-center justify-between">
                    <p className="text-xs text-green-700 font-medium">Last payment cycle total</p>
                    <Badge className="bg-green-600 text-white text-xs">{fmt(parseFloat(exLastTotal))}</Badge>
                  </div>
                )}
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
          <Button
            onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {submitText}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {editMode
            ? "Changes will be saved and the tenant will be notified."
            : mode === "new"
              ? "A welcome SMS with login details will be sent to the tenant."
              : "The tenant will be registered and their next due date calculated automatically."}
        </p>

      </DialogContent>
    </Dialog>
  );
}