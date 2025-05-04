'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Home, LayoutDashboard, Building, BarChart4, Users } from 'lucide-react';
import { 
  CloudflarePageHeader, 
  CloudflareBreadcrumbs 
} from '@/components/cloudflare/Breadcrumbs';

// Import property admin components
import PropertiesHeader from '@/components/admin/properties/PropertiesHeader';
import PropertyOverview from '@/components/admin/properties/PropertyOverview';
import PropertyListTable from '@/components/admin/properties/PropertyListTable';
import PropertyTenantsTable from '@/components/admin/properties/PropertyTenantsTable';
import PropertyAnalyticsCharts from '@/components/admin/properties/PropertyAnalyticsCharts';
import { PropertyFilters } from '@/components/admin/properties/PropertyTenantsTable';

/**
 * Admin Properties Dashboard Page
 * 
 * This page provides a comprehensive interface for managing and analyzing
 * property-related activities including property listings, tenants, and analytics.
 */
export default function AdminPropertiesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Breadcrumb items for this page
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin', icon: <Home className="h-4 w-4" /> },
    { label: 'Property Management', icon: <Building className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* CloudflareBreadcrumbs for navigation */}
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      {/* Dashboard Header with stats */}
      <PropertiesHeader title="Property Management" />

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
              value="properties" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Building className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            
            <TabsTrigger 
              value="tenants" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Users className="h-4 w-4 mr-2" />
              Tenants
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
                  <PropertyOverview />
                </>
              )}
            </TabsContent>
            
            {/* Properties Tab */}
            <TabsContent value="properties" className="mt-0">
              {isClient && (
                <div className="space-y-6">
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
            
            {/* Tenants Tab */}
            <TabsContent value="tenants" className="mt-0">
              {isClient && <PropertyTenantsTable />}
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-0">
              {isClient && <PropertyAnalyticsCharts />}
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