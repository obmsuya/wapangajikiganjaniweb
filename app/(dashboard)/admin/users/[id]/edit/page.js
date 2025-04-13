// app/(dashboard)/admin/users/[id]/edit/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CloudflarePageHeader } from '@/components/cloudflare/PageHeader';
import { useUserDetails } from '@/hooks/useAdminData';
import { toast } from "sonner";

export default function EditUserPage({ params }) {
  const userId = params.id;
  const router = useRouter();
  // Remove the useToast hook usage
  const { user, loading, error, updateUser } = useUserDetails(userId);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    user_type: 'landlord',
    is_active: true,
    is_staff: false
  });
  
  const [saving, setSaving] = useState(false);

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        email: user.email || '',
        user_type: user.user_type || 'landlord',
        is_active: user.is_active || false,
        is_staff: user.is_staff || false
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateUser(formData);
      toast.success("User updated", {
        description: "The user information has been successfully updated."
      });
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      toast.error("Update failed", {
        description: error.message || "Failed to update user information."
      });
    } finally {
      setSaving(false);
    }
  };

  // Breadcrumb items for this page
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: user?.full_name || 'User Details', href: `/admin/users/${userId}` },
    { label: 'Edit' }
  ];

  // Action buttons for the page header
  const pageActions = (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2"
      onClick={() => router.push(`/admin/users/${userId}`)}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to User
    </Button>
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="Edit User"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="Edit User"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
              <h3 className="text-lg font-medium">Error loading user details</h3>
              <p>{error.message || 'Something went wrong'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      {/* Page header with breadcrumbs */}
      <CloudflarePageHeader
        title="Edit User"
        description={`Update information for ${user?.full_name || 'user'}`}
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the user's personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_type">User Type</Label>
                  <Select
                    value={formData.user_type}
                    onValueChange={(value) => handleSelectChange('user_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="system_admin">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Configure account status and privileges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Account</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Users with inactive accounts cannot log in
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_staff">Staff Privileges</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Staff can access administrative features
                  </p>
                </div>
                <Switch
                  id="is_staff"
                  checked={formData.is_staff}
                  onCheckedChange={(checked) => handleSwitchChange('is_staff', checked)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Form Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/users/${userId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}