"use client";

import { useState, useEffect } from "react";
import { Wrench, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, Droplets, Zap, Wind, Home, Shield, Sparkles, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { CloudflareTable } from "@/components/cloudflare/Table";
import MaintenanceResponseForm from "@/components/landlord/MaintenanceResponseForm";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";
import customToast from "@/components/ui/custom-toast";

const CATEGORY_ICONS = {
  plumbing: Droplets,
  electrical: Zap,
  appliances: Home,
  hvac: Wind,
  structural: Home,
  security: Shield,
  cleaning: Sparkles,
  other: MoreHorizontal
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: AlertTriangle,
  completed: CheckCircle,
  rejected: XCircle
};

export default function MaintenanceRequestsList({ userType = 'tenant', statusFilter = 'all' }) {
  const { 
    requests, 
    loading, 
    error, 
    filters, 
    updateFilters, 
    fetchMaintenanceRequests, 
    refreshData, 
    getFilteredRequests,
    getMaintenancePriorityColor,
    getMaintenanceStatusColor,
    formatMaintenanceDate
  } = useMaintenanceRequestStore();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    fetchMaintenanceRequests(statusFilter);
  }, [statusFilter, userType, fetchMaintenanceRequests]);

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setShowResponseForm(true);
  };

  const handleResponseSuccess = () => {
    refreshData(statusFilter);
    setShowResponseForm(false);
    setSelectedRequest(null);
  };

  const filteredRequests = getFilteredRequests();

  const getColumns = () => {
    const baseColumns = [
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (row) => {
          const IconComponent = CATEGORY_ICONS[row.category] || MoreHorizontal;
          return (
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-gray-500" />
              <span className="capitalize">{row.category}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'title',
        header: 'Request',
        cell: (row) => (
          <div>
            <div className="font-medium">{row.title}</div>
            <div className="text-sm text-gray-500 line-clamp-1">{row.message}</div>
          </div>
        )
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (row) => (
          <Badge className={getMaintenancePriorityColor(row.priority)}>
            {row.priority}
          </Badge>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (row) => {
          const StatusIcon = STATUS_ICONS[row.status] || Clock;
          return (
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <Badge className={getMaintenanceStatusColor(row.status)}>
                {row.status.replace('_', ' ')}
              </Badge>
            </div>
          );
        }
      },
      {
        accessorKey: 'created_at',
        header: 'Submitted',
        cell: (row) => (
          <div className="text-sm">
            {formatMaintenanceDate(row.created_at)}
          </div>
        )
      }
    ];

    if (userType === 'landlord') {
      baseColumns.splice(1, 0, {
        accessorKey: 'property_info',
        header: 'Property & Tenant',
        cell: (row) => (
          <div>
            <div className="font-medium">{row.property_info?.unit_name}</div>
            <div className="text-sm text-gray-500">{row.tenant?.name}</div>
          </div>
        )
      });
    }

    baseColumns.push({
      accessorKey: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          {userType === 'landlord' && row.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleRespond(row)}
              className="text-blue-600 hover:text-blue-700"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    });

    return baseColumns;
  };

  if (loading && requests.length === 0) {
    return (
      <CloudflareCard>
        <CloudflareCardContent className="p-8">
          <div className="flex justify-center items-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading maintenance requests...</span>
          </div>
        </CloudflareCardContent>
      </CloudflareCard>
    );
  }

  if (error) {
    return (
      <CloudflareCard>
        <CloudflareCardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-300 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Requests</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => refreshData(statusFilter)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CloudflareCardContent>
      </CloudflareCard>
    );
  }

  return (
    <>
      <CloudflareCard>
        <CloudflareCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {userType === 'landlord' ? 'Maintenance Requests' : 'My Maintenance Requests'}
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            

          </div>
        </CloudflareCardHeader>

        <CloudflareCardContent>
          <CloudflareTable
            data={filteredRequests}
            columns={getColumns()}
            emptyMessage={
              requests.length === 0 
                ? "No maintenance requests found" 
                : "No requests match your current filters"
            }
            pagination={true}
            initialRowsPerPage={10}
            searchable={true}
            selectable={false}
          />
        </CloudflareCardContent>
      </CloudflareCard>

      {userType === 'landlord' && (
        <MaintenanceResponseForm
          maintenanceRequest={selectedRequest}
          isOpen={showResponseForm}
          onClose={() => {
            setShowResponseForm(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleResponseSuccess}
        />
      )}
    </>
  );
}