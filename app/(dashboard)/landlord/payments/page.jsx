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
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { CloudflareBreadcrumbs, CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { usePaymentPageStore } from "@/stores/landlord/usePaymentsPageStore";
import customToast from "@/components/ui/custom-toast";

export default function PaymentsPage() {
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('mobile_money');

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
    refreshAll
  } = usePaymentPageStore();

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount <= 0) {
      customToast.error("Invalid Amount", {
        description: "Please enter a valid withdrawal amount"
      });
      return;
    }

    if (amount > wallet.balance) {
      customToast.error("Insufficient Balance", {
        description: "Withdrawal amount exceeds available balance"
      });
      return;
    }

    const success = await requestWithdrawal(amount, withdrawalMethod);
    
    if (success) {
      customToast.success("Withdrawal Requested", {
        description: "Your withdrawal request has been submitted"
      });
      setShowWithdrawalDialog(false);
      setWithdrawalAmount('');
    }
  };

  const filteredPayments = getFilteredPayments();

  const paymentColumns = [
    {
      header: 'Tenant',
      accessor: 'tenant_name',
      searchable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.tenant_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.tenant_phone || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Property',
      accessor: 'property_name',
      searchable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.property_name}</div>
          <div className="text-sm text-gray-500">
            {row.unit_name} {row.floor_number && `(Floor ${row.floor_number})`}
          </div>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => (
        <div className="font-semibold text-lg">
          {formatCurrency(row.amount)}
        </div>
      )
    },
    {
      header: 'Payment Period',
      accessor: 'payment_period_start',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">
          {new Date(row.payment_period_start).toLocaleDateString()} - 
          {new Date(row.payment_period_end).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      filterable: true,
      filterOptions: [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' }
      ],
      cell: (row) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      )
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
    { label: "Dashboard", href: "/landlord/dashboard", icon: <Home className="h-4 w-4" /> },
    { label: "Payments" }
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading payment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <CloudflareBreadcrumbs items={breadcrumbItems} />
      
      <CloudflarePageHeader
        title="Payments"
        description="Manage your rental payments and wallet"
        actions={
          <Button onClick={refreshAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Error Loading Data</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(overallSummary.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">
                This month: {formatCurrency(overallSummary.thisMonth)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(wallet.balance)}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Available to withdraw</p>
                <Button 
                  size="sm"
                  onClick={() => setShowWithdrawalDialog(true)}
                  disabled={wallet.balance <= 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Payment History</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete payment history across all properties
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.period} onValueChange={(value) => updateFilters({ period: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status !== 'all' || filters.period !== 'all' 
                  ? 'Try adjusting your filters to see more results' 
                  : 'Payment history will appear here once tenants start making payments'
                }
              </p>
            </div>
          ) : (
            <CloudflareTable
              data={filteredPayments}
              columns={paymentColumns}
              pagination={true}
              pageSize={10}
              searchable={false}
              filterable={true}
              emptyMessage="No payments found"
              initialSort={{ field: 'created_at', direction: 'desc' }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Request Withdrawal
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Available Balance:</strong> {formatCurrency(wallet.balance)}
              </p>
            </div>

            <div>
              <Label htmlFor="amount">Amount to Withdraw</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="method">Withdrawal Method</Label>
              <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdrawal}>
              Request Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}