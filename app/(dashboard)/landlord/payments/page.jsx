// app/(dashboard)/landlord/payments/page.jsx
"use client";

import { useState, useEffect } from "react";
import { 
  Banknote, 
  Wallet, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Download,
  Send,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { CloudflareBreadcrumbs } from "@/components/cloudflare/Breadcrumbs";
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
    getRecentActivity,
    getMonthlyTrend,
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
  const recentActivity = getRecentActivity(10);
  const monthlyTrend = getMonthlyTrend();

  const paymentColumns = [
    {
      accessorKey: 'tenant_name',
      header: 'Tenant',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.tenant_name}</div>
          <div className="text-sm text-gray-500">{row.original.tenant_phone}</div>
        </div>
      )
    },
    {
      accessorKey: 'property_name',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.property_name}</div>
          <div className="text-sm text-gray-500">{row.original.unit_name}</div>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.original.amount)}
        </div>
      )
    },
    {
      accessorKey: 'payment_period_start',
      header: 'Period',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.payment_period_start).toLocaleDateString()} - 
          {new Date(row.original.payment_period_end).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const breadcrumbItems = [
    { label: "Dashboard", href: "/landlord" },
    { label: "Payments", href: "/landlord/payments" }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage your rental payments and wallet</p>
        </div>
        
        <Button onClick={refreshAll} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Error Loading Data</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallSummary.totalAmount)}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallSummary.thisMonth)}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallSummary.pendingAmount)}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallSummary.overdueAmount)}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Wallet Section */}
      <CloudflareCard>
        <CloudflareCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <h3 className="text-lg font-semibold">My Wallet</h3>
            </div>
            <Button 
              onClick={() => setShowWithdrawalDialog(true)}
              disabled={wallet.balance <= 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(wallet.balance)}</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(wallet.totalReceived)}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Withdrawn</p>
              <p className="text-3xl font-bold text-gray-600">{formatCurrency(wallet.totalWithdrawn)}</p>
            </div>
          </div>
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Filters */}
      <div className="flex items-center justify-between">
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
        </div>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Payments Table */}
      <CloudflareCard>
        <CloudflareCardHeader>
          <h3 className="text-lg font-semibold">All Payments</h3>
          <p className="text-sm text-gray-600">Complete payment history across all properties</p>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <CloudflareTable
            data={filteredPayments}
            columns={paymentColumns}
            emptyMessage="No payments found"
          />
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
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
              <p className="text-sm text-gray-500 mt-1">
                Available balance: {formatCurrency(wallet.balance)}
              </p>
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