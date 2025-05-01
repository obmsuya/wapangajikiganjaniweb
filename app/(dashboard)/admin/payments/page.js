'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Home, LayoutDashboard, CreditCard, BarChart4, AlertCircle } from 'lucide-react';
import { 
  CloudflarePageHeader, 
  CloudflareBreadcrumbs 
} from '@/components/cloudflare/Breadcrumbs';

// Import payment admin components
import DashboardHeader from '@/components/admin/payments/DashboardHeader';
import RevenueOverview from '@/components/admin/payments/RevenueOverview';
import SubscriptionSummary from '@/components/admin/payments/SubscriptionSummary';
import SubscriptionPlansList from '@/components/admin/payments/SubscriptionPlansList';
import LandlordSubscriptionsList from '@/components/admin/payments/LandlordSubscriptionsList';
import TransactionsList from '@/components/admin/payments/TransactionsList';
import FailedPaymentsList from '@/components/admin/payments/FailedPaymentsList';
import RevenueAnalyticsChart from '@/components/admin/payments/RevenueAnalyticsChart';
import SubscriptionStatisticsCharts from '@/components/admin/payments/SubscriptionStatisticsCharts';

/**
 * Admin Payment Dashboard Page
 * 
 * This page provides a comprehensive interface for managing and analyzing
 * payment-related activities including subscriptions, transactions, and revenue.
 */
export default function AdminPaymentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Breadcrumb items for this page
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin', icon: <Home className="h-4 w-4" /> },
    { label: 'Payment Management', icon: <CreditCard className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* CloudflareBreadcrumbs instead of the old Breadcrumb */}
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      {/* Dashboard Header with stats */}
      <DashboardHeader title="Payment Management" />

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
              Dashboard
            </TabsTrigger>
            
            <TabsTrigger 
              value="subscriptions" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            
            <TabsTrigger 
              value="failed" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Failed Payments
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
            
            {/* Dashboard Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              {isClient && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueOverview />
                    <SubscriptionSummary />
                  </div>
                </>
              )}
            </TabsContent>
            
            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-6 mt-0">
              {isClient && (
                <Tabs defaultValue="plans">
                  <TabsList>
                    <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="landlords">Landlord Subscriptions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plans" className="mt-6">
                    <SubscriptionPlansList />
                  </TabsContent>
                  
                  <TabsContent value="landlords" className="mt-6">
                    <LandlordSubscriptionsList />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-0">
              {isClient && <TransactionsList />}
            </TabsContent>
            
            {/* Failed Payments Tab */}
            <TabsContent value="failed" className="mt-0">
              {isClient && <FailedPaymentsList />}
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-0">
              {isClient && (
                <Tabs defaultValue="revenue">
                  <TabsList>
                    <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
                    <TabsTrigger value="subscriptions">Subscription Analytics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="revenue" className="mt-6">
                    <RevenueAnalyticsChart />
                  </TabsContent>
                  
                  <TabsContent value="subscriptions" className="mt-6">
                    <SubscriptionStatisticsCharts />
                  </TabsContent>
                </Tabs>
              )}
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