// components/landlord/properties/TenantDetailsDialog.jsx
"use client";

import { useState } from "react";
import { 
  User, 
  Phone, 
  Calendar, 
  Home, 
  DollarSign, 
  MessageSquare, 
  UserX, 
  Edit3,
  Save,
  X,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { useTenantManagement } from "@/hooks/landlord/useTenantAssignment";
import TenantVacationDialog from "./TenantVacationDialog";

export default function TenantDetailsDialog({ tenant, isOpen, onClose, onTenantUpdated, onTenantVacated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [editedTenant, setEditedTenant] = useState({});
  const [noteText, setNoteText] = useState("");
  const [reminderText, setReminderText] = useState("");

  const { 
    loading, 
    error, 
    sendTenantReminder, 
    addTenantNote 
  } = useTenantManagement();

  // Initialize edited tenant data when dialog opens
  useState(() => {
    if (tenant) {
      setEditedTenant({
        full_name: tenant.full_name || '',
        phone_number: tenant.phone_number || '',
        alternative_phone: tenant.alternative_phone || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        emergency_contact_relationship: tenant.emergency_contact_relationship || ''
      });
    }
  }, [tenant]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset changes when canceling edit
      setEditedTenant({
        full_name: tenant.full_name || '',
        phone_number: tenant.phone_number || '',
        alternative_phone: tenant.alternative_phone || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        emergency_contact_relationship: tenant.emergency_contact_relationship || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    try {
      // Here you would call your update tenant API
      // const updated = await TenantService.updateTenant(tenant.id, editedTenant);
      onTenantUpdated?.(editedTenant);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating tenant:", error);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderText.trim()) return;
    
    try {
      await sendTenantReminder(tenant.id, {
        message: reminderText,
        type: 'payment_reminder'
      });
      setReminderText("");
      // Show success message
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    try {
      await addTenantNote(tenant.id, {
        note: noteText,
        type: 'general'
      });
      setNoteText("");
      // Show success message
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleVacationSuccess = () => {
    setShowVacationDialog(false);
    onTenantVacated?.(tenant);
    onClose();
  };

  if (!tenant) return null;

  // Mock payment history data - replace with actual data
  const paymentHistory = [
    {
      id: 1,
      date: '2024-01-01',
      amount: 500000,
      status: 'paid',
      method: 'M-Pesa'
    },
    {
      id: 2,
      date: '2024-02-01',
      amount: 500000,
      status: 'paid',
      method: 'Bank Transfer'
    },
    {
      id: 3,
      date: '2024-03-01',
      amount: 500000,
      status: 'pending',
      method: ''
    }
  ];

  const paymentColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString()
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => `TSh ${row.original.amount.toLocaleString()}`
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            status === 'paid' ? 'bg-green-100 text-green-800' :
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
            {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      header: 'Method',
      accessorKey: 'method',
      cell: ({ row }) => row.original.method || '-'
    }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Tenant Details - {tenant.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tenant Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <CloudflareCard>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Personal Information</h3>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSaveChanges}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleEditToggle}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={handleEditToggle}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.full_name}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm font-medium">{tenant.full_name}</p>
                      )}
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.phone_number}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, phone_number: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{tenant.phone_number}</p>
                      )}
                    </div>

                    <div>
                      <Label>Alternative Phone</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.alternative_phone}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, alternative_phone: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{tenant.alternative_phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <Label>Date of Birth</Label>
                      <p className="mt-1 text-sm">{tenant.dob || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CloudflareCard>

              {/* Emergency Contact */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.emergency_contact_name}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{tenant.emergency_contact_name || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <Label>Contact Phone</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.emergency_contact_phone}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{tenant.emergency_contact_phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Relationship</Label>
                      {isEditing ? (
                        <Input
                          value={editedTenant.emergency_contact_relationship}
                          onChange={(e) => setEditedTenant(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{tenant.emergency_contact_relationship || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CloudflareCard>

              {/* Tenancy Information */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Tenancy Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label>Unit</Label>
                        <p className="text-sm font-medium">{tenant.unit?.unit_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <Label>Move-in Date</Label>
                        <p className="text-sm">{tenant.start_date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label>Monthly Rent</Label>
                        <p className="text-sm font-medium">TSh {parseFloat(tenant.rent_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      <div>
                        <Label>Deposit Paid</Label>
                        <p className="text-sm">TSh {parseFloat(tenant.deposit_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <Label>Payment Frequency</Label>
                      <p className="text-sm capitalize">{tenant.payment_frequency || 'Monthly'}</p>
                    </div>

                    <div>
                      <Label>Payment Day</Label>
                      <p className="text-sm">{tenant.payment_day || 1} of each period</p>
                    </div>
                  </div>
                </div>
              </CloudflareCard>

              {/* Payment History */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Payment History</h3>
                  <CloudflareTable
                    data={paymentHistory}
                    columns={paymentColumns}
                    pageSize={5}
                  />
                </div>
              </CloudflareCard>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setShowVacationDialog(true)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Vacate Tenant
                    </Button>
                  </div>
                </div>
              </CloudflareCard>

              {/* Send Reminder */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Send Reminder</h3>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Enter reminder message..."
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                      rows={3}
                    />
                    <Button
                      className="w-full"
                      onClick={handleSendReminder}
                      disabled={!reminderText.trim() || loading}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send SMS Reminder
                    </Button>
                  </div>
                </div>
              </CloudflareCard>

              {/* Add Note */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Add Note</h3>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Enter note about tenant..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                    />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || loading}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </CloudflareCard>

              {/* Current Status */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Current Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rent Status:</span>
                      <span className="font-medium text-green-600">Up to Date</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next Payment:</span>
                      <span className="font-medium">March 1, 2024</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Occupancy:</span>
                      <span className="font-medium">{tenant.allowed_occupants || 1} person(s)</span>
                    </div>
                  </div>
                </div>
              </CloudflareCard>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vacation Dialog */}
      {showVacationDialog && (
        <TenantVacationDialog
          tenant={tenant}
          isOpen={showVacationDialog}
          onClose={() => setShowVacationDialog(false)}
          onSuccess={handleVacationSuccess}
        />
      )}
    </>
  );
}