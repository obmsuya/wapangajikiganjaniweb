"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from "@/components/cloudflare/Breadcrumbs";
import MaintenanceRequestsList from "@/components/shared/MaintenanceRequestsList";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";

function MaintenanceSummaryCards({ summary }) {
  const summaryCards = [
    {
      title: "Total Requests",
      value: summary?.total_requests || 0,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending",
      value: summary?.pending_count || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "In Progress",
      value: summary?.in_progress_count || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed",
      value: summary.completed_count || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Urgent",
      value: summary.urgent_count || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:mt-8">
      {summaryCards.map((card, index) => (
        <Card className="rounded-2xl" key={index}>
          <CardContent>
            <div className="flex items-start space-x-2">
              <div className={`p-1 ${card.bgColor} rounded-3xl`}>
                <card.icon className={`scale-75 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
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
    { label: "Dashboard", href: "/landlord/properties/" },
    { label: "Maintenance" },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs text-gray-600">
        {summary?.total_requests || 0} Total Requests
      </Badge>
      {summary.pending_count > 0 && (
        <Badge className="bg-yellow-100 text-yellow-800">
          {summary.pending_count} Pending
        </Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-md:pb-16">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Maintenance Management"
        description="Review and respond to tenant maintenance requests"
        actions={pageActions}
      />

      <MaintenanceSummaryCards summary={summary} />

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              <Wrench className="h-4 w-4" />
              <span className="max-lg:hidden">All Requests</span>
            </TabsTrigger>

            <TabsTrigger
              value="pending"
            >
              <Clock className="h-4 w-4" />
              <span className="max-lg:hidden">Pending ({summary.pending_count || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="in_progress"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="max-lg:hidden">In Progress ({summary.in_progress_count || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="completed"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="max-lg:hidden">Completed ({summary.completed_count || 0})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-2">
            <MaintenanceRequestsList userType="landlord" />
          </TabsContent>

          <TabsContent value="pending" className="mt-2">
            <div className="space-y-4">
              {summary.pending_count > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {summary.pending_count} request
                        {summary.pending_count > 1 ? "s" : ""} need
                        {summary.pending_count === 1 ? "s" : ""} your attention
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Review and respond to pending maintenance requests below
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <MaintenanceRequestsList
                userType="landlord"
                statusFilter="pending"
              />
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-2">
            <MaintenanceRequestsList
              userType="landlord"
              statusFilter="in_progress"
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-2">
            <MaintenanceRequestsList
              userType="landlord"
              statusFilter="completed"
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
