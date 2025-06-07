'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  DollarSign, 
  Clock,
  RefreshCw 
} from 'lucide-react';
import { usePartnerPerformance } from '@/hooks/admin/useAdminPartner';

/**
 * Partner Overview Stats Component
 * 
 * Displays key metrics for partner performance in Cloudflare style cards
 */
export default function PartnerOverviewStats() {
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

  // Format percentage
  const formatPercent = (value) => {
    if (!value) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const stats = performance?.partner_stats || {};
  const financials = performance?.financial_stats || {};

  const statCards = [
    {
      title: 'Total Partners',
      value: stats.total_partners || 0,
      icon: Users,
      color: 'blue',
      description: 'Registered partners'
    },
    {
      title: 'Active Partners',
      value: stats.active_partners || 0,
      icon: UserCheck,
      color: 'green',
      description: 'Currently active'
    },
    {
      title: 'Suspended Partners',
      value: stats.suspended_partners || 0,
      icon: UserX,
      color: 'red',
      description: 'Temporarily suspended'
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(stats.conversion_rate),
      icon: TrendingUp,
      color: 'purple',
      description: 'Partners with referrals'
    },
    {
      title: 'Total Commissions',
      value: formatCurrency(financials.total_commissions_paid),
      icon: DollarSign,
      color: 'emerald',
      description: 'Lifetime commissions paid'
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(financials.outstanding_balance),
      icon: Clock,
      color: 'amber',
      description: 'Awaiting disbursement'
    }
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      emerald: 'text-emerald-600',
      amber: 'text-amber-600'
    };
    return colors[color] || 'text-gray-600';
  };

  const getBadgeVariant = (color) => {
    const variants = {
      blue: 'default',
      green: 'default',
      red: 'destructive',
      purple: 'secondary',
      emerald: 'default',
      amber: 'secondary'
    };
    return variants[color] || 'secondary';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Partner Performance Overview</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${getIconColor(stat.color)}`} />
                    <span className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </span>
                  </div>
                  
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                
                <Badge variant={getBadgeVariant(stat.color)} className="ml-2">
                  {stat.color === 'red' && stat.value > 0 ? 'Warning' : 'Active'}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick insights */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Quick Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {stats.total_referrals || 0}
            </div>
            <div className="text-gray-500">Total Referrals Made</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {stats.partners_with_referrals || 0}
            </div>
            <div className="text-gray-500">Partners with Referrals</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency(financials.lifetime_earned)}
            </div>
            <div className="text-gray-500">Lifetime Partner Earnings</div>
          </div>
        </div>
      </Card>
    </div>
  );
}