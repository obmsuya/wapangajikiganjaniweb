'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, LayoutDashboard, CreditCard, BarChart4, AlertCircle } from 'lucide-react';
import { CloudflareBreadcrumbs } from '@/components/cloudflare/Breadcrumbs';

import DashboardHeader from '@/components/admin/payments/DashboardHeader';
import RevenueOverview from '@/components/admin/payments/RevenueOverview';
import SubscriptionPlansList from '@/components/admin/payments/SubscriptionPlansList';
import LandlordSubscriptionsList from '@/components/admin/payments/LandlordSubscriptionsList';
import TransactionsList from '@/components/admin/payments/TransactionsList';
import FailedPaymentsList from '@/components/admin/payments/FailedPaymentsList';
import RevenueAnalyticsChart from '@/components/admin/payments/RevenueAnalyticsChart';

const TABS = [
  { value: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { value: 'subscriptions',  label: 'Subscriptions',  icon: CreditCard },
  { value: 'transactions',   label: 'Transactions',   icon: CreditCard },
  { value: 'failed',         label: 'Failed',         icon: AlertCircle },
  { value: 'analytics',      label: 'Analytics',      icon: BarChart4 },
];

const SUB_TABS_SUBSCRIPTIONS = [
  { value: 'plans',      label: 'Plans' },
  { value: 'landlords',  label: 'Landlords' },
];

const SUB_TABS_ANALYTICS = [
  { value: 'revenue',  label: 'Revenue' },
];

const breadcrumbItems = [
  { label: 'Admin',              href: '/admin',  icon: <Home className="h-4 w-4" /> },
  { label: 'Payment Management',                  icon: <CreditCard className="h-4 w-4" /> },
];

const TRIGGER_CLASS = `
  flex items-center gap-1.5 px-3 py-3 text-sm rounded-none border-b-2
  border-transparent bg-transparent text-muted-foreground font-normal
  data-[state=active]:border-foreground data-[state=active]:text-foreground
  data-[state=active]:font-medium data-[state=active]:bg-transparent
  data-[state=active]:shadow-none hover:text-foreground
  transition-colors -mb-px
`;

export default function AdminPaymentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient]   = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="space-y-4">

      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <DashboardHeader title="Payment Management" />

      <div className="rounded-lg border bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 px-4 gap-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className={TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6">

            <TabsContent value="overview" className="mt-0">
              {isClient && <RevenueOverview />}
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-0">
              {isClient && (
                <Tabs defaultValue="plans">
                  <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-1 w-full justify-start mb-6">
                    {SUB_TABS_SUBSCRIPTIONS.map(({ value, label }) => (
                      <TabsTrigger key={value} value={value} className={TRIGGER_CLASS}>
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="plans" className="mt-0">
                    <SubscriptionPlansList />
                  </TabsContent>
                  <TabsContent value="landlords" className="mt-0">
                    <LandlordSubscriptionsList />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              {isClient && <TransactionsList />}
            </TabsContent>

            <TabsContent value="failed" className="mt-0">
              {isClient && <FailedPaymentsList />}
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              {isClient && (
                <Tabs defaultValue="revenue">
                  <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-1 w-full justify-start mb-6">
                    {SUB_TABS_ANALYTICS.map(({ value, label }) => (
                      <TabsTrigger key={value} value={value} className={TRIGGER_CLASS}>
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="revenue" className="mt-0">
                    <RevenueAnalyticsChart />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </div>

    </div>
  );
}