"use client";

import { useEffect } from 'react';
import { Wallet, TrendingUp, Download, Calendar } from 'lucide-react';
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
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="rounded-lg border p-4 text-muted-foreground">
        No earnings data available
      </div>
    );
  }

  // Transaction columns
  const transactionColumns = [
    {
      header: 'Date',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Landlord',
      accessor: 'landlordName',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.landlordName}</div>
          <div className="text-sm text-muted-foreground">{row.subscriptionPlan}</div>
        </div>
      )
    },
    {
      header: 'Rate',
      accessor: 'commissionRate',
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary">
          {row.commissionRate.toFixed(1)}%
        </Badge>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => (
        <div className="font-medium text-right">
          {formatCurrency(row.amount)}
        </div>
      )
    }
  ];

  // Payout columns
  const payoutColumns = [
    {
      header: 'Date',
      accessor: 'requestedAt',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">
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
      header: 'Phone',
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
        <Badge variant="outline" className={getPayoutStatusColor(row.status)}>
          {row.statusDisplay}
        </Badge>
      )
    },
    {
      header: 'Reference',
      accessor: 'externalReferenceId',
      cell: (row) => (
        <div className="text-xs font-mono text-muted-foreground">
          {row.externalReferenceId || '—'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <div className="rounded-lg border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Wallet Balance</h2>
              <p className="text-sm text-muted-foreground">Your available commission earnings</p>
            </div>
            <Button 
              onClick={handleRequestPayout}
              disabled={!earningsData.walletSummary.canRequestPayout}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <span>Current Balance</span>
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(earningsData.walletSummary.currentBalance)}
              </div>
              <Badge variant={earningsData.walletSummary.canRequestPayout ? "default" : "secondary"} className="mt-2">
                {earningsData.walletSummary.canRequestPayout ? 'Can Withdraw' : 'Below Minimum'}
              </Badge>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span>Total Earned</span>
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(earningsData.walletSummary.totalEarned)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Lifetime earnings
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Download className="h-4 w-4" />
                <span>Total Withdrawn</span>
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(earningsData.walletSummary.totalWithdrawn)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All-time withdrawals
              </p>
            </div>
          </div>
        </div>

        {/* Period Summary */}
        {earningsData.periodSummary && (
          <div className="border-t p-6">
            <h3 className="font-semibold mb-4">Period Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground mb-1">Period Earnings</div>
                <div className="text-xl font-bold">
                  {formatCurrency(earningsData.periodSummary.totalEarnings)}
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground mb-1">Transactions</div>
                <div className="text-xl font-bold">
                  {earningsData.periodSummary.transactionCount}
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground mb-1">Average Commission</div>
                <div className="text-xl font-bold">
                  {formatCurrency(earningsData.periodSummary.averageCommission)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Earnings History */}
      <div className="rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Earnings History</h2>
          <p className="text-sm text-muted-foreground">Commission earned from referrals</p>
        </div>
        <div>
          {earningsData.recentTransactions && earningsData.recentTransactions.length > 0 ? (
            <CloudflareTable
              data={earningsData.recentTransactions}
              columns={transactionColumns}
              pagination={true}
              searchable={true}
              initialRowsPerPage={10}
              emptyMessage="No earnings transactions found"
            />
          ) : (
            <div className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Earnings Yet</h3>
              <p className="text-muted-foreground">
                Earnings will appear here when your referrals start subscribing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Payout History</h2>
          <p className="text-sm text-muted-foreground">Your withdrawal requests and their status</p>
        </div>
        <div>
          {payoutHistory && payoutHistory.length > 0 ? (
            <CloudflareTable
              data={payoutHistory}
              columns={payoutColumns}
              searchable={true}
              pagination={true}
              initialRowsPerPage={10}
              emptyMessage="No payout history found"
            />
          ) : (
            <div className="p-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payouts Yet</h3>
              <p className="text-muted-foreground">
                Your payout requests will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Information */}
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-3">Payout Information</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Minimum payout amount: TZS 1,000</p>
          <p>• Processing time: 1-3 business days</p>
          <p>• Payouts are sent via mobile money</p>
          <p>• You will receive SMS confirmation when processed</p>
        </div>
      </div>
    </div>
  );
}