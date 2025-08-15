// components/landlord/properties/tabs/PropertyPaymentsTab.jsx
"use client";

import { useState, useEffect } from "react";
import { 
  Banknote, 
  Clock, 
  AlertCircle,
  Check,
  X,
  Eye,
  RefreshCw,
  Search,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { usePaymentTabStore } from "@/stores/landlord/UsePaymentTabStore";
import customToast from "@/components/ui/custom-toast";

export default function PropertyPaymentsTab({ property }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    loading,
    error,
    summary,
    filters,
    updateFilters,
    confirmPayment,
    getFilteredPayments,
    getPendingPayments,
    getRecentPayments,
    formatCurrency,
    getStatusColor,
    initializeTab,
    refreshData
  } = usePaymentTabStore();

  useEffect(() => {
    if (property?.id) {
      initializeTab(property.id);
    }
  }, [property?.id, initializeTab]);

  const handleConfirmPayment = (payment, action) => {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedPayment || !confirmAction) return;

    const success = await confirmPayment(
      selectedPayment.id, 
      confirmAction, 
      rejectionReason
    );

    if (success) {
      customToast.success("Payment Updated", {
        description: `Payment ${confirmAction === 'accept' ? 'confirmed' : 'rejected'} successfully.`
      });
      setShowConfirmDialog(false);
      setSelectedPayment(null);
      setConfirmAction('');
      setRejectionReason('');
    }
  };

  const filteredPayments = getFilteredPayments();
  const pendingPayments = getPendingPayments();
  const recentPayments = getRecentPayments(5);

  // Fixed column definitions - removed 'original' references
  const paymentColumns = [
    {
      accessorKey: 'tenant_name',
      header: 'Tenant',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.tenant_name}</div>
          <div className="text-sm text-gray-500">{row.tenant_phone}</div>
        </div>
      )
    },
    {
      accessorKey: 'unit_name',
      header: 'Unit',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.unit_name}</div>
          <div className="text-sm text-gray-500">Floor {row.floor_number}</div>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: (row) => (
        <div className="font-medium">
          {formatCurrency(row.amount)}
        </div>
      )
    },
    {
      accessorKey: 'payment_period_start',
      header: 'Period',
      cell: (row) => (
        <div className="text-sm">
          {new Date(row.payment_period_start).toLocaleDateString()} - 
          {new Date(row.payment_period_end).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: (row) => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirmPayment(row, 'accept')}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirmPayment(row, 'reject')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payment data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Payments</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => refreshData(property?.id)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{summary.pendingCount}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{summary.overdueCount}</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">View All Payments</p>
                <p className="text-sm text-gray-500">Detailed payment page</p>
              </div>
              <Link href="/landlord/payments">
                <Button size="sm" variant="outline">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-gray-900">
                  {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} need confirmation
                </h3>
                <p className="text-sm text-gray-600">Review and confirm tenant payments below</p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tenant or unit..."
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
        </div>

        <Button onClick={() => refreshData(property?.id)} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Payments Table */}
      <CloudflareCard>
        <CloudflareCardHeader>
          <h3 className="text-lg font-semibold">Recent Payments</h3>
          <p className="text-sm text-gray-600">Payment history for this property</p>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <CloudflareTable
            data={filteredPayments}
            columns={paymentColumns}
            emptyMessage="No payments found"
          />
        </CloudflareCardContent>
      </CloudflareCard>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'accept' ? 'Confirm Payment' : 'Reject Payment'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              {confirmAction === 'accept' 
                ? 'Confirm that you received this payment from the tenant.'
                : 'Reject this payment and provide a reason.'
              }
            </p>
            
            {selectedPayment && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Tenant:</strong> {selectedPayment.tenant_name}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedPayment.amount)}</p>
                <p><strong>Unit:</strong> {selectedPayment.unit_name}</p>
              </div>
            )}

            {confirmAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Reason for rejection</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why you're rejecting this payment..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              className={confirmAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {confirmAction === 'accept' ? 'Confirm Payment' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}