// components/partner/PartnerEarningsPayout.jsx
"use client";

import { useEffect } from 'react';
import { Wallet, TrendingUp, AlertTriangle, Calendar, Download, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerEarningsPayouts({ onRequestPayout }) {
  const { 
    earningsData, 
    payoutHistory,
    loading, 
    error, 
    fetchEarnings,
    fetchPayoutHistory,
    formatCurrency,
    getPayoutStatusColor,
    setShowPayoutDialog 
  } = usePartnerStore();

  useEffect(() => {
    fetchEarnings();
    fetchPayoutHistory();
  }, [fetchEarnings, fetchPayoutHistory]);

  const handleRequestPayout = () => {
    if (onRequestPayout) {
      onRequestPayout();
    } else {
      setShowPayoutDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earningsData) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <p className="text-gray-800">No earnings data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transaction history columns
  const transactionColumns = [
    {
      header: 'Date',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => (
        <div>
          <div className="font-medium text-sm">{row.description}</div>
          <div className="text-xs text-gray-500">
            {row.landlordName} • {row.subscriptionPlan}
          </div>
        </div>
      )
    },
    {
      header: 'Commission Rate',
      accessor: 'commissionRate',
      sortable: true,
      cell: (row) => (
        <Badge className="bg-blue-100 text-blue-800">
          {row.commissionRate.toFixed(1)}%
        </Badge>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => (
        <div className="text-right font-medium text-green-600">
          +{formatCurrency(row.amount)}
        </div>
      )
    }
  ];

  // Payout history columns
  const payoutColumns = [
    {
      header: 'Date',
      accessor: 'requestedAt',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(row.requestedAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {formatCurrency(row.amount)}
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: 'phoneNumber',
      cell: (row) => (
        <div className="text-sm font-mono">
          {row.phoneNumber}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge className={getPayoutStatusColor(row.status)}>
          {row.statusDisplay}
        </Badge>
      )
    },
    {
      header: 'Reference',
      accessor: 'externalReferenceId',
      cell: (row) => (
        <div className="text-xs font-mono text-gray-500">
          {row.externalReferenceId || '—'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.walletSummary.currentBalance)}
              </p>
              <Badge className={earningsData.walletSummary.canRequestPayout ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {earningsData.walletSummary.canRequestPayout ? 'Can Withdraw' : 'Below Minimum'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(earningsData.walletSummary.totalEarned)}
              </p>
              <p className="text-xs text-gray-500">
                Lifetime earnings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-600">
                {formatCurrency(earningsData.walletSummary.totalWithdrawn)}
              </p>
              <p className="text-xs text-gray-500">
                All-time withdrawals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Summary */}
      {earningsData.periodSummary && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Period Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Period Earnings</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(earningsData.periodSummary.totalEarnings)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-xl font-bold text-blue-600">
                  {earningsData.periodSummary.transactionCount}
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Average Commission</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(earningsData.periodSummary.averageCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction History */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {earningsData.recentTransactions && earningsData.recentTransactions.length > 0 ? (
              <CloudflareTable
                data={earningsData.recentTransactions}
                columns={transactionColumns}
                pagination={false}
                searchable={false}
                emptyMessage="No earnings transactions found"
              />
            ) : (
              <div className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Earnings Yet</h3>
                <p className="text-gray-500">
                  Earnings will appear here when your referrals start subscribing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payout Management
            </CardTitle>
            <Button 
              onClick={handleRequestPayout}
              disabled={!earningsData.walletSummary.canRequestPayout}
              size="sm"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </CardHeader>
          <CardContent>
            {/* Payout Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Payout Information</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Minimum payout: TZS 5,000</p>
                <p>• Processing time: 1-3 business days</p>
                <p>• Payouts sent via mobile money</p>
              </div>
            </div>

            {/* Payout History */}
            <div>
              <h4 className="font-medium mb-3">Recent Payouts</h4>
              {payoutHistory && payoutHistory.length > 0 ? (
                <div className="space-y-3">
                  {payoutHistory.slice(0, 5).map((payout, index) => (
                    <div key={payout.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(payout.amount)}</span>
                          <Badge className={getPayoutStatusColor(payout.status)}>
                            {payout.statusDisplay}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {payout.phoneNumber} • {new Date(payout.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {payoutHistory.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full">
                      View All Payouts ({payoutHistory.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No payouts requested yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Payout History Table */}
      {payoutHistory && payoutHistory.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              All Payout History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CloudflareTable
              data={payoutHistory}
              columns={payoutColumns}
              searchable={true}
              pagination={true}
              initialRowsPerPage={10}
              emptyMessage="No payout history found"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}