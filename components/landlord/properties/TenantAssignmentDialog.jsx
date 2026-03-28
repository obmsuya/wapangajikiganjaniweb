// ─── main dialog ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  full_name: "",
  phone_number: "",
  payment_frequency: "1",
  start_date: new Date().toISOString().split("T")[0],
  monthly_rent: "",
  original_move_in_date: "",
  last_payment_monthly: "",
};

export default function TenantAssignmentDialog({
  isOpen, onClose, unit, onSuccess,
  editMode = false, existingTenantData = null,
}) {
  const [step, setStep] = useState(1);       // 1 = question, 2 = form
  const [mode, setMode] = useState("new");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sendSms, setSendSms] = useState(true);

  const { assignTenant, loading: newLoading } = useTenantAssignment();
  const { registerExistingTenant, updateExistingTenant,
    loading: existingLoading } = useExistingTenantRegistration();

  const loading = mode === "new" ? newLoading : existingLoading;
  const isExisting = mode === "existing";
  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  // ── reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMode("new");
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setSendSms(true);
      return;
    }

    if (editMode && existingTenantData) {
      // edit mode skips the question screen entirely
      setStep(2);
      setMode("existing");
      const freq = String(existingTenantData.payment_frequency ?? "1");
      const totalRent = parseFloat(existingTenantData.rent_amount ?? 0);
      const freqNum = parseInt(freq) || 1;
      const monthly = freqNum > 0 ? Math.round(totalRent / freqNum) : Math.round(totalRent);
      const rawPhone = String(existingTenantData.phone_number ?? "").replace(/\D/g, "");
      const localDigits = rawPhone.startsWith("255") ? rawPhone.slice(3) : rawPhone;
      setForm({
        full_name: existingTenantData.full_name ?? "",
        phone_number: localDigits,
        payment_frequency: freq,
        start_date: new Date().toISOString().split("T")[0],
        monthly_rent: monthly > 0 ? addCommas(String(monthly)) : "",
        original_move_in_date: existingTenantData.original_move_in_date
          ?? existingTenantData.move_in_date ?? "",
        last_payment_monthly: "",
      });
    } else {
      const unitRent = unit?.full_unit_info?.rent_amount ?? unit?.rent_amount ?? "";
      setForm((p) => ({
        ...p,
        monthly_rent: unitRent ? addCommas(String(Math.round(parseFloat(unitRent)))) : "",
      }));
    }
  }, [isOpen, unit, editMode, existingTenantData]);

  // ── answer the question and move to step 2 ────────────────────────────────
  const handleAnswer = (answer) => {
    setMode(answer);      // "existing" or "new"
    setFieldErrors({});
    setStep(2);
  };

  // ── back button on step 2 ─────────────────────────────────────────────────
  const handleBack = () => {
    setStep(1);
    setFieldErrors({});
  };

  // ── totals ────────────────────────────────────────────────────────────────
  const calcTotal = (monthlyFormatted, freq) => {
    const m = parseFloat(stripCommas(monthlyFormatted));
    const f = parseInt(freq) || 1;
    return isNaN(m) || m <= 0 ? "" : String(Math.round(m * f));
  };
  const total = calcTotal(form.monthly_rent, form.payment_frequency);
  const lastTotal = calcTotal(form.last_payment_monthly, form.payment_frequency);

  // ── validation (unchanged) ────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errors = {};
    if (!form.full_name?.trim()) errors.full_name = "Name is required";
    const phoneErr = validateLocalPhone(form.phone_number);
    if (phoneErr) errors.phone_number = phoneErr;
    const monthlyVal = parseFloat(stripCommas(form.monthly_rent));
    if (!form.monthly_rent || isNaN(monthlyVal) || monthlyVal <= 0)
      errors.monthly_rent = "Enter a valid monthly rent";
    if (!form.payment_frequency) errors.payment_frequency = "Select a frequency";
    if (!isExisting) {
      if (!form.start_date) errors.start_date = "Move-in date is required";
    }
    if (isExisting) {
      if (!form.original_move_in_date) errors.original_move_in_date = "Move-in date is required";
      if (!editMode) {
        const lastVal = parseFloat(stripCommas(form.last_payment_monthly));
        if (!form.last_payment_monthly || isNaN(lastVal) || lastVal <= 0)
          errors.last_payment_monthly = "Enter last payment monthly amount";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, isExisting, editMode]);

  // ── submit (unchanged) ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    try {
      if (!isExisting) {
        await assignTenant({
          unit_id: unit.id,
          full_name: form.full_name.trim(),
          phone_number: buildFullPhone(form.phone_number),
          rent_amount: parseFloat(total),
          payment_frequency: form.payment_frequency,
          start_date: form.start_date,
          send_welcome_sms: sendSms,
        });
      } else {
        const payload = {
          unit_id: unit.id,
          full_name: form.full_name.trim(),
          phone_number: buildFullPhone(form.phone_number),
          rent_amount: parseFloat(total),
          payment_frequency: parseInt(form.payment_frequency),
          original_move_in_date: form.original_move_in_date,
          last_payment_amount: parseFloat(lastTotal) || 0,
        };
        if (editMode && existingTenantData?.occupancy_id) {
          await updateExistingTenant(existingTenantData.occupancy_id, payload);
        } else {
          await registerExistingTenant({ ...payload, send_welcome_sms: sendSms });
        }
      }
      onSuccess?.();
      onClose();
    } catch { /* hooks handle toasts */ }
  };

  const title = editMode ? "Edit Tenant" : "Add Tenant";
  const submitText = loading
    ? (editMode ? "Saving…" : "Adding…")
    : (editMode ? "Save Changes" : "Add Tenant");

  // ── step 1: question screen ───────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="px-6 py-8 space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Has this tenant already been paying rent?
        </p>
        <p className="text-xs text-muted-foreground">
          Your answer determines what info we need to collect.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAnswer("existing")}
          className="flex flex-col items-center gap-2 rounded-lg border-2 border-input bg-background px-4 py-5
                     text-sm hover:border-primary hover:bg-accent transition-colors cursor-pointer"
        >
          <History className="w-6 h-6 text-muted-foreground" />
          <span className="font-medium">Yes, they have</span>
          <span className="text-xs text-muted-foreground text-center">
            They paid before this app — I'll enter their history
          </span>
        </button>

        <button
          onClick={() => handleAnswer("new")}
          className="flex flex-col items-center gap-2 rounded-lg border-2 border-input bg-background px-4 py-5
                     text-sm hover:border-primary hover:bg-accent transition-colors cursor-pointer"
        >
          <UserPlus className="w-6 h-6 text-muted-foreground" />
          <span className="font-medium">No, moving in now</span>
          <span className="text-xs text-muted-foreground text-center">
            First time — The Tenant is moving in for the first time
          </span>
        </button>
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  );

  // ── step 2: the form (your existing form body, unchanged) ─────────────────
  const renderStep2 = () => (
    <>
      <div className="px-6 pt-4 pb-3 flex-shrink-0 space-y-3">
        {/* sms opt-in — only for new registrations, not edit mode */}
        {!editMode && (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Send welcome SMS?
              </p>
              <p className="text-xs text-muted-foreground">
                {sendSms
                  ? "Tenant will receive login credentials by SMS."
                  : "No SMS will be sent to the tenant."}
              </p>
            </div>
            <Switch checked={sendSms} onCheckedChange={setSendSms} disabled={loading} />
          </div>
        )}
        <Separator />
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="px-6 pb-6 space-y-5">

          {/* full name */}
          <Field icon={User} label="Tenant Full Name" error={fieldErrors.full_name}>
            <TextInput
              id="full_name" placeholder="e.g. Amina Juma"
              value={form.full_name} disabled={loading}
              error={!!fieldErrors.full_name}
              onChange={(v) => setField("full_name", v)}
            />
          </Field>

          {/* phone */}
          <Field
            icon={Phone} label="Phone Number"
            tooltip="The tenant will use this number to log in."
            error={fieldErrors.phone_number}
          >
            <PhoneInput
              value={form.phone_number}
              disabled={loading || editMode}
              error={fieldErrors.phone_number}
              onChange={(v) => setField("phone_number", v)}
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
              total
                ? `Cycle total = ${fmt(parseFloat(total))}`
                : "Enter monthly rent to see the cycle total"
            }
          >
            <RentInput
              id="monthly_rent" placeholder="e.g. 150,000"
              value={form.monthly_rent} disabled={loading}
              error={!!fieldErrors.monthly_rent}
              onChange={(v) => setField("monthly_rent", v)}
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
              value={form.payment_frequency} disabled={loading}
              onChange={(v) => setField("payment_frequency", v)}
            />
          </Field>

          {/* calculator */}
          {form.monthly_rent && parseFloat(stripCommas(form.monthly_rent)) > 0 && (
            <RentCalculator
              monthlyRent={form.monthly_rent}
              frequency={form.payment_frequency}
              mode={mode}
            />
          )}

          {/* new tenant: move-in date */}
          {!isExisting && (
            <Field
              icon={Calendar} label="Move-in Date"
              error={fieldErrors.start_date}
              hint="The date the tenant is starting their lease."
            >
              <TextInput
                id="start_date" type="date"
                value={form.start_date} disabled={loading}
                error={!!fieldErrors.start_date}
                onChange={(v) => setField("start_date", v)}
              />
            </Field>
          )}

          {/* existing tenant: pre-system fields */}
          {isExisting && (
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
                  value={form.original_move_in_date} disabled={loading}
                  error={!!fieldErrors.original_move_in_date}
                  onChange={(v) => setField("original_move_in_date", v)}
                />
              </Field>

              <Field
                icon={DollarSign}
                label={`Last Payment — Monthly Amount (TZS)${editMode ? " (optional)" : ""}`}
                tooltip="Monthly rate of their last payment. The cycle total is calculated automatically."
                error={fieldErrors.last_payment_monthly}
                hint={
                  lastTotal
                    ? `Last cycle total = ${fmt(parseFloat(lastTotal))}`
                    : editMode ? "Leave blank to keep existing record" : "Required to calculate the next due date"
                }
              >
                <RentInput
                  id="last_payment_monthly" placeholder="e.g. 150,000"
                  value={form.last_payment_monthly} disabled={loading}
                  error={!!fieldErrors.last_payment_monthly}
                  onChange={(v) => setField("last_payment_monthly", v)}
                />
              </Field>

              {form.last_payment_monthly && parseFloat(stripCommas(form.last_payment_monthly)) > 0 && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs text-green-700 font-medium">Last payment cycle total</p>
                  <Badge className="bg-green-600 text-white text-xs">
                    {fmt(parseFloat(lastTotal))}
                  </Badge>
                </div>
              )}
            </>
          )}

          <Separator />

          <div className="flex gap-3">
            {/* back button only when not in edit mode (edit mode skips step 1) */}
            {!editMode && (
              <Button variant="outline" onClick={handleBack} disabled={loading} className="flex-1">
                Back
              </Button>
            )}
            {editMode && (
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {submitText}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pb-1">
            {editMode
              ? "Changes will be saved and the tenant will be notified."
              : isExisting
                ? "The tenant will be registered and their next due date calculated automatically."
                : "A welcome SMS with login details will be sent to the tenant."}
          </p>

        </div>
      </ScrollArea>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg flex flex-col max-h-[92dvh] overflow-hidden p-0">

        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode
                ? <Edit2 className="w-5 h-5 text-primary" />
                : step === 1
                  ? <UserPlus className="w-5 h-5 text-primary" />
                  : isExisting
                    ? <History className="w-5 h-5 text-primary" />
                    : <UserPlus className="w-5 h-5 text-primary" />}
              {title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {step === 1 && !editMode
                ? `Adding tenant to `
                : isExisting
                  ? `Existing tenant for `
                  : `Adding tenant to `}
              <span className="font-medium">{unit?.unit_name}</span>
              {step === 2 && !editMode && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {isExisting ? "Pre-system" : "New tenant"}
                </Badge>
              )}
            </p>
          </DialogHeader>
        </div>

        {step === 1 && !editMode ? renderStep1() : renderStep2()}

      </DialogContent>
    </Dialog>
  );
}