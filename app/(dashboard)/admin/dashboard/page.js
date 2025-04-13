// app/(dashboard)/admin/dashboard/page.js
"use client";

import React, { useState } from 'react';
import { Plus, Download, BarChart3, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  CloudflarePageHeader, 
  CloudflareBreadcrumbs 
} from '@/components/cloudflare/Breadcrumbs';
import { CloudflareDashboardStats } from '@/components/cloudflare/DashboardStats';
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from '@/components/cloudflare/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Remove ApolloProvider import and client import since it's handled in the layout

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Breadcrumb items for this page
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard' }
  ];

  // Action buttons for the page header
  const pageActions = (
    <>
      <Button variant="outline" size="sm" className="flex items-center">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm" className="flex items-center">
        <Plus className="h-4 w-4 mr-2" />
        New Report
      </Button>
    </>
  );

  return (
    // Remove the ApolloProvider wrapper since it's in the layout
    <div className="max-w-screen-2xl mx-auto pb-16">
      {/* Page header with breadcrumbs */}
      <CloudflarePageHeader
        title="Admin Dashboard"
        description="Overview of user statistics and system metrics"
        breadcrumbs={breadcrumbItems}
        actions={pageActions}
      />
      
      {/* Rest of your component remains the same */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Overview tab content */}
          <CloudflareDashboardStats />
          
          {/* Additional overview cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CloudflareCard>
              <CloudflareCardHeader title="Recent User Activity" />
              <CloudflareCardContent>
                <p className="text-gray-500">
                  This section will display recent user activity logs.
                </p>
              </CloudflareCardContent>
            </CloudflareCard>
            
            <CloudflareCard>
              <CloudflareCardHeader title="System Status" />
              <CloudflareCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Health</h3>
                    <p className="text-green-600 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                      All systems operational
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Last Updated</h3>
                    <p className="text-gray-600">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </CloudflareCardContent>
            </CloudflareCard>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics tab content */}
          <CloudflareCard>
            <CloudflareCardHeader title="User Growth" />
            <CloudflareCardContent className="h-80 flex items-center justify-center">
              <p className="text-gray-500">User growth chart will be displayed here.</p>
            </CloudflareCardContent>
          </CloudflareCard>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CloudflareCard>
              <CloudflareCardHeader title="User Types Distribution" />
              <CloudflareCardContent className="h-60 flex items-center justify-center">
                <p className="text-gray-500">User types pie chart will be displayed here.</p>
              </CloudflareCardContent>
            </CloudflareCard>
            
            <CloudflareCard>
              <CloudflareCardHeader title="Login Activity" />
              <CloudflareCardContent className="h-60 flex items-center justify-center">
                <p className="text-gray-500">Login activity chart will be displayed here.</p>
              </CloudflareCardContent>
            </CloudflareCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}