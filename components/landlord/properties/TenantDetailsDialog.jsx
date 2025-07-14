// components/landlord/properties/TenantDetailsDialog.jsx - FIXED
"use client";

import { useState, useEffect } from "react";
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
import { useTenantManagement } from "@/hooks/landlord/useTenantManagement";
import TenantVacationDialog from "./TenantVacationDialog";
import customToast from "@/components/ui/custom-toast";

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
    addTenantNote,
    updateTenant
  } = useTenantManagement();

  // Initialize edited tenant data when dialog opens
  useEffect(() => {
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
      await updateTenant(tenant.id, editedTenant);
      setIsEditing(false);
      customToast.success("Tenant Updated", {
        description: "Tenant information has been updated successfully"
      });
      onTenantUpdated?.();
    } catch (err) {
      console.error('Error updating tenant:', err);
      customToast.error("Update Failed", {
        description: err.message || "Failed to update tenant information"
      });
    }
  };

  const handleSendReminder = async () => {
    if (!reminderText.trim()) {
      customToast.error("Message Required", {
        description: "Please enter a message to send"
      });
      return;
    }

    try {
      await sendTenantReminder(tenant.id, { message: reminderText });
      setReminderText("");
      customToast.success("Reminder Sent", {
        description: "Reminder message has been sent to the tenant"
      });
    } catch (err) {
      console.error('Error sending reminder:', err);
      customToast.error("Send Failed", {
        description: err.message || "Failed to send reminder"
      });
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      customToast.error("Note Required", {
        description: "Please enter a note to add"
      });
      return;
    }

    try {
      await addTenantNote(tenant.id, { note: noteText });
      setNoteText("");
      customToast.success("Note Added", {
        description: "Note has been added to tenant record"
      });
    } catch (err) {
      console.error('Error adding note:', err);
      customToast.error("Add Note Failed", {
        description: err.message || "Failed to add note"
      });
    }
  };

  const handleVacationSuccess = () => {
    setShowVacationDialog(false);
    onTenantVacated?.();
  };





  if (!tenant) return null;

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
                          <Button size="sm" onClick={handleSaveChanges} disabled={loading}>
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

                    <div className="md:col-span-2">
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
                        <p className="mt-1 text-sm">{tenant.emergency_contact_relationship || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CloudflareCard>

              {/* Unit Information */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Unit Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Unit:</span>
                      <span className="ml-2 font-medium">{tenant.unit?.unit_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Floor:</span>
                      <span className="ml-2">{tenant.unit?.floor_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly Rent:</span>
                      <span className="ml-2 font-medium">TSh {parseFloat(tenant.rent_amount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Move-in Date:</span>
                      <span className="ml-2">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CloudflareCard>


            </div>

            {/* Right Column - Actions & Status */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <CloudflareCard>
                <div className="p-4">
                  <h3 className="font-medium mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
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
                      size="sm"
                      onClick={handleSendReminder}
                      disabled={loading || !reminderText.trim()}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Reminder
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
                      placeholder="Enter note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddNote}
                      disabled={loading || !noteText.trim()}
                      className="w-full"
                    >
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
              <p className="text-red-600 text-sm">{error}</p>
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