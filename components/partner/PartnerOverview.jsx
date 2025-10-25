"use client";

import { useEffect } from 'react';
import { Home, Users, DollarSign, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerOverview({ onRequestPayout }) {
  const { 
    dashboardData, 
    loading, 
    partnerInfo,
    error, 
    fetchDashboard,
    fetchPartnerInfo,
    formatCurrency, 
    getBalanceStatus, 
    getDashboardStats,
    setShowPayoutDialog 
  } = usePartnerStore();

  useEffect(() => {
    fetchDashboard();
    fetchPartnerInfo();
  }, [fetchDashboard, fetchPartnerInfo]);

  const handleRequestPayout = () => {
    if (onRequestPayout) {
      onRequestPayout();
    } else {
      setShowPayoutDialog(true);
    }
  };

  const balanceStatus = getBalanceStatus();
  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
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

  if (!dashboardData) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <p className="text-gray-800">No dashboard data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.balance || 0)}
              </p>
              <Badge className={balanceStatus?.canWithdraw ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {balanceStatus?.canWithdraw ? 'Ready to Withdraw' : 'Below Minimum'}
              </Badge>
              <p className="text-xs text-gray-500">
                {balanceStatus?.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalReferrals || 0}
              </p>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {stats?.payingReferrals || 0} Paying
                </Badge>
                <span className="text-xs text-gray-500">
                  {stats?.conversionRate?.toFixed(1) || 0}% conversion
                </span>
              </div>
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalEarned || 0)}
              </p>
              <p className="text-xs text-gray-500">
                Lifetime earnings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Info & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Partner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Full Name</span>
                <span className="font-medium">{partnerInfo.fullName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Referral Code</span>
                <Badge className="bg-blue-100 text-blue-800 font-mono">
                  {partnerInfo.referralCode}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={partnerInfo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {partnerInfo.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Member Since</span>
                <span className="font-medium">
                  {partnerInfo.createdAt ? 
                    new Date(partnerInfo.createdAt).toLocaleDateString() : 
                    '—'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={handleRequestPayout}
                disabled={!balanceStatus?.canWithdraw}
                className="w-full"
                size="lg"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="font-semibold">
                    {dashboardData.referralStats.thisMonthReferrals} referrals
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Conversion</p>
                  <p className="font-semibold">
                    {dashboardData.referralStats.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Commission Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={activity.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Commission from {activity.landlordName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.subscriptionPlan} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}