// components/partner/PartnerOverview.jsx
"use client";

import { useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Phone, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerReferrals() {
  const { 
    referralStats, 
    loading, 
    error, 
    fetchReferrals, 
    formatCurrency,
    getConversionRateColor 
  } = usePartnerStore();

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
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

  if (!referralStats) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <p className="text-gray-800">No referral data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats, recentReferrals } = referralStats;

  // Define table columns
  const columns = [
    {
      header: 'Landlord',
      accessor: 'landlordName',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.landlordName}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            {row.landlordPhone}
          </div>
        </div>
      )
    },
    {
      header: 'Referral Date',
      accessor: 'referralDate',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(row.referralDate).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'isPaying',
      cell: (row) => (
        <Badge className={row.isPaying ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.isPaying ? 'Paying Customer' : 'Free User'}
        </Badge>
      )
    },
    {
      header: 'Commission Status',
      accessor: 'commissionStatus',
      cell: (row) => (
        <div className="text-sm">
          {row.isPaying ? (
            <span className="text-green-600 font-medium">Earning Commission</span>
          ) : (
            <span className="text-gray-500">No Commission</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Commission Summary */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Commission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Commission Earned</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalCommissionEarned)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average per Paying Customer</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.payingReferrals > 0 ? 
                  formatCurrency(stats.totalCommissionEarned / stats.payingReferrals) : 
                  formatCurrency(0)
                }
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Potential from Free Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalReferrals - stats.payingReferrals} prospects
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Referrals ({recentReferrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentReferrals.length > 0 ? (
            <CloudflareTable
              data={recentReferrals}
              columns={columns}
              searchable={true}
              pagination={true}
              initialRowsPerPage={10}
              emptyMessage="No referrals found"
            />
          ) : (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Referrals Yet</h3>
              <p className="text-gray-500 mb-4">
                Start referring landlords to earn commissions
              </p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Your Referral Code:</strong> Share this code with potential landlords
                </p>
                <div className="mt-2 p-2 bg-white rounded border font-mono text-lg text-center">
                  {referralStats?.referralCode || 'Loading...'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}