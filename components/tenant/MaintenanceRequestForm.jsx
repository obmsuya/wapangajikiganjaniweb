"use client";

import { useState } from "react";
import { Wrench, Send, AlertCircle, Zap, Droplets, Wind, Home, Shield, Sparkles, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";
import customToast from "@/components/ui/custom-toast";

const MAINTENANCE_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-600' },
  { value: 'electrical', label: 'Electrical', icon: Zap, color: 'text-yellow-600' },
  { value: 'appliances', label: 'Appliances', icon: Home, color: 'text-purple-600' },
  { value: 'hvac', label: 'HVAC', icon: Wind, color: 'text-green-600' },
  { value: 'structural', label: 'Structural', icon: Home, color: 'text-gray-600' },
  { value: 'security', label: 'Security', icon: Shield, color: 'text-red-600' },
  { value: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-pink-600' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function MaintenanceRequestForm({ occupancy, onSuccess }) {
  const { submitMaintenanceRequest, loading } = useMaintenanceRequestStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      customToast.error("Missing Information", {
        description: "Please fill in all required fields"
      });
      return;
    }

    const result = await submitMaintenanceRequest({
      unit_id: occupancy.unit_id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority
    });

    if (result.success) {
      customToast.success("Request Submitted", {
        description: "Your maintenance request has been sent to your landlord"
      });
      
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium'
      });
      
      if (onSuccess) onSuccess(result);
    } else {
      customToast.error("Submission Failed", {
        description: result.error || "Failed to submit maintenance request"
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCategory = MAINTENANCE_CATEGORIES.find(cat => cat.value === formData.category);
  const selectedPriority = PRIORITY_LEVELS.find(pri => pri.value === formData.priority);

  return (
    <CloudflareCard>
      <CloudflareCardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wrench className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Submit Maintenance Request</h3>
            <p className="text-sm text-gray-600">
              Report issues for {occupancy.unit_name} in {occupancy.property_name}
            </p>
          </div>
        </div>
      </CloudflareCardHeader>
      
      <CloudflareCardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">{formData.title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select maintenance category">
                  {selectedCategory && (
                    <div className="flex items-center gap-2">
                      <selectedCategory.icon className={`h-4 w-4 ${selectedCategory.color}`} />
                      <span>{selectedCategory.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue>
                  {selectedPriority && (
                    <div className="flex items-center gap-2">
                      <Badge className={selectedPriority.color}>
                        {selectedPriority.label}
                      </Badge>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <Badge className={priority.color}>
                      {priority.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about the issue, including when it started, how often it occurs, and any other relevant details..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500">{formData.description.length}/1000 characters</p>
          </div>

          {formData.priority === 'urgent' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Urgent Request</h4>
                  <p className="text-sm text-red-700">
                    Urgent requests are for safety issues or problems that could cause damage if not addressed immediately. 
                    Your landlord will be notified via SMS.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-600">
              Your landlord will be notified immediately
            </p>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.description.trim() || !formData.category}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CloudflareCardContent>
    </CloudflareCard>
  );
}