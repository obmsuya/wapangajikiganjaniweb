"use client";

import { useState, useEffect } from 'react';
import { Home, Users, Wallet, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudflareBreadcrumbs, CloudflarePageHeader } from '@/components/cloudflare/Breadcrumbs';
import PartnerOverview from '@/components/partner/PartnerOverview';
import PartnerReferrals from '@/components/partner/PartnerReferrals';
import PartnerEarningsPayouts from '@/components/partner/PartnerEarningsPayout';
import PartnerPayoutDialog from '@/components/partner/PartnerPayoutDialog';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  const { refreshData, setActiveTab: setStoreActiveTab } = usePartnerStore();

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setStoreActiveTab(activeTab);
  }, [activeTab, setStoreActiveTab]);

  const breadcrumbItems = [
    { label: 'Partner Dashboard', icon: <User className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Partner Dashboard"
        description="Manage your referrals, track earnings, and request payouts"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Referrals
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Earnings & Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isClient && <PartnerOverview />}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          {isClient && <PartnerReferrals />}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          {isClient && <PartnerEarningsPayouts />}
        </TabsContent>
      </Tabs>

      <PartnerPayoutDialog />
    </div>
  );
}