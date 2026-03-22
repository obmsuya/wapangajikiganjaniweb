// components/tenant/TenantPaymentHistory.jsx
"use client";

import { useEffect, useState } from "react";
import {
  History, Filter, Calendar, Building2, Clock,
  CreditCard, Eye, ChevronUp, ChevronDown, ChevronsUpDown,
  CheckCircle2, XCircle, AlertTriangle, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }    from "@/components/ui/button";
import { Badge }     from "@/components/ui/badge";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Skeleton }  from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTenantPaymentStore } from "@/stores/tenant/useTenantPaymentStore";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(amount) {
  if (!amount && amount !== 0) return "TZS 0";
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency", currency: "TZS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_MAP = {
  completed: { label: "Completed", icon: CheckCircle2 },
  pending:   { label: "Pending",   icon: Clock        },
  failed:    { label: "Failed",    icon: XCircle      },
  rejected:  { label: "Rejected",  icon: XCircle      },
};

function statusBadge(status, getColor) {
  const s = STATUS_MAP[status] ?? { label: status, icon: Clock };
  const Icon = s.icon;
  return (
    <Badge variant="secondary" className={`gap-1 ${getColor(status)}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

// ── Payment detail dialog ─────────────────────────────────────────────────────
function PaymentDetailDialog({ payment, open, onOpenChange, getColor }) {
  if (!payment) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-3xl border bg-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              {statusBadge(payment.status, getColor)}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{payment.unit_name}</span>
            </div>
            {payment.property_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span>{payment.property_name}</span>
              </div>
            )}
            {payment.floor_number != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor</span>
                {/* floor_number from backend is 0-indexed — Floor 0 = Floor 1 */}
                <span>Floor {payment.floor_number + 1}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-base">{fmt(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span>
                {fmtDate(payment.payment_period_start)} – {fmtDate(payment.payment_period_end)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recorded on</span>
              <span>{fmtDateTime(payment.created_at)}</span>
            </div>
            {payment.auto_confirmed && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-confirmed</span>
                <span className="font-medium">Yes</span>
              </div>
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
            {payment.rejection_reason && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Rejection reason</p>
                  <p className="text-destructive">{payment.rejection_reason}</p>
                </div>
              </>
            )}
          </div>

          {payment.status === "pending" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This payment is waiting for your landlord to confirm.
              </AlertDescription>
            </Alert>
          )}
        </div>
        {/* No Close button — the ✕ in the dialog header is sufficient */}
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TenantPaymentHistory() {
  const {
    paymentHistory,
    loading,
    error,
    occupancies,
    fetchPaymentHistory,
    fetchOccupancies,
    formatCurrency,
    getPaymentStatusColor,
  } = useTenantPaymentStore();

  const [filters, setFilters]       = useState({ unitId: "", startDate: "", endDate: "", status: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField]   = useState("created_at");
  const [sortDir,   setSortDir]     = useState("desc");
  const [selected,  setSelected]    = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (occupancies.length === 0) fetchOccupancies();
  }, []);

  useEffect(() => {
    fetchPaymentHistory(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ unitId: "", startDate: "", endDate: "", status: "" });
  const hasActiveFilters = Object.values(filters).some(f => f);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground inline" />;
    return sortDir === "asc"
      ? <ChevronUp   className="ml-1 h-3.5 w-3.5 inline" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 inline" />;
  };

  const sorted = [...paymentHistory].sort((a, b) => {
    const av = a[sortField]; const bv = b[sortField];
    if (av == null) return 1; if (bv == null) return -1;
    const cmp = typeof av === "number"
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const completed = paymentHistory.filter(p => p.status === "completed");
  const pending   = paymentHistory.filter(p => p.status === "pending");
  const totalPaid = completed.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  if (loading && paymentHistory.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary */}
      {paymentHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Completed", count: completed.length, sub: formatCurrency(totalPaid) },
            { label: "Pending",   count: pending.length,   sub: "Awaiting confirmation" },
            { label: "Total paid", count: null,            sub: formatCurrency(totalPaid) },
          ].map(({ label, count, sub }) => (
            <Card key={label} className="border">
              <CardContent className="pt-4 pb-3 text-center">
                {count !== null
                  ? <p className="text-2xl font-bold">{count}</p>
                  : <p className="text-lg font-bold">{sub}</p>
                }
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {count !== null && <p className="text-xs font-medium mt-1">{sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Payment History
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
              <Button
                variant="outline" size="sm"
                onClick={() => setShowFilters(s => !s)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {Object.values(filters).filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/40 rounded-lg border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Unit</Label>
                <Select value={filters.unitId} onValueChange={(v) => handleFilterChange("unitId", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All units</SelectItem>
                    {occupancies.map((occ) => (
                      <SelectItem key={occ.unit_id} value={occ.unit_id.toString()}>
                        {occ.unit_name} — {occ.property_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">From date</Label>
                <Input type="date" className="mt-1" value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)} />
              </div>

              <div>
                <Label className="text-xs">To date</Label>
                <Input type="date" className="mt-1" value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)} />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="px-6 pb-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground px-6">
              <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium mb-1">No payments found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Try adjusting or clearing your filters."
                  : "Your payment history will appear here after your first payment."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("unit_name")}>
                        Unit <SortIcon field="unit_name" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("amount")}>
                        Amount <SortIcon field="amount" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("created_at")}>
                        Date <SortIcon field="created_at" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => { setSelected(payment); setShowDetail(true); }}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{payment.unit_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.property_name}</p>
                      </TableCell>
                      <TableCell className="font-semibold">{fmt(payment.amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(payment.payment_period_start)} – {fmtDate(payment.payment_period_end)}
                      </TableCell>
                      <TableCell>{statusBadge(payment.status, getPaymentStatusColor)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(payment.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); setSelected(payment); setShowDetail(true); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDetailDialog
        payment={selected}
        open={showDetail}
        onOpenChange={setShowDetail}
        getColor={getPaymentStatusColor}
      />
    </div>
  );
}