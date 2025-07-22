// app/(dashboard)/profile/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  User, 
  Camera, 
  Edit3, 
  Lock, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  Save,
  X,
  Eye,
  EyeOff,
  Upload,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { CloudflareBreadcrumbs } from "@/components/cloudflare/Breadcrumbs";
import { useProfileStore } from "@/stores/useProfileStore";
import customToast from "@/components/ui/custom-toast";

export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    email: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const {
    loading,
    error,
    user,
    profilePicture,
    isEditingProfile,
    isChangingPassword,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    removeProfilePicture,
    toggleEditProfile,
    togglePasswordChange,
    getUserInitials,
    getUserTypeDisplay,
    getFormattedUserData,
    initializeProfile,
    clearError
  } = useProfileStore();

  useEffect(() => {
    initializeProfile();
  }, [initializeProfile]);

  useEffect(() => {
    if (user && isEditingProfile) {
      setEditForm({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        email: user.email || ''
      });
    }
  }, [user, isEditingProfile]);

  const handleEditSubmit = async () => {
    const result = await updateProfile(editForm);
    
    if (result.success) {
      customToast.success("Profile Updated", {
        description: "Your profile has been updated successfully"
      });
    } else {
      customToast.error("Update Failed", {
        description: result.message
      });
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      customToast.error("Password Mismatch", {
        description: "New passwords do not match"
      });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      customToast.error("Password Too Short", {
        description: "Password must be at least 6 characters long"
      });
      return;
    }

    const result = await changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    });

    if (result.success) {
      customToast.success("Password Changed", {
        description: "Your password has been changed successfully"
      });
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordDialog(false);
    } else {
      customToast.error("Password Change Failed", {
        description: result.message
      });
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      customToast.error("File Too Large", {
        description: "Please select an image smaller than 5MB"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      customToast.error("Invalid File Type", {
        description: "Please select an image file"
      });
      return;
    }

    const result = await uploadProfilePicture(file);
    
    if (result.success) {
      customToast.success("Profile Picture Updated", {
        description: "Your profile picture has been updated"
      });
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/landlord" },
    { label: "Profile Settings" }
  ];

  const formattedUser = getFormattedUserData();

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <CloudflareCard>
          <CloudflareCardContent className="p-6">
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-xl font-bold text-blue-600">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900">{formattedUser?.full_name}</h2>
              <Badge className="mt-2">
                {getUserTypeDisplay()}
              </Badge>

              {profilePicture && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeProfilePicture}
                  className="mt-3 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <CloudflareCard>
            <CloudflareCardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditProfile}
                  disabled={loading}
                >
                  {isEditingProfile ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CloudflareCardHeader>
            <CloudflareCardContent>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleEditSubmit}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{formattedUser?.full_name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{formattedUser?.phone_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium">{formattedUser?.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formattedUser?.joinedDate}</p>
                    </div>
                  </div>
                </div>
              )}
            </CloudflareCardContent>
          </CloudflareCard>

          {/* Security Settings */}
          <CloudflareCard>
            <CloudflareCardHeader>
              <h3 className="text-lg font-semibold">Security Settings</h3>
            </CloudflareCardHeader>
            <CloudflareCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-gray-500">Change your account password</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-500">Your account is active and verified</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="old_password">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="old_password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, old_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}