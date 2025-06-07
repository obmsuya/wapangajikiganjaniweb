'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  RefreshCw,
  Calendar,
  Award
} from 'lucide-react';
import { usePartnerPerformance } from '@/hooks/admin/useAdminPartner';

/**
 * Partner Analytics Dashboard Component
 * 
 * Displays comprehensive partner performance analytics in Cloudflare style
 */
export default function PartnerAnalyticsDashboard() {
  const { performance, loading, refreshPerformance } = usePartnerPerformance();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  // Get performance indicator
  const getPerformanceIndicator = (value, isGood = true) => {
    if (!value || value === 0) return null;
    
    const Icon = isGood ? TrendingUp : TrendingDown;
    const colorClass = isGood ? 'text-green-600' : 'text-red-600';
    
    return <Icon className={`h-4 w-4 ${colorClass}`} />;
  };

  // Top partners table columns
  const topPartnersColumns = [
    {
      header: 'Rank',
      accessor: 'rank',
      cell: (row, index) => (
        <div className="flex items-center gap-2">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
              index === 1 ? 'bg-gray-100 text-gray-800' : 
              index === 2 ? 'bg-amber-100 text-amber-800' : 
              'bg-blue-100 text-blue-800'}
          `}>
            {index + 1}
          </div>
          {index < 3 && <Award className="h-4 w-4 text-amber-500" />}
        </div>
      )
    },
    {
      header: 'Partner',
      accessor: 'partner_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.partner_name}</div>
          <Badge variant="outline" className="text-xs font-mono">
            {row.referral_code}
          </Badge>
        </div>
      )
    },
    {
      header: 'Total Earned',
      accessor: 'total_earned',
      sortable: true,
      cell: (row) => (
        <div className="text-right font-medium">
          {formatCurrency(row.total_earned)}
        </div>
      )
    },
    {
      header: 'Transactions',
      accessor: 'transaction_count',
      sortable: true,
      cell: (row) => (
        <div className="text-center">
          <span className="font-medium">{row.transaction_count}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        <Badge className={row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.is_active ? 'Active' : 'Suspended'}
        </Badge>
      )
    },
    {
      header: 'Joined',
      accessor: 'created_at',
      cell: (row) => formatDate(row.created_at)
    }
  ];

  // Recent activity table columns
  const recentActivityColumns = [
    {
      header: 'Partner',
      accessor: 'partner_name',
      cell: (row) => (
        <span className="font-medium">{row.partner_name}</span>
      )
    },
    {
      header: 'Commission',
      accessor: 'amount',
      cell: (row) => (
        <div className="font-medium text-green-600">
          {formatCurrency(row.amount)}
        </div>
      )
    },
    {
      header: 'Rate',
      accessor: 'commission_rate',
      cell: (row) => (
        row.commission_rate ? (
          <Badge variant="outline">
            {parseFloat(row.commission_rate).toFixed(1)}%
          </Badge>
        ) : '—'
      )
    },
    {
      header: 'Landlord',
      accessor: 'landlord_name',
      cell: (row) => (
        <span className="text-sm">{row.landlord_name || '—'}</span>
      )
    },
    {
      header: 'Plan',
      accessor: 'plan_name',
      cell: (row) => (
        row.plan_name ? (
          <div>
            <span className="text-sm">{row.plan_name}</span>
            <div className="text-xs text-gray-500 capitalize">
              {row.plan_type}
            </div>
          </div>
        ) : '—'
      )
    },
    {
      header: 'Date',
      accessor: 'created_at',
      cell: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
      )
    }
  ];

  const stats = performance?.partner_stats || {};
  const financials = performance?.financial_stats || {};
  const topPartners = performance?.top_partners || [];
  const recentActivity = performance?.recent_activity || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partner Analytics</h3>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive partner performance metrics and insights
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPerformance}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Active Partners</div>
              <div className="text-2xl font-bold">{stats.active_partners || 0}</div>
            </div>
            <div className="flex items-center gap-1">
              {getPerformanceIndicator(stats.active_partners)}
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Referrals</div>
              <div className="text-2xl font-bold">{stats.total_referrals || 0}</div>
            </div>
            <div className="flex items-center gap-1">
              {getPerformanceIndicator(stats.total_referrals)}
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Conversion Rate</div>
              <div className="text-2xl font-bold">
                {stats.conversion_rate ? `${parseFloat(stats.conversion_rate).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getPerformanceIndicator(stats.conversion_rate)}
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Commissions</div>
              <div className="text-2xl font-bold">
                {formatCurrency(financials.total_commissions_paid)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getPerformanceIndicator(financials.total_commissions_paid)}
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Financial Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Lifetime Earned</span>
              <span className="font-medium">{formatCurrency(financials.lifetime_earned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Payouts</span>
              <span className="font-medium">{formatCurrency(financials.total_payouts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Outstanding Balance</span>
              <span className="font-medium text-amber-600">{formatCurrency(financials.outstanding_balance)}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Activity Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Commission Transactions</span>
              <span className="font-medium">{financials.total_commission_transactions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Payout Transactions</span>
              <span className="font-medium">{financials.total_payout_transactions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Avg Commission</span>
              <span className="font-medium">{formatCurrency(financials.average_commission)}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Recent Insights
          </h4>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-500">Partners with referrals: </span>
              <span className="font-medium">{stats.partners_with_referrals || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Suspended partners: </span>
              <span className="font-medium text-red-600">{stats.suspended_partners || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Last updated: </span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performing Partners */}
      {topPartners.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Top Performing Partners</h4>
          <CloudflareTable
            data={topPartners}
            columns={topPartnersColumns}
            pagination={false}
            searchable={false}
            emptyMessage="No partner performance data available"
          />
        </div>
      )}

      {/* Recent Commission Activity */}
      {recentActivity.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Recent Commission Activity</h4>
          <CloudflareTable
            data={recentActivity}
            columns={recentActivityColumns}
            pagination={false}
            searchable={false}
            emptyMessage="No recent activity"
          />
        </div>
      )}
    </div>
  );
}