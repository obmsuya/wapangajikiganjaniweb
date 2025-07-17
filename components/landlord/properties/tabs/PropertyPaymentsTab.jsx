// components/landlord/properties/tabs/PropertyPaymentsTab.jsx
"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Check,
  X,
  Filter,
  RefreshCw,
  Search
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent, CloudflareStatCard } from "@/components/cloudflare/Card";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { usePropertyPayments } from "@/hooks/landlord/usePropertyPayments";
import PaymentService from "@/services/landlord/payment";
import customToast from "@/components/ui/custom-toast";

export default function PropertyPaymentsTab({ property }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    payments,
    paymentStats,
    unitBreakdown,
    loading,
    error,
    filters,
    updateFilters,
    confirmPayment,
    getUpcomingPayments,
    getOverduePayments,
    getRecentPayments,
    refetchPayments
  } = usePropertyPayments(property?.id);

  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);

  useEffect(() => {
    if (property?.id) {
      loadScheduleData();
    }
  }, [property?.id]);

  const loadScheduleData = async () => {
    try {
      const [upcomingResponse, overdueResponse] = await Promise.all([
        getUpcomingPayments(),
        getOverduePayments()
      ]);

      if (upcomingResponse.success) {
        setUpcomingPayments(upcomingResponse.schedules || []);
      }
      
      if (overdueResponse.success) {
        setOverduePayments(overdueResponse.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  const handleConfirmPayment = async (payment, action) => {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const processPaymentConfirmation = async () => {
    if (!selectedPayment || !confirmAction) return;

    try {
      setIsProcessing(true);
      
      await confirmPayment(selectedPayment.id, confirmAction, rejectionReason);
      
      customToast.success("Payment Updated", {
        description: `Payment has been ${confirmAction === 'accept' ? 'confirmed' : 'rejected'} successfully.`
      });
      
      setShowConfirmDialog(false);
      setSelectedPayment(null);
      setConfirmAction('');
      setRejectionReason('');
      
    } catch (error) {
      customToast.error("Update Failed", {
        description: error.message || "Failed to update payment status."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.unitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const recentPayments = getRecentPayments(5);

  const paymentColumns = [
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.tenantName}</div>
          <div className="text-sm text-gray-500">{row.original.tenantPhone}</div>
        </div>
      )
    },
    {
      accessorKey: 'unitName',
      header: 'Unit',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.unitName}</div>
          <div className="text-sm text-gray-500">Floor {row.original.floorNumber}</div>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-medium">
          {PaymentService.formatCurrency(row.original.amount)}
        </div>
      )
    },
    {
      accessorKey: 'periodStart',
      header: 'Period',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.periodStart).toLocaleDateString()} - 
          {new Date(row.original.periodEnd).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColor = PaymentService.getPaymentStatusColor(row.original.status);
        return (
          <Badge className={`${statusColor} text-xs`}>
            {row.original.status}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirmPayment(row.original, 'accept')}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirmPayment(row.original, 'reject')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {/* View payment details */}}
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Payments</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={refetchPayments} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloudflareStatCard
          title="Expected Revenue"
          value={PaymentService.formatCurrency(paymentStats.totalExpected)}
          icon={<DollarSign className="h-5 w-5" />}
          className="bg-blue-50 border-blue-200"
        />
        <CloudflareStatCard
          title="Collected"
          value={PaymentService.formatCurrency(paymentStats.totalCollected)}
          icon={<TrendingUp className="h-5 w-5" />}
          className="bg-green-50 border-green-200"
        />
        <CloudflareStatCard
          title="Outstanding"
          value={PaymentService.formatCurrency(paymentStats.outstanding)}
          icon={<Clock className="h-5 w-5" />}
          className="bg-yellow-50 border-yellow-200"
        />
        <CloudflareStatCard
          title="Collection Rate"
          value={`${paymentStats.collectionRate}%`}
          icon={<CreditCard className="h-5 w-5" />}
          className="bg-purple-50 border-purple-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Upcoming Payments" 
            actions={
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            }
          />
          <CloudflareCardContent>
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Payments</h3>
                <p className="text-gray-500">All payments are up to date for this property.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{schedule.tenant_name}</div>
                      <div className="text-sm text-gray-500">{schedule.unit_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{PaymentService.formatCurrency(schedule.rent_amount)}</div>
                      <div className="text-sm text-gray-500">Due: {new Date(schedule.due_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardHeader 
            title="Recent Payments" 
            actions={
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            }
          />
          <CloudflareCardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Payments</h3>
                <p className="text-gray-500">Payment history will appear here once payments are processed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{payment.tenantName}</div>
                      <div className="text-sm text-gray-500">{payment.unitName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{PaymentService.formatCurrency(payment.amount)}</div>
                      <div className="text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {overduePayments.length > 0 && (
        <CloudflareCard>
          <CloudflareCardContent>
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  Some payments are past due and require immediate attention.
                </p>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      <CloudflareCard>
        <CloudflareCardHeader 
          title="All Payments" 
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refetchPayments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        <CloudflareCardContent>
          <CloudflareTable
            columns={paymentColumns}
            data={filteredPayments}
            searchable={false}
            pagination={true}
            pageSize={10}
          />
        </CloudflareCardContent>
      </CloudflareCard>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'accept' ? 'Confirm Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'accept' 
                ? 'Are you sure you want to confirm this payment?'
                : 'Please provide a reason for rejecting this payment.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tenant:</span> {selectedPayment.tenantName}
                  </div>
                  <div>
                    <span className="font-medium">Unit:</span> {selectedPayment.unitName}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> {PaymentService.formatCurrency(selectedPayment.amount)}
                  </div>
                  <div>
                    <span className="font-medium">Period:</span> {new Date(selectedPayment.periodStart).toLocaleDateString()} - {new Date(selectedPayment.periodEnd).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {confirmAction === 'reject' && (
                <div>
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejecting this payment..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processPaymentConfirmation}
              disabled={isProcessing || (confirmAction === 'reject' && !rejectionReason.trim())}
              className={confirmAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmAction === 'accept' ? 'Confirm Payment' : 'Reject Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}