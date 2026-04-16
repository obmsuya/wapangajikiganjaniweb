'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Building, BarChart4, Users, Home } from 'lucide-react';
import { CloudflareBreadcrumbs } from '@/components/cloudflare/Breadcrumbs';

import PropertiesHeader from '@/components/admin/properties/PropertiesHeader';
import PropertyOverview from '@/components/admin/properties/PropertyOverview';
import PropertyListTable from '@/components/admin/properties/PropertyListTable';
import PropertyTenantsTable, { PropertyFilters } from '@/components/admin/properties/PropertyTenantsTable';
import PropertyAnalyticsCharts from '@/components/admin/properties/PropertyAnalyticsCharts';

const TABS = [
  { value: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { value: 'properties', label: 'Properties', icon: Building },
  { value: 'tenants',    label: 'Tenants',    icon: Users },
  { value: 'analytics',  label: 'Analytics',  icon: BarChart4 },
];

const breadcrumbItems = [
  { label: 'Admin',               href: '/admin',    icon: <Home className="h-4 w-4" /> },
  { label: 'Property Management',                    icon: <Building className="h-4 w-4" /> },
];

export default function AdminPropertiesPage() {
  const [activeTab, setActiveTab]     = useState('overview');
  const [isClient, setIsClient]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="space-y-4">

      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <PropertiesHeader title="Property Management" />

      <div className="rounded-lg border bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 px-4 gap-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="
                  flex items-center gap-1.5 px-3 py-3 text-sm rounded-none border-b-2
                  border-transparent bg-transparent text-muted-foreground font-normal
                  data-[state=active]:border-foreground data-[state=active]:text-foreground
                  data-[state=active]:font-medium data-[state=active]:bg-transparent
                  data-[state=active]:shadow-none hover:text-foreground
                  transition-colors -mb-px
                "
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6">

            <TabsContent value="overview" className="mt-0">
              {isClient && <PropertyOverview />}
            </TabsContent>

            <TabsContent value="properties" className="mt-0">
              {isClient && (
                <div className="space-y-4">
                  {showFilters && (
                    <PropertyFilters
                      filters={{}}
                      updateFilters={() => {}}
                      loading={false}
                      propertyCategories={['Residential', 'Commercial', 'Industrial', 'Mixed Use']}
                      owners={[]}
                      locations={[]}
                    />
                  )}
                  <PropertyListTable onToggleFilters={() => setShowFilters(!showFilters)} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="tenants" className="mt-0">
              {isClient && <PropertyTenantsTable />}
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              {isClient && <PropertyAnalyticsCharts />}
            </TabsContent>

          </div>
        </Tabs>
      </div>

    </div>
  );
}