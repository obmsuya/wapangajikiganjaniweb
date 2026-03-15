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
      case 'active': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'former': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border border-blue-200';
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-600 mb-4 text-sm sm:text-base">Failed to load tenants: {error}</p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Tenants</h3>
            <Badge  className="mt-1 bg-slate-200 text-slate-700 text-xs">
              {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        <Button
          onClick={refreshTenants}
          disabled={loading}
          variant="outline"
          className="w-full sm:w-fit"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      {/* Search */}
      {tenants.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
        <div className="text-center py-12 px-4">
          <div className="mb-4 flex justify-center">
            <Users className="w-16 h-16 text-slate-300" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm ? 'No tenants found' : 'No tenants yet'}
          </h4>
          <p className="text-slate-600 text-sm">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add tenants to start managing your property'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTenants.map((tenant) => (
            <CloudflareCard key={tenant.id} className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Header with Name and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                      {tenant.name}
                    </h4>
                  </div>
                  <Badge className={`${getStatusColor(tenant.status)} whitespace-nowrap text-xs bg-transparent`}>
                    {tenant.status === 'active' ? 'Active' : 'Former'}
                  </Badge>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-600">Phone:</span>
                      <span className="font-medium text-slate-900 truncate">{tenant.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Home className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-600">Unit:</span>
                      <span className="font-medium text-slate-900 truncate">
                        {tenant.unit_name} • {tenant.floor_name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-600">Rent:</span>
                      <span className="font-medium text-slate-900 truncate">
                        {formatCurrency(tenant.rent_amount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-slate-600">Moved in:</span>
                      <span className="font-medium text-slate-900">{formatDate(tenant.move_in_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-slate-600">Frequency:</span>
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded font-medium text-xs">
                      {getPaymentFrequencyLabel(tenant.payment_frequency)}
                    </span>
                  </div>
                  
                  {tenant.next_payment_date && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-slate-600">Next payment:</span>
                      <span className="font-medium text-slate-900">{formatDate(tenant.next_payment_date)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={() => handleSendReminder(tenant.id, tenant.name)}
                    disabled={actionLoading}
                    className="flex-1 text-xs sm:text-sm"
                    variant="outline"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Send Reminder</span>
                    <span className="sm:hidden">Reminder</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleVacateTenant(tenant.id, tenant.name)}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-600 bg-red-100"
                  >
                    <UserX className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Remove</span>
                    <span className="sm:hidden">Remove</span>
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
