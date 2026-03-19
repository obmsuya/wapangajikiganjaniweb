// components/landlord/properties/tabs/PropertyPaymentsTab.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Banknote,
  Clock,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Search,
  PlusCircle,
  Info,
  Bell,
  BellOff,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Building2,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CloudflareCard,
  CloudflareCardHeader,
  CloudflareCardContent,
} from "@/components/cloudflare/Card";
import { usePaymentTabStore } from "@/stores/landlord/UsePaymentTabStore";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny shadcn-style DataTable — sorts client-side, no external dep needed
// ─────────────────────────────────────────────────────────────────────────────
function DataTable({ columns, data, emptyMessage = "No data found" }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const sorted = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 h-3.5 w-3.5" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.accessor} className={col.className}>
                  {col.sortable ? (
                    <button
                      className="flex items-center font-medium hover:text-foreground transition-colors"
                      onClick={() => toggleSort(col.accessor)}
                    >
                      {col.header}
                      <SortIcon field={col.accessor} />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={row.id ?? i} className="hover:bg-muted/40">
                  {columns.map((col) => (
                    <TableCell key={col.accessor} className={col.className}>
                      {col.cell ? col.cell(row) : row[col.accessor] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {Math.min((page - 1) * pageSize + 1, sorted.length)}–
            {Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Record Payment Dialog
// Landlord picks a unit → sees cycle balance → enters amount + optional note
// Notify tenant toggle lets landlord decide if tenant should get an SMS
// ─────────────────────────────────────────────────────────────────────────────
function RecordPaymentDialog({ open, onOpenChange, occupiedUnits, propertyId }) {
  const {
    fetchCycleBalance,
    clearCycleBalance,
    cycleBalance,
    cycleBalanceLoading,
    cycleBalanceError,
    recordLandlordPayment,
    recordLoading,
    recordError,
    formatCurrency,
  } = usePaymentTabStore();

  const [unitId, setUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyTenant, setNotifyTenant] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setUnitId("");
      setAmount("");
      setNotes("");
      setNotifyTenant(false);
      clearCycleBalance();
    }
  }, [open, clearCycleBalance]);

  // Load cycle balance when unit changes
  useEffect(() => {
    if (unitId) {
      fetchCycleBalance(unitId);
      setAmount("");
    } else {
      clearCycleBalance();
    }
  }, [unitId, fetchCycleBalance, clearCycleBalance]);

  const selectedUnit = occupiedUnits.find((u) => String(u.unit_id) === String(unitId));

  const amountNum = parseFloat(amount) || 0;
  const amountDue = parseFloat(cycleBalance?.amount_due || 0);
  const amountPaid = parseFloat(cycleBalance?.amount_paid || 0);
  const remaining = parseFloat(cycleBalance?.amount_remaining || 0);
  const isSettled = cycleBalance?.is_settled;
  const isEarly = cycleBalance?.is_early;

  const newTotal = amountPaid + amountNum;
  const willSettle = amountNum > 0 && newTotal >= amountDue;
  const amountValid = amountNum > 0 && amountNum <= remaining;

  const handleSubmit = async () => {
    if (!unitId || !amountValid) return;
    const result = await recordLandlordPayment({
      unitId,
      amount: amountNum,
      notes,
      notifyTenant,
      propertyId,
    });

    if (result.success) {
      const cs = result.data?.cycle_summary;
      toast.success("Payment recorded", {
        description: cs?.is_settled
          ? "This billing cycle is now fully settled."
          : `${formatCurrency(cs?.amount_remaining)} still outstanding this cycle.`,
      });
      onOpenChange(false);
    } else {
      toast.error("Could not record payment", { description: result.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Record a Payment
          </DialogTitle>
          <DialogDescription>
            Use this when a tenant pays you in cash or outside the app. This
            goes into the payment history only — no money moves through the
            platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Unit selector — shows floor + unit + tenant so landlord is certain */}
          <div className="space-y-1.5">
            <Label>Which unit is this for?</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a unit…" />
              </SelectTrigger>
              <SelectContent>
                {occupiedUnits.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No occupied units found
                  </div>
                ) : (
                  occupiedUnits.map((u) => (
                    <SelectItem key={u.unit_id} value={String(u.unit_id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {u.floor_name ?? `Floor ${u.floor_number}`} — {u.unit_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.tenant_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Confirm selection so landlord sees who they picked */}
            {selectedUnit && (
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  Tenant:{" "}
                  <span className="font-medium text-foreground">
                    {selectedUnit.tenant_name}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Cycle balance */}
          {cycleBalanceLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Loading balance…
            </div>
          )}

          {cycleBalanceError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{cycleBalanceError}</AlertDescription>
            </Alert>
          )}

          {cycleBalance && !cycleBalanceLoading && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent due this cycle</span>
                <span className="font-medium">{formatCurrency(amountDue)}</span>
              </div>
              {amountPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already paid</span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(amountPaid)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Outstanding</span>
                <span className={isSettled ? "text-green-600" : "text-destructive"}>
                  {isSettled ? "Fully paid ✓" : formatCurrency(remaining)}
                </span>
              </div>
              {isEarly && (
                <p className="text-xs text-muted-foreground pt-0.5">
                  This cycle hasn't started yet — will be recorded as an early payment.
                </p>
              )}
            </div>
          )}

          {isSettled && cycleBalance && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This tenant has already fully paid for the current cycle. No
                payment is needed right now.
              </AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          {cycleBalance && !isSettled && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label>Amount received (TZS)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-52 text-center">
                      You can record a partial amount. The remaining balance
                      will still show as outstanding until the cycle is fully
                      paid.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                min={1}
                max={remaining}
                step={500}
                placeholder={`Up to ${formatCurrency(remaining)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountNum > remaining && (
                <p className="text-xs text-destructive">
                  This exceeds the outstanding balance of {formatCurrency(remaining)}.
                </p>
              )}
              {amountNum > 0 && amountNum <= remaining && (
                <p className="text-xs text-muted-foreground">
                  {willSettle
                    ? "This will fully settle the current cycle."
                    : `${formatCurrency(amountDue - newTotal)} will remain outstanding.`}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {cycleBalance && !isSettled && (
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Paid cash at the door on 15 March"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {/* Notify tenant toggle */}
          {cycleBalance && !isSettled && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {notifyTenant
                    ? <Bell className="h-4 w-4" />
                    : <BellOff className="h-4 w-4 text-muted-foreground" />
                  }
                  Let the tenant know
                </div>
                <p className="text-xs text-muted-foreground">
                  {notifyTenant
                    ? "Tenant will receive an SMS confirming this payment."
                    : "Tenant will not be notified — for your records only."}
                </p>
              </div>
              <Switch
                checked={notifyTenant}
                onCheckedChange={setNotifyTenant}
                aria-label="Notify tenant"
              />
            </div>
          )}

          {recordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{recordError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!unitId || !amountValid || recordLoading || isSettled}
          >
            {recordLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recording…
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm / Reject dialog for tenant-submitted payments
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmPaymentDialog({ open, onOpenChange, payment, action, onSubmit, loading }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const { formatCurrency } = usePaymentTabStore();

  useEffect(() => {
    if (!open) setRejectionReason("");
  }, [open]);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${action === "accept" ? "bg-green-100" : "bg-red-100"
                }`}
            >
              {action === "accept" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            {action === "accept" ? "Confirm you received this payment" : "Reject this payment"}
          </DialogTitle>
          <DialogDescription>
            {action === "accept"
              ? "Confirming means you received this money from the tenant."
              : "Rejecting will tell the tenant their payment was not received."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{payment.tenant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">
                {payment.unit_name}{" "}
                {payment.floor_number != null && `· Floor ${payment.floor_number}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-base">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span>
                {new Date(payment.payment_period_start).toLocaleDateString()} –{" "}
                {new Date(payment.payment_period_end).toLocaleDateString()}
              </span>
            </div>
            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Tenant note
                  </p>
                  <p className="text-xs">{payment.notes}</p>
                </div>
              </>
            )}
          </div>

          {action === "reject" && (
            <div className="space-y-1.5">
              <Label>
                Reason for rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Tell the tenant why this payment was not accepted…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be sent to the tenant.
              </p>
            </div>
          )}

          {action === "reject" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The tenant will need to pay again through the proper channel.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(payment.id, action, rejectionReason)}
            disabled={
              loading ||
              (action === "reject" && !rejectionReason.trim())
            }
            className={
              action === "accept"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : action === "accept" ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Yes, I received it
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Reject Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment detail dialog — full record for any payment row
// ─────────────────────────────────────────────────────────────────────────────
function PaymentDetailDialog({ open, onOpenChange, payment }) {
  const { formatCurrency, getStatusColor } = usePaymentTabStore();
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className={getStatusColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Tenant
                </span>
                <span className="font-medium">{payment.tenant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Unit
                </span>
                <span className="font-medium">
                  {payment.unit_name}
                  {payment.floor_number != null && ` · Floor ${payment.floor_number}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5" /> Amount
                </span>
                <span className="font-semibold text-base">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Period
                </span>
                <span>
                  {new Date(payment.payment_period_start).toLocaleDateString()} –{" "}
                  {new Date(payment.payment_period_end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recorded on</span>
                <span>{new Date(payment.created_at).toLocaleDateString()}</span>
              </div>
              {payment.auto_confirmed && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-confirmed</span>
                  <span className="text-green-600 font-medium">Yes</span>
                </div>
              )}
              {payment.rejection_reason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Rejection reason</p>
                    <p className="text-destructive">{payment.rejection_reason}</p>
                  </div>
                </>
              )}
              {payment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p>{payment.notes}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PropertyPaymentsTab({ property, floorData }) {
  // ── Dialog state ──────────────────────────────────────────────────────────
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmAction, setConfirmAction] = useState("");

  const {
    loading,
    error,
    summary,
    filters,
    updateFilters,
    confirmPayment,
    getFilteredPayments,
    getPendingPayments,
    formatCurrency,
    getStatusColor,
    initializeTab,
    refreshData,
  } = usePaymentTabStore();

  useEffect(() => {
    if (property?.id) initializeTab(property.id);
  }, [property?.id, initializeTab]);

  // ── Build occupied-unit list from floorData so the dialog knows which unit ─
  // floorData comes from the parent (propertyDetailsPage) and contains every
  // unit with current_tenant, floor_number, unit_name, rent_amount, etc.
  const occupiedUnits = useMemo(() => {
    if (!floorData) return [];
    const result = [];
    Object.entries(floorData).forEach(([floorNum, floor]) => {
      (floor.units || []).forEach((unit) => {
        if (unit.current_tenant) {
          result.push({
            unit_id: unit.id,
            unit_name: unit.unit_name,
            floor_number: parseInt(floorNum, 10),
            floor_name: `Floor ${floorNum}`,
            tenant_name: unit.current_tenant.full_name,
            rent_amount: unit.rent_amount,
          });
        }
      });
    });
    return result;
  }, [floorData]);

  const handleConfirmAction = (payment, action) => {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async (paymentId, action, rejectionReason) => {
    const success = await confirmPayment(paymentId, action, rejectionReason);
    if (success) {
      toast.success(
        action === "accept" ? "Payment confirmed" : "Payment rejected",
        {
          description:
            action === "accept"
              ? "The tenant has been notified."
              : "The tenant has been informed.",
        }
      );
      setShowConfirmDialog(false);
      setSelectedPayment(null);
    }
  };

  const filteredPayments = getFilteredPayments();
  const pendingPayments = getPendingPayments();

  // ── DataTable columns ─────────────────────────────────────────────────────
  const columns = [
    {
      header: "Tenant",
      accessor: "tenant_name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.tenant_name || "—"}</p>
          <p className="text-xs text-muted-foreground">{row.tenant_phone || ""}</p>
        </div>
      ),
    },
    {
      header: "Unit",
      accessor: "unit_name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.unit_name || "—"}</p>
          {row.floor_number != null && (
            <p className="text-xs text-muted-foreground">Floor {row.floor_number}</p>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      header: "Period",
      accessor: "payment_period_start",
      sortable: true,
      cell: (row) => (
        <span className="text-xs">
          {new Date(row.payment_period_start).toLocaleDateString()} –{" "}
          {new Date(row.payment_period_end).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      sortable: true,
      cell: (row) => (
        <span className="text-xs">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {/* View full detail */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedPayment(row);
                    setShowDetailDialog(true);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Accept / Reject — only for tenant-submitted pending payments */}
          {row.status === "pending" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleConfirmAction(row, "accept")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>I received this payment</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleConfirmAction(row, "reject")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>I did not receive this</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 gap-2 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading payment data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Failed to load payments
        </h3>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <Button onClick={() => refreshData(property?.id)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending alert — tenant payments awaiting landlord confirmation */}
      {pendingPayments.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <span className="font-medium">
              {pendingPayments.length} payment
              {pendingPayments.length > 1 ? "s" : ""} waiting for your
              confirmation.
            </span>{" "}
            Tenants reported these as paid — accept or reject using the ✓ and ✗
            buttons in the table below.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenant or unit…"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(v) => updateFilters({ status: v })}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Record payment — primary action for the landlord */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowRecordDialog(true)}
                  className="flex-1 sm:flex-none"
                  disabled={occupiedUnits.length === 0}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Record a cash or off-app payment for a tenant
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => refreshData(property?.id)}
            variant="outline"
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment DataTable */}
      <CloudflareCard>
        <CloudflareCardHeader>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            All payments recorded for this property
          </p>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <DataTable
            columns={columns}
            data={filteredPayments}
            emptyMessage="No payments found for this property yet."
          />
        </CloudflareCardContent>
      </CloudflareCard>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <RecordPaymentDialog
        open={showRecordDialog}
        onOpenChange={setShowRecordDialog}
        occupiedUnits={occupiedUnits}
        propertyId={property?.id}
      />

      <ConfirmPaymentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        payment={selectedPayment}
        action={confirmAction}
        onSubmit={handleConfirmSubmit}
        loading={loading}
      />

      <PaymentDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        payment={selectedPayment}
      />
    </div>
  );
}