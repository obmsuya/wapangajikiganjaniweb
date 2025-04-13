// components/admin/TenantDetails.jsx
"use client";

import { CreditCard, Calendar, Home, Check, X, AlertTriangle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudflareTable } from '@/components/cloudflare/Table';

/**
 * Tenant Details Component
 * Shows specific information for tenant user type
 */
export function TenantDetails({ tenant, payments = [] }) {
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate days until next payment
  const calculateDaysUntil = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const statusColors = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      late: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      partial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Payment table columns
  const paymentColumns = [
    {
      header: 'Payment ID',
      accessor: 'id',
      sortable: true,
    },
    {
      header: 'Date',
      accessor: 'payment_date',
      sortable: true,
      type: 'date',
      cell: (row) => formatDate(row.payment_date)
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => formatCurrency(row.amount || 0)
    },
    {
      header: 'Method',
      accessor: 'payment_method',
      sortable: true,
      cell: (row) => {
        const methodIcons = {
          mpesa: "💰",
          card: "💳",
          bank: "🏦",
          cash: "💵"
        };
        return (
          <div className="flex items-center">
            <span className="mr-2">{methodIcons[row.payment_method] || "💲"}</span>
            {row.payment_method?.charAt(0).toUpperCase() + row.payment_method?.slice(1) || 'Unknown'}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(row.status)}`}>
          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1) || 'Unknown'}
        </div>
      )
    },
    {
      header: 'Reference',
      accessor: 'reference',
      sortable: true,
    }
  ];

  // Next payment due date
  const nextPaymentDate = tenant.next_payment_date ? new Date(tenant.next_payment_date) : null;
  const daysUntilPayment = calculateDaysUntil(tenant.next_payment_date);
  
  const getPaymentBadge = () => {
    if (!daysUntilPayment) return null;
    
    if (daysUntilPayment < 0) {
      return <Badge className="bg-red-100 text-red-800">Overdue by {Math.abs(daysUntilPayment)} days</Badge>;
    } else if (daysUntilPayment <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due soon ({daysUntilPayment} days)</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">{daysUntilPayment} days remaining</Badge>;
    }
  };

  // Payment history metrics
  const paymentHistory = {
    onTime: payments.filter(p => p.status === 'paid' && !p.is_late).length,
    late: payments.filter(p => p.status === 'paid' && p.is_late).length,
    missed: payments.filter(p => p.status === 'missed').length,
    total: payments.length
  };

  // Calculate payment reliability percentage
  const reliabilityPercentage = paymentHistory.total > 0 
    ? Math.round((paymentHistory.onTime / paymentHistory.total) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Rental Information */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Information</CardTitle>
          <CardDescription>Current rental details for this tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Property</div>
                  <div className="mt-1">{tenant.property_name || 'No property assigned'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit</div>
                  <div className="mt-1">{tenant.unit_number || 'Not assigned'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Rent</div>
                  <div className="mt-1">{formatCurrency(tenant.rent_amount || 0)}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Move-in Date</div>
                  <div className="mt-1">{formatDate(tenant.move_in_date)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Lease End Date</div>
                  <div className="mt-1">{formatDate(tenant.lease_end_date)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Payment Due</div>
                  <div className="mt-1 flex items-center">
                    {formatDate(tenant.next_payment_date)}
                    <span className="ml-2">{getPaymentBadge()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Reliability */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Reliability</CardTitle>
          <CardDescription>History of tenant's payment habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Payment Reliability Score</span>
                <span className="text-sm font-medium">{reliabilityPercentage}%</span>
              </div>
              <Progress value={reliabilityPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{paymentHistory.onTime}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">On-time Payments</div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{paymentHistory.late}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Late Payments</div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{paymentHistory.missed}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Missed Payments</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Record of past payments</CardDescription>
          </div>
          <Button size="sm" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </CardHeader>
        <CardContent>
          <CloudflareTable
            data={payments}
            columns={paymentColumns}
            pagination={true}
            searchable={true}
            emptyMessage="No payment history found for this tenant."
          />
        </CardContent>
      </Card>
    </div>
  );
}