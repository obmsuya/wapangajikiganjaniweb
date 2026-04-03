// app/(dashboard)/landlord/payments/page.jsx
"use client";

import { useState, useEffect } from "react";
import {
  Banknote,
  Wallet,
  Clock,
  AlertCircle,
  Download,
  Send,
  RefreshCw,
  Search,
  Eye,
  Home,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CloudflareTable } from "@/components/cloudflare/Table";
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from "@/components/cloudflare/Breadcrumbs";
import { usePaymentPageStore } from "@/stores/landlord/usePaymentsPageStore";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("airtel");
  const [withdrawalPhone, setWithdrawalPhone] = useState("");
  const [withdrawalError, setWithdrawalError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    loading,
    error,
    wallet,
    allPayments,
    overallSummary,
    filters,
    updateFilters,
    requestWithdrawal,
    getFilteredPayments,
    formatCurrency,
    getStatusColor,
    initializePage,
    refreshAll,
  } = usePaymentPageStore();

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  const handleWithdrawal = async () => {
    setWithdrawalError("");
    setIsProcessing(true);

    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0 || amount > wallet.balance || !withdrawalPhone) {
      setIsProcessing(false);
      return;
    }

    const success = await requestWithdrawal(amount, "mobile_money", {
      recipient_phone: withdrawalPhone,
      provider: withdrawalMethod,
    });

    if (success) {
      toast.success("Withdrawal Requested", {
        description: `TZS ${amount.toLocaleString()} → ${withdrawalPhone} (${withdrawalMethod.toUpperCase()})`,
      });
      setShowWithdrawalDialog(false);
      setWithdrawalAmount("");
      setWithdrawalPhone("");
      setWithdrawalMethod("airtel");
    } else {
      toast.error("Withdrawal Failed", {
        description: error || "Please try again",
      });
    }
    setIsProcessing(false);
  };

  const filteredPayments = getFilteredPayments();

  const paymentColumns = [
    {
      header: "Tenant",
      accessor: "tenant_name",
      searchable: true,
      cell: (row) => (
        <div>
          <div className="max-sm:text-sm font-medium">{row.tenant_name || "N/A"}</div>
          <div className="text-xs sm:text-sm text-gray-500">
            {row.tenant_phone || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Property",
      accessor: "property_name",
      searchable: true,
      cell: (row) => (
        <div>
          <div className="max-sm:text-sm font-medium">{row.property_name}</div>
          <div className="text-xs sm:text-sm text-gray-500">
            {row.unit_name} {row.floor_number && `(Floor ${row.floor_number})`}
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <div className="font-semibold sm:text-lg">
          {formatCurrency(row.amount)}
        </div>
      ),
    },
    {
      header: "Payment Period",
      accessor: "payment_period_start",
      sortable: true,
      cell: (row) => (
        <div className="text-xs sm:text-sm">
          {new Date(row.payment_period_start).toLocaleDateString()} -
          {new Date(row.payment_period_end).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      filterable: true,
      filterOptions: [
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
      cell: (row) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>
          {row.status || "N/A"}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      sortable: true,
      cell: (row) => (
        <div className="text-xs sm:text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    // {
    //   header: 'Actions',
    //   accessor: 'actions',
    //   cell: (row) => (
    //     <Button size="sm" variant="outline">
    //       <Eye className="h-4 w-4" />
    //     </Button>
    //   )
    // }
  ];

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/landlord/properties",
      icon: <Home className="h-4 w-4" />,
    },
    { label: "Payments" },
  ];

  if (loading) {
    return (
      <div className="mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw className="h-7 sm:h-8 w-7 sm:w-8 animate-spin text-slate-400" />
          <span className="text-sm sm:text-base text-slate-600">Loading payment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-md:pb-16">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Payments"
        description="Manage your rental payments and wallet"
        actions={
          <Button onClick={refreshAll} variant="outline" size="sm" className="w-full sm:w-fit">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        }
      />

      <br />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="font-medium text-red-900">Error Loading Data</h3>
                <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <br />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-4 mb-4">
        <Card className="relative overflow-hidden transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500 opacity-5 rounded-full -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-2 bg-emerald-100 rounded-2xl flex-shrink-0">
                <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <span>Total Revenue</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg sm:text-xl lg:text-3xl font-bold text-emerald-600 break-words">
              {formatCurrency(overallSummary.totalAmount)}
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              This month: <br className="inline lg:hidden" />
              <span className="font-semibold">{formatCurrency(overallSummary.thisMonth)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500 opacity-5 rounded-full -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-2 bg-blue-100 rounded-2xl flex-shrink-0">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span>Wallet Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-lg sm:text-xl lg:text-3xl font-bold text-blue-600 break-words">
              {formatCurrency(wallet.balance)}
            </p>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
              <p className="text-xs sm:text-sm text-slate-600">Available to withdraw</p>
              <Button
                size="sm"
                onClick={() => setShowWithdrawalDialog(true)}
                disabled={wallet.balance <= 0}
                className="w-full sm:w-fit"
              >
                <Send className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Payment History</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Complete payment history across all properties
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap sm:items-center">
              <div className="relative flex-1 sm:flex-none sm:min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10 w-full text-sm"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.period}
                onValueChange={(value) => updateFilters({ period: value })}
              >
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="w-full sm:w-fit text-sm"
                onClick={() => {
                  // 1. Shape the data rows
                  const rows = filteredPayments.map((p) => ({
                    Tenant: p.tenant_name || "N/A",
                    Phone: p.tenant_phone || "N/A",
                    Property: p.property_name || "N/A",
                    Unit: p.unit_name || "N/A",
                    Floor: p.floor_number ? `Floor ${p.floor_number}` : "",
                    "Amount (TZS)": p.amount || 0,
                    "Period Start": p.payment_period_start
                      ? new Date(p.payment_period_start).toLocaleDateString()
                      : "",
                    "Period End": p.payment_period_end
                      ? new Date(p.payment_period_end).toLocaleDateString()
                      : "",
                    Status: p.status || "N/A",
                    Date: p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "",
                  }));

                  // 2. Create workbook + worksheet
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(rows);

                  // 3. Column widths
                  ws["!cols"] = [
                    { wch: 24 }, // Tenant
                    { wch: 16 }, // Phone
                    { wch: 26 }, // Property
                    { wch: 14 }, // Unit
                    { wch: 10 }, // Floor
                    { wch: 16 }, // Amount
                    { wch: 14 }, // Period Start
                    { wch: 14 }, // Period End
                    { wch: 12 }, // Status
                    { wch: 14 }, // Date
                  ];

                  // 4. Style header row (row 1)
                  const headerKeys = Object.keys(rows[0] || {});
                  headerKeys.forEach((_, colIdx) => {
                    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                    if (!ws[cellRef]) return;
                    ws[cellRef].s = {
                      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                      fill: { fgColor: { rgb: "1E3A5F" } }, // dark navy — Wapangaji brand-ish
                      alignment: { horizontal: "center", vertical: "center", wrapText: true },
                      border: {
                        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                      },
                    };
                  });

                  // 5. Style data rows — alternate row shading + status colour on Status column
                  const statusColIdx = headerKeys.indexOf("Status");
                  const statusColors = {
                    completed: "D1FAE5", // green-100
                    pending: "FEF9C3", // yellow-100
                    failed: "FEE2E2", // red-100
                  };

                  rows.forEach((row, rowIdx) => {
                    const excelRow = rowIdx + 1; // +1 because row 0 is the header
                    const isEven = rowIdx % 2 === 0;

                    headerKeys.forEach((_, colIdx) => {
                      const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: colIdx });
                      if (!ws[cellRef]) return;

                      const isStatusCol = colIdx === statusColIdx;
                      const statusKey = (row["Status"] || "").toLowerCase();

                      ws[cellRef].s = {
                        fill: {
                          fgColor: {
                            rgb: isStatusCol && statusColors[statusKey]
                              ? statusColors[statusKey]
                              : isEven ? "F8FAFC" : "FFFFFF",
                          },
                        },
                        alignment: { vertical: "center" },
                        border: {
                          bottom: { style: "hair", color: { rgb: "E2E8F0" } },
                        },
                      };
                    });
                  });

                  // 6. Append sheet and trigger download
                  XLSX.utils.book_append_sheet(wb, ws, "Payments");
                  XLSX.writeFile(wb, `wapangaji-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Banknote className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                No Payments Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {filters.search ||
                  filters.status !== "all" ||
                  filters.period !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "Payment history will appear here once tenants start making payments"}
              </p>
            </div>
          ) : (
            <div className="px-2">
              <CloudflareTable
                data={filteredPayments}
                columns={paymentColumns}
                pagination={true}
                pageSize={10}
                searchable={false}
                filterable={true}
                emptyMessage="No payments found"
                initialSort={{ field: "created_at", direction: "desc" }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* WITHDRAWAL DIALOG - UPDATED */}
      <Dialog
        open={showWithdrawalDialog}
        onOpenChange={setShowWithdrawalDialog}
      >
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Send className="h-5 w-5 flex-shrink-0" />
              Request Withdrawal
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 sm:py-6 space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Available Balance */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-900">
                <strong>Available Balance:</strong> <span className="block sm:inline mt-1 sm:mt-0">{formatCurrency(wallet.balance)}</span>
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-sm">Amount to Withdraw (TZS)</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1000"
                placeholder="e.g. 50,000"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="mt-2 text-sm"
                disabled={isProcessing}
              />
            </div>

            {/* Provider Selection */}
            <div>
              <Label className="text-sm">Choose Provider</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {[
                  {
                    value: "Airtel",
                    label: "Airtel",
                    logo: "/images/airtel-logo.png",
                  },
                  {
                    value: "AzamPesa",
                    label: "AzamPesa",
                    logo: "/images/azam-pesa-logo.png",
                  },
                  {
                    value: "Yas",
                    label: "Tigo",
                    logo: "/images/tigo-logo.png",
                  },
                  {
                    value: "Halotel",
                    label: "Halotel",
                    logo: "/images/halopesa-logo.png",
                  },
                  {
                    value: "Vodacom",
                    label: "Vodacom",
                    logo: "/images/vodacom-logo.png",
                  },
                ].map((provider) => (
                  <button
                    key={provider.value}
                    onClick={() => setWithdrawalMethod(provider.value)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 sm:gap-2
                  ${withdrawalMethod === provider.value
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                      }`}
                    disabled={isProcessing}
                  >
                    <img
                      src={provider.logo}
                      alt={provider.label}
                      className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                    />
                    <span className="text-xs font-medium text-center">
                      {provider.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <Label htmlFor="phone" className="text-sm">Recipient Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={
                  withdrawalMethod === "azampesa"
                    ? "e.g. 1712433664"
                    : "e.g. 0712345678"
                }
                value={withdrawalPhone}
                onChange={(e) => setWithdrawalPhone(e.target.value)}
                className="mt-2 text-sm"
                maxLength={withdrawalMethod === "azampesa" ? 10 : 12}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {withdrawalMethod === "azampesa"
                  ? "Use AzamPesa format: 10 digits starting with 1"
                  : "Use Tigo/Airtel format: 9 digits or +255"}
              </p>
            </div>

            {/* Validation Error */}
            {withdrawalError && (
              <p className="text-red-500 text-xs sm:text-sm">{withdrawalError}</p>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowWithdrawalDialog(false);
                setWithdrawalAmount("");
                setWithdrawalPhone("");
                setWithdrawalMethod("Airtel");
                setWithdrawalError("");
                setIsProcessing(false);
              }}
              disabled={isProcessing}
              className="w-full sm:w-fit text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawal}
              disabled={isProcessing || !withdrawalPhone || !withdrawalAmount}
              className="w-full sm:w-fit text-sm"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Request Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
