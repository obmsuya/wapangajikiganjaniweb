"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Home,
  FileText,
  Timer,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudflareTable } from "@/components/cloudflare/Table";
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from "@/components/cloudflare/Breadcrumbs";
import { usePaymentConfirmationStore } from "@/stores/landlord/usePaymentConfirmationStore";

export default function PaymentConfirmationPage() {
  const {
    loading,
    error,
    pendingPayments,
    selectedPayment,
    filters,
    showConfirmDialog,
    confirmAction,
    rejectionReason,
    processingConfirmation,
    setFilters,
    setRejectionReason,
    fetchPendingPayments,
    confirmPayment,
    openConfirmDialog,
    closeConfirmDialog,
    getFilteredPayments,
    getSummaryStats,
    formatCurrency,
    refreshData,
  } = usePaymentConfirmationStore();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !confirmAction) return;
    const result = await confirmPayment(
      selectedPayment.id,
      confirmAction,
      rejectionReason,
    );
    return result.success;
  };

  const filteredPayments = getFilteredPayments();
  const stats = getSummaryStats();

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/landlord/dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    { label: "Payments", href: "/landlord/payments" },
    { label: "Payment Confirmations" },
  ];

  const getUrgencyColor = (payment) => {
    if (payment.isOverdue) return "text-red-600";
    if (payment.daysPending >= 2) return "text-orange-600";
    return "text-gray-500";
  };

  const getStatusBadge = (payment) => {
    if (payment.isOverdue) {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    if (payment.daysPending >= 2) {
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          <Timer className="h-3 w-3 mr-1" />
          Urgent
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const tableColumns = [
    {
      header: "Tenant Information",
      accessor: "tenantName",
      searchable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">{row.tenantName}</div>
            <div className={`text-sm ${getUrgencyColor(row)}`}>
              {row.isOverdue ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Confirmation overdue
                </span>
              ) : (
                `${row.daysPending} day${row.daysPending !== 1 ? "s" : ""} pending`
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Property Details",
      accessor: "propertyName",
      searchable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">{row.propertyName}</div>
            <div className="text-sm text-gray-500 truncate">{row.unitName}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Payment Information",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <div className="text-right">
          <div className="font-semibold text-lg text-gray-900">
            {formatCurrency(row.amount)}
          </div>
          <div className="text-sm text-gray-500">Payment Amount</div>
        </div>
      ),
    },
    {
      header: "Payment Period",
      accessor: "paymentPeriodStart",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {row.formattedPaymentPeriod}
            </div>
            <div className="text-xs text-gray-500">Rent period</div>
          </div>
        </div>
      ),
    },
    {
      header: "Confirmation Status",
      accessor: "confirmationDeadline",
      sortable: true,
      cell: (row) => (
        <div className="space-y-2">
          {getStatusBadge(row)}
          {row.formattedConfirmationDeadline && (
            <div className="text-xs text-gray-500">
              Deadline: {row.formattedConfirmationDeadline}
            </div>
          )}
          {row.daysUntilDeadline !== null && (
            <div className={`text-xs ${row.isOverdue ? "text-red-600" : "text-gray-500"}`}>
              {row.isOverdue
                ? `${Math.abs(row.daysUntilDeadline)} days overdue`
                : `${row.daysUntilDeadline} days remaining`}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => openConfirmDialog(row, "accept")}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => openConfirmDialog(row, "reject")}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  // ── Partial payment progress for the selected payment ──────────────
  // Derived from fields the store already maps — no extra API call needed
  const cycleAmountDue   = selectedPayment?.cycleAmountDue   ?? null;
  const cycleAmountPaid  = selectedPayment?.cycleAmountPaid  ?? null;
  const showCycleBalance = cycleAmountDue !== null && cycleAmountPaid !== null;
  const afterConfirm     = showCycleBalance ? cycleAmountPaid + (selectedPayment?.amount ?? 0) : null;
  const willSettle       = showCycleBalance && afterConfirm >= cycleAmountDue;

  return (
    <div className="mx-auto max-md:pb-8 space-y-8">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Payment Confirmations"
        description="Review and confirm manual payments reported by tenants"
        actions={
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <br />

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPending}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(stats.totalAmount)} total
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting confirmation</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdueCount}</p>
                <p className="text-sm text-gray-500 mt-1">Past deadline</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-3xl font-bold text-purple-600">{stats.todayCount}</p>
                <p className="text-sm text-gray-500 mt-1">New requests</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-8">
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters({ dateRange: value })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters({ sortBy: value })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="paymentPeriodStart">Payment Period</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="confirmationDeadline">Deadline</SelectItem>
                <SelectItem value="daysPending">Days Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value) => setFilters({ sortOrder: value })}
            >
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Error Loading Payments
              </h3>
              <p className="text-red-600 mb-6 text-center max-w-md">{error}</p>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {loading
                  ? "Loading payments..."
                  : "No pending payment confirmations. All payments have been processed."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Confirmations
                </h3>
                <Badge variant="secondary" className="text-sm">
                  {filteredPayments.length} payment
                  {filteredPayments.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <CloudflareTable
                data={filteredPayments}
                columns={tableColumns}
                loading={loading}
                pagination={true}
                pageSize={10}
                searchable={true}
                filterable={false}
                emptyMessage="No pending payments found"
                initialSort={{ field: "confirmationDeadline", direction: "asc" }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirm / Reject Dialog ─────────────────────────────────── */}
      <Dialog open={showConfirmDialog} onOpenChange={closeConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  confirmAction === "accept" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {confirmAction === "accept" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {confirmAction === "accept"
                    ? "Confirm Payment Receipt"
                    : "Reject Payment Claim"}
                </div>
                <div className="text-sm font-normal text-gray-500">
                  {confirmAction === "accept"
                    ? "Verify that you have received this payment from the tenant"
                    : "Mark this payment as not received and provide a reason"}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-5">
              {/* Payment details */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">
                      Tenant
                    </Label>
                    <div className="font-medium text-gray-900 mt-0.5">
                      {selectedPayment.tenantName}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">
                      Amount
                    </Label>
                    <div className="font-semibold text-lg text-gray-900 mt-0.5">
                      {formatCurrency(selectedPayment.amount)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">
                      Property
                    </Label>
                    <div className="font-medium text-gray-900 mt-0.5">
                      {selectedPayment.propertyName}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">
                      Unit
                    </Label>
                    <div className="font-medium text-gray-900 mt-0.5">
                      {selectedPayment.unitName}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Period</span>
                    <span className="font-medium">{selectedPayment.formattedPaymentPeriod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confirm by</span>
                    <span className={`font-medium ${selectedPayment.isOverdue ? "text-red-600" : ""}`}>
                      {selectedPayment.formattedConfirmationDeadline || "No deadline set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Waiting</span>
                    <span className={`font-medium ${selectedPayment.daysPending >= 2 ? "text-orange-600" : ""}`}>
                      {selectedPayment.daysPending} day
                      {selectedPayment.daysPending !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Partial payment / cycle balance — shown when available */}
                {showCycleBalance && confirmAction === "accept" && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Billing Cycle Balance
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-52 text-center">
                              This shows how much of the full billing cycle has
                              been paid including this payment if confirmed.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full cycle rent</span>
                        <span>{formatCurrency(cycleAmountDue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid so far</span>
                        <span className="text-green-700">{formatCurrency(cycleAmountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>After confirming</span>
                        <span className={willSettle ? "text-green-600" : "text-destructive"}>
                          {willSettle
                            ? "Cycle fully paid ✓"
                            : `${formatCurrency(cycleAmountDue - afterConfirm)} still outstanding`}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {selectedPayment.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-gray-500 uppercase tracking-wider">
                        Tenant Notes
                      </Label>
                      <div className="mt-1.5 text-sm text-gray-700 p-3 bg-blue-50 rounded-md border border-blue-100">
                        <FileText className="h-4 w-4 inline mr-2 text-blue-600" />
                        {selectedPayment.notes}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Rejection reason */}
              {confirmAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason" className="text-sm font-medium">
                    Reason for Rejection{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explain why this payment is being rejected so the tenant can act on it…"
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

              {/* Overdue warning */}
              {selectedPayment.isOverdue && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The confirmation window has passed. Please act now to keep
                    your tenant's records accurate.
                  </AlertDescription>
                </Alert>
              )}

              {/* Reject advisory */}
              {confirmAction === "reject" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The tenant will be told this payment was not received and
                    may need to pay again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 mt-2">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={processingConfirmation}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                processingConfirmation ||
                (confirmAction === "reject" && !rejectionReason.trim())
              }
              className={`flex-1 ${
                confirmAction === "accept"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {processingConfirmation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : confirmAction === "accept" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Receipt
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
    </div>
  );
}