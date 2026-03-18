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
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  LogOut,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CloudflareBreadcrumbs } from "@/components/cloudflare/Breadcrumbs";
import { useProfileStore } from "@/stores/useProfileStore";
import customToast from "@/components/ui/custom-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AuthService from "@/services/auth";
import { useRouter } from "next/navigation";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

function PasswordInput({ id, label, value, onChange, show, onToggle }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="mt-0.5 p-1.5 rounded-md bg-muted shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">
          {value || (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const {
    loading,
    error,
    user,
    profilePicture,
    isEditingProfile,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    removeProfilePicture,
    toggleEditProfile,
    getUserInitials,
    getUserTypeDisplay,
    getFormattedUserData,
    initializeProfile,
    clearError,
  } = useProfileStore();

  useEffect(() => {
    initializeProfile();
  }, [initializeProfile]);

  useEffect(() => {
    if (user && isEditingProfile) {
      setEditForm({
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        email: user.email || "",
      });
    }
  }, [user, isEditingProfile]);

  const handleEditSubmit = async () => {
    const result = await updateProfile(editForm);
    if (result.success) {
      customToast.success("Profile Updated", {
        description: "Your profile has been updated successfully",
      });
    } else {
      customToast.error("Update Failed", { description: result.message });
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      customToast.error("Password Mismatch", {
        description: "New passwords do not match",
      });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      customToast.error("Password Too Short", {
        description: "Password must be at least 6 characters long",
      });
      return;
    }
    const result = await changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    });
    if (result.success) {
      customToast.success("Password Changed", {
        description: "Your password has been changed successfully",
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordDialog(false);
    } else {
      customToast.error("Password Change Failed", {
        description: result.message,
      });
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await AuthService.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      customToast.error("File Too Large", {
        description: "Please select an image smaller than 5MB",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      customToast.error("Invalid File Type", {
        description: "Please select an image file",
      });
      return;
    }
    const result = await uploadProfilePicture(file);
    if (result.success) {
      customToast.success("Profile Picture Updated", {
        description: "Your profile picture has been updated",
      });
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/landlord" },
    { label: "Profile Settings" },
  ];

  const formattedUser = getFormattedUserData();

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center max-sm:pb-16">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div {...fadeUp}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    Something went wrong
                  </p>
                  <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-destructive/60 hover:text-destructive"
                  onClick={clearError}
                >
                  <X className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: avatar card ── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative group">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="size-24 rounded-full object-cover ring-4 ring-background shadow-md"
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-primary/10 ring-4 ring-background shadow-md flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {getUserInitials()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    aria-label="Upload profile picture"
                  >
                    <Camera className="size-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <p className="font-semibold text-foreground leading-tight">
                    {formattedUser?.full_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formattedUser?.email}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {getUserTypeDisplay()}
                  </Badge>
                </div>

                {profilePicture && (
                  <Button
                    variant="ghost"
                    onClick={removeProfilePicture}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs h-8"
                  >
                    <Trash2 className="size-3.5" />
                    Remove photo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account status card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                  <CheckCircle2 className="size-4 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Account Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verified & in good standing
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto shrink-0 text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 text-xs"
                >
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                  <Info className="size-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Danger zone
                  </p>
                  <p className="text-xs text-muted-foreground">
                    logout or delete your account permanently
                  </p>
                </div>
              </div>
              <br />
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="gap-2"
              >
                <LogOut />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: info + security ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="p-0">
              {/* Card header row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground max-sm:text-sm">
                    Personal Information
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Your basic account details
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleEditProfile}
                  disabled={loading}
                  className="gap-1.5 h-8 text-xs w-fit"
                >
                  {isEditingProfile ? (
                    <>
                      <X className="size-3.5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="size-3.5" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {isEditingProfile ? (
                    <motion.div key="edit" {...fadeUp} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="full_name" className="text-sm">
                            Full Name
                          </Label>
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                full_name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone_number" className="text-sm">
                            Phone Number
                          </Label>
                          <Input
                            id="phone_number"
                            value={editForm.phone_number}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                phone_number: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        onClick={handleEditSubmit}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Save className="size-3.5" />
                        {loading ? "Saving…" : "Save Changes"}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="view" {...fadeUp}>
                      <InfoRow
                        icon={User}
                        label="Full Name"
                        value={formattedUser?.full_name}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Phone Number"
                        value={formattedUser?.phone_number}
                      />
                      <InfoRow
                        icon={Mail}
                        label="Email Address"
                        value={formattedUser?.email}
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Member Since"
                        value={formattedUser?.joinedDate}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border">
                <p className="font-semibold text-foreground max-sm:text-sm">
                  Security
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Manage your login credentials
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted shrink-0">
                      <Lock className="size-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Password</p>
                      <p className="text-xs text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                    className="shrink-0 w-fit"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Password Dialog ── */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Lock className="size-4 text-muted-foreground" />
              Change Password
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PasswordInput
              id="old_password"
              label="Current Password"
              value={passwordForm.old_password}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, old_password: e.target.value }))
              }
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((v) => !v)}
            />
            <PasswordInput
              id="new_password"
              label="New Password"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm((p) => ({ ...p, new_password: e.target.value }))
              }
              show={showNewPassword}
              onToggle={() => setShowNewPassword((v) => !v)}
            />
            <PasswordInput
              id="confirm_password"
              label="Confirm New Password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  confirm_password: e.target.value,
                }))
              }
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />

            {/* Strength hint */}
            {passwordForm.new_password.length > 0 && (
              <p
                className={cn(
                  "text-xs",
                  passwordForm.new_password.length < 6
                    ? "text-destructive"
                    : "text-green-600 dark:text-green-400",
                )}
              >
                {passwordForm.new_password.length < 6
                  ? "Password must be at least 6 characters"
                  : "Password length looks good ✓"}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={loading}
              className="gap-2"
            >
              <Save className="size-3.5" />
              {loading ? "Changing…" : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
