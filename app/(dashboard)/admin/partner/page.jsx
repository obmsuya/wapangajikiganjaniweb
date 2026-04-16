'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, LayoutDashboard, Users, Settings, BarChart4 } from 'lucide-react';
import { CloudflareBreadcrumbs } from '@/components/cloudflare/Breadcrumbs';

import PartnerAnalyticsDashboard from '@/components/admin/partner/PartnerAnalyticsDashboard';
import PartnersListTable from '@/components/admin/partner/PartnersListTable';
import CommissionRatesManager from '@/components/admin/partner/CommissionRatesManager';

const TABS = [
  { value: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { value: 'partners',    label: 'Partners',    icon: Users },
  { value: 'commission',  label: 'Commission',  icon: Settings },
];

const TRIGGER_CLASS = `
  flex items-center gap-1.5 px-3 py-3 text-sm rounded-none border-b-2
  border-transparent bg-transparent text-muted-foreground font-normal
  data-[state=active]:border-foreground data-[state=active]:text-foreground
  data-[state=active]:font-medium data-[state=active]:bg-transparent
  data-[state=active]:shadow-none hover:text-foreground
  transition-colors -mb-px
`;

const breadcrumbItems = [
  { label: 'Admin',              href: '/admin', icon: <Home className="h-4 w-4" /> },
  { label: 'Partner Management',                 icon: <Users className="h-4 w-4" /> },
];

export default function AdminPartnerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient]   = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="flex flex-col gap-4">

      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <div className="mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Admin / Partners
        </p>
        <h1 className="text-xl font-medium">Partner Management</h1>
      </div>

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
              {isClient && <PartnerAnalyticsDashboard />}
            </TabsContent>

            <TabsContent value="partners" className="mt-0">
              {isClient && <PartnersListTable />}
            </TabsContent>

            <TabsContent value="commission" className="mt-0">
              {isClient && <CommissionRatesManager />}
            </TabsContent>

          </div>
        </Tabs>
      </div>

    </div>
  );
}