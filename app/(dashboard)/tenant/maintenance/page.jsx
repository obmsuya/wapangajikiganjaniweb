"use client";

import { useState, useEffect } from "react";
import { Wrench, Plus, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudflareBreadcrumbs, CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import MaintenanceRequestForm from "@/components/tenant/MaintenanceRequestForm";
import MaintenanceRequestsList from "@/components/shared/MaintenanceRequestsList";
import TenantPaymentService from "@/services/tenant/payment";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";
import customToast from "@/components/ui/custom-toast";

export default function TenantMaintenancePage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [occupancies, setOccupancies] = useState([]);
  const [selectedOccupancy, setSelectedOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { refreshData } = useMaintenanceRequestStore();

  useEffect(() => {
    const fetchOccupancies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await TenantPaymentService.getCurrentOccupancy();
        
        if (response.success && response.occupancies) {
          setOccupancies(response.occupancies);
          if (response.occupancies.length > 0) {
            setSelectedOccupancy(response.occupancies[0]);
          }
        } else {
          setOccupancies([]);
        }
      } catch (err) {
        setError("Failed to load your property information");
        customToast.error("Loading Error", {
          description: "Failed to load your property information"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancies();
  }, []);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/tenant" },
    { label: "Maintenance" }
  ];

  const pageActions = selectedOccupancy && (
    <Button 
      onClick={() => setActiveTab("submit")} 
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      New Request
    </Button>
  );

  const handleRequestSuccess = () => {
    setActiveTab("requests");
    refreshData();
    customToast.success("Request Submitted", {
      description: "Your maintenance request has been sent to your landlord"
    });
  };

  const handleOccupancyChange = (unitId) => {
    const newOccupancy = occupancies.find(occ => occ.unit_id === parseInt(unitId));
    if (newOccupancy) {
      setSelectedOccupancy(newOccupancy);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <CloudflareBreadcrumbs items={breadcrumbItems} />
        <CloudflarePageHeader
          title="Maintenance Requests"
          description="Submit and track maintenance requests for your unit"
        />
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your property information...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !selectedOccupancy) {
    return (
      <div className="space-y-8">
        <CloudflareBreadcrumbs items={breadcrumbItems} />
        <CloudflarePageHeader
          title="Maintenance Requests"
          description="Submit and track maintenance requests for your unit"
        />
        <Card>
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Unit Found</h3>
            <p className="text-gray-600">
              You need an active rental unit to submit maintenance requests. 
              Please contact your landlord if this seems incorrect.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Maintenance Requests"
        description={`Submit and track maintenance requests for ${selectedOccupancy.unit_name}`}
        actions={pageActions}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{selectedOccupancy.property_name}</h3>
              <p className="text-sm text-gray-600">
                {selectedOccupancy.unit_name} • Floor {selectedOccupancy.floor_number}
              </p>
            </div>
          </div>
          {occupancies.length > 1 && (
            <select
              value={selectedOccupancy.unit_id}
              onChange={(e) => handleOccupancyChange(e.target.value)}
              className="text-sm border rounded-md px-3 py-2"
            >
              {occupancies.map((occ) => (
                <option key={occ.unit_id} value={occ.unit_id}>
                  {occ.unit_name} - {occ.property_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      <Card className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 rounded-t-lg rounded-b-none border-b border-gray-200 dark:border-gray-700 p-0">
            <TabsTrigger 
              value="submit" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Request
            </TabsTrigger>
            
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 rounded-b-none data-[state=active]:border-b-0 data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 py-3 px-5"
            >
              <Wrench className="h-4 w-4 mr-2" />
              My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-0 p-6">
            <MaintenanceRequestForm 
              occupancy={selectedOccupancy}
              onSuccess={handleRequestSuccess}
            />
          </TabsContent>

          <TabsContent value="requests" className="mt-0 p-6">
            <MaintenanceRequestsList userType="tenant" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}