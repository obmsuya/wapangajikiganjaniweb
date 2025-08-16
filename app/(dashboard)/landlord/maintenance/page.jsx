"use client";

import { useState, useEffect } from "react";
import { Wrench, Clock, CheckCircle, AlertTriangle, XCircle, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CloudflareBreadcrumbs, CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import MaintenanceRequestsList from "@/components/shared/MaintenanceRequestsList";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";

function MaintenanceSummaryCards({ summary }) {
  const summaryCards = [
    {
      title: "Total Requests",
      value: summary.total_requests || 0,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Pending",
      value: summary.pending_count || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "In Progress",
      value: summary.in_progress_count || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Completed",
      value: summary.completed_count || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Urgent",
      value: summary.urgent_count || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {summaryCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 ${card.bgColor} rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LandlordMaintenancePage() {
  const { summary, fetchMaintenanceSummary } = useMaintenanceRequestStore();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchMaintenanceSummary();
  }, [fetchMaintenanceSummary]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/landlord" },
    { label: "Maintenance" }
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {summary.total_requests || 0} Total Requests
      </Badge>
      {summary.pending_count > 0 && (
        <Badge className="bg-yellow-100 text-yellow-800">
          {summary.pending_count} Pending
        </Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Maintenance Management"
        description="Review and respond to tenant maintenance requests"
        actions={pageActions}
      />

      <MaintenanceSummaryCards summary={summary} />

      <Card className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 rounded-t-lg rounded-b-none border-b border-gray-200 dark:border-gray-700 p-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Wrench className="h-4 w-4 mr-2" />
              All Requests
            </TabsTrigger>
            
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending ({summary.pending_count || 0})
            </TabsTrigger>

            <TabsTrigger 
              value="in_progress" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              In Progress
            </TabsTrigger>

            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0 p-6">
            <MaintenanceRequestsList userType="landlord" />
          </TabsContent>

          <TabsContent value="pending" className="mt-0 p-6">
            <div className="space-y-4">
              {summary.pending_count > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {summary.pending_count} request{summary.pending_count > 1 ? 's' : ''} need{summary.pending_count === 1 ? 's' : ''} your attention
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Review and respond to pending maintenance requests below
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <MaintenanceRequestsList userType="landlord" statusFilter="pending" />
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-0 p-6">
            <MaintenanceRequestsList userType="landlord" statusFilter="in_progress" />
          </TabsContent>

          <TabsContent value="completed" className="mt-0 p-6">
            <MaintenanceRequestsList userType="landlord" statusFilter="completed" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}