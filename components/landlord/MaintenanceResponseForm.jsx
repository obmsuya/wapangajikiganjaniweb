"use client";

import { useState } from "react";
import { MessageSquare, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";
import customToast from "@/components/ui/custom-toast";

const STATUS_OPTIONS = [
  { 
    value: 'in_progress', 
    label: 'In Progress', 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800',
    description: 'Work is being done to resolve this issue'
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800',
    description: 'Issue has been resolved'
  },
  { 
    value: 'rejected', 
    label: 'Cannot Complete', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800',
    description: 'Unable to complete this request'
  }
];

export default function MaintenanceResponseForm({ maintenanceRequest, isOpen, onClose, onSuccess }) {
  const { respondToMaintenanceRequest, loading } = useMaintenanceRequestStore();
  const [formData, setFormData] = useState({
    response: '',
    status: 'in_progress',
    estimated_completion: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.response.trim()) {
      customToast.error("Missing Response", {
        description: "Please provide a response message"
      });
      return;
    }

    const result = await respondToMaintenanceRequest(maintenanceRequest.id, {
      response: formData.response.trim(),
      status: formData.status,
      estimated_completion: formData.estimated_completion
    });

    if (result.success) {
      customToast.success("Response Sent", {
        description: "Your response has been sent to the tenant"
      });
      
      setFormData({
        response: '',
        status: 'in_progress',
        estimated_completion: ''
      });
      
      if (onSuccess) onSuccess(result);
      onClose();
    } else {
      customToast.error("Response Failed", {
        description: result.error || "Failed to send response"
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedStatus = STATUS_OPTIONS.find(status => status.value === formData.status);

  if (!maintenanceRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            Respond to Maintenance Request
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{maintenanceRequest.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                From: {maintenanceRequest.tenant?.name} • {maintenanceRequest.property_info?.unit_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={
                maintenanceRequest.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                maintenanceRequest.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                maintenanceRequest.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {maintenanceRequest.priority} priority
              </Badge>
              <Badge className="bg-gray-100 text-gray-800">
                {maintenanceRequest.category}
              </Badge>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <p className="text-sm text-gray-700">{maintenanceRequest.message}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="status">Update Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue>
                  {selectedStatus && (
                    <div className="flex items-center gap-2">
                      <selectedStatus.icon className="h-4 w-4" />
                      <span>{selectedStatus.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <status.icon className="h-4 w-4" />
                      <div>
                        <div>{status.label}</div>
                        <div className="text-xs text-gray-500">{status.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">Response Message *</Label>
            <Textarea
              id="response"
              placeholder="Provide an update to the tenant about this maintenance request..."
              value={formData.response}
              onChange={(e) => handleInputChange('response', e.target.value)}
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500">{formData.response.length}/500 characters</p>
          </div>

          {formData.status === 'in_progress' && (
            <div className="space-y-2">
              <Label htmlFor="estimated_completion">Estimated Completion (Optional)</Label>
              <Input
                id="estimated_completion"
                placeholder="e.g., Tomorrow afternoon, Within 2 days, Next week..."
                value={formData.estimated_completion}
                onChange={(e) => handleInputChange('estimated_completion', e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                Provide a rough timeframe to help the tenant know when to expect completion
              </p>
            </div>
          )}

          {selectedStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <selectedStatus.icon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Status: {selectedStatus.label}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedStatus.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.response.trim()}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}