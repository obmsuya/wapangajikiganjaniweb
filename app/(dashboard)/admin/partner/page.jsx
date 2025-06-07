'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart4 
} from 'lucide-react';
import { 
  CloudflareBreadcrumbs, 
  CloudflarePageHeader 
} from '@/components/cloudflare/Breadcrumbs';

// Import partner admin components
import PartnerOverviewStats from '@/components/admin/partner/PartnerOverviewStats';
import PartnersListTable from '@/components/admin/partner/PartnersListTable';
import CommissionRatesManager from '@/components/admin/partner/CommissionRatesManager';
import PartnerAnalyticsDashboard from '@/components/admin/partner/PartnerAnalyticsDashboard';

/**
 * Admin Partner Management Page
 * 
 * Provides comprehensive interface for managing partners and referral system
 * following Cloudflare design patterns for consistency with payment admin
 */
export default function AdminPartnerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Breadcrumb items for this page
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin', icon: <Home className="h-4 w-4" /> },
    { label: 'Partner Management', icon: <Users className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      {/* Page Header */}
      <CloudflarePageHeader
        title="Partner Management"
        description="Manage partner accounts, referrals, and commission structure"
      />

      {/* Main Tabs Navigation */}
      <Card className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 rounded-t-lg rounded-b-none border-b border-gray-200 dark:border-gray-700 p-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            
            <TabsTrigger 
              value="partners" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Users className="h-4 w-4 mr-2" />
              Partners
            </TabsTrigger>
            
            <TabsTrigger 
              value="commission" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Settings className="h-4 w-4 mr-2" />
              Commission Rates
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <BarChart4 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6 bg-white dark:bg-gray-950 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg">
            {/* Tab Contents */}
            
            {/* Overview Dashboard Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              {isClient && <PartnerOverviewStats />}
            </TabsContent>
            
            {/* Partners Management Tab */}
            <TabsContent value="partners" className="mt-0">
              {isClient && <PartnersListTable />}
            </TabsContent>
            
            {/* Commission Rates Tab */}
            <TabsContent value="commission" className="mt-0">
              {isClient && <CommissionRatesManager />}
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              {isClient && <PartnerAnalyticsDashboard />}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
      
      {/* Page Footer Info */}
      <div className="text-sm text-gray-500 text-center">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}