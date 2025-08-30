// components/landlord/properties/tabs/PropertyTenantsTab.jsx 
"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Phone, 
  Home, 
  Calendar, 
  DollarSign,
  MessageSquare,
  UserX,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { usePropertyTenants } from "@/hooks/landlord/useTenantAssignment";
import { useTenantManagement } from "@/hooks/landlord/useTenantAssignment";
import TenantAssignmentDialog from "../TenantAssignmentDialog";
import customToast from "@/components/ui/custom-toast";


export default function PropertyTenantsTab({ property }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const { tenants, loading, error, refreshTenants } = usePropertyTenants(property);
  const { sendReminder, vacateTenant, loading: actionLoading } = useTenantManagement();

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm)
  );

  const handleSendReminder = async (tenantId, tenantName) => {
    try {
      await sendReminder(tenantId);
      customToast.success("Reminder Sent", {
        description: `Payment reminder sent to ${tenantName}`
      });
    } catch (error) {
      customToast.error("Failed to Send Reminder", {
        description: "Please try again"
      });
    }
  };

  const handleVacateTenant = async (tenantId, tenantName) => {
    if (!confirm(`Are you sure you want to remove ${tenantName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await vacateTenant(tenantId);
      customToast.success("Tenant Removed", {
        description: `${tenantName} has been successfully removed`
      });
      refreshTenants();
    } catch (error) {
      customToast.error("Failed to Remove Tenant", {
        description: "Please try again"
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'former': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPaymentFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Every 3 Months';
      case 'annual': return 'Yearly';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Current Tenants</h3>
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load tenants: {error}</p>
        <Button onClick={refreshTenants} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Current Tenants</h3>
          <Badge variant="secondary" className="ml-2">
            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <Button
          onClick={refreshTenants}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      {tenants.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, unit, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Tenants List */}
      {filteredTenants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No tenants found' : 'No tenants yet'}
          </h4>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add tenants to start managing your property'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowAssignDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Tenant
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTenants.map((tenant) => (
            <CloudflareCard key={tenant.id} className="p-6">
              <div className="flex items-start justify-between">
                {/* Tenant Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {tenant.name}
                    </h4>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status === 'active' ? 'Active' : 'Former'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact & Unit Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{tenant.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Unit:</span>
                        <span className="font-medium">
                          {tenant.unit_name} • {tenant.floor_name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Payment Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Rent:</span>
                        <span className="font-medium">
                          {formatCurrency(tenant.rent_amount)} • {getPaymentFrequencyLabel(tenant.payment_frequency)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Moved in:</span>
                        <span className="font-medium">{formatDate(tenant.move_in_date)}</span>
                      </div>
                      
                      {tenant.next_payment_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Next payment:</span>
                          <span className="font-medium">{formatDate(tenant.next_payment_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => handleSendReminder(tenant.id, tenant.name)}
                    disabled={actionLoading}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Send Reminder
                  </Button>
                  
                  <Button
                    onClick={() => handleVacateTenant(tenant.id, tenant.name)}
                    disabled={actionLoading}
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserX className="w-3 h-3 mr-1" />
                    Remove Tenant
                  </Button>
                </div>
              </div>
            </CloudflareCard>
          ))}
        </div>
      )}

      {/* Assignment Dialog */}
      <TenantAssignmentDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        unit={selectedUnit}
        onSuccess={() => {
          refreshTenants();
          setSelectedUnit(null);
        }}
      />
    </div>
  );
}