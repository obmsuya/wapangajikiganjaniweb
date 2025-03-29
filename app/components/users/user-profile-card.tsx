'use client';

import { useState, useEffect } from 'react';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { UserData } from '@/services/auth';
import { 
  User, 
  Phone, 
  Calendar, 
  Check, 
  X, 
  Shield, 
  UserCog,
  KeyRound,
  LogIn,
  LogOut,
  Globe,
  RefreshCw
} from 'lucide-react';

interface UserProfileCardProps {
  user?: UserData;
  isLoading?: boolean;
  onStatusChange?: (userId: string, isActive: boolean) => Promise<void>;
  onPasswordReset?: (userId: string, newPassword: string) => Promise<boolean>;
}

export function UserProfileCard({
  user,
  isLoading = false,
  onStatusChange,
  onPasswordReset
}: UserProfileCardProps) {
  const { mode } = useColorMode();
  const [statusLoading, setStatusLoading] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

    // Sync dark mode with document for Tailwind
    useEffect(() => {
        if (mode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [mode]);

  // Sample user data if none provided
  const userData = user || {
    id: '123456',
    phone_number: '+255712345678',
    full_name: 'John Doe',
    language: 'en',
    is_superuser: false,
    user_type: 'regular',
    is_active: true,
    is_staff: false,
    date_joined: '2023-08-15T10:30:00Z',
    last_login: '2023-11-20T08:45:30Z',
  };

  // Format date utility
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle user status change
  const handleStatusChange = async (newStatus: boolean) => {
    if (!user?.id || !onStatusChange) return;
    
    try {
      setStatusLoading(true);
      await onStatusChange(user.id, newStatus);
    } catch (error) {
      console.error('Failed to update user status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!user?.id || !onPasswordReset) return;
    
    try {
      setResetLoading(true);
      await onPasswordReset(user.id, newPassword);
      setShowResetSuccess(true);
      // Close the dialog after success
      setTimeout(() => {
        setPasswordResetOpen(false);
        setNewPassword('');
        setShowResetSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setResetLoading(false);
    }
  };

  // Generate a random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const length = 12;
    let password = '';
    
    // Ensure at least one of each type
    password += chars.substr(0, 26).charAt(Math.floor(Math.random() * 26)); // Uppercase
    password += chars.substr(26, 26).charAt(Math.floor(Math.random() * 26)); // Lowercase
    password += chars.substr(52, 10).charAt(Math.floor(Math.random() * 10)); // Number
    password += chars.substr(62).charAt(Math.floor(Math.random() * (chars.length - 62))); // Symbol
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
  };

  // Get user type badge
  const getUserTypeBadge = () => {
    if (userData.is_superuser) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary font-medium flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" /> Admin
        </Badge>
      );
    } else if (userData.is_staff) {
      return (
        <Badge className="bg-secondary/10 text-secondary border-secondary font-medium flex items-center gap-1">
          <UserCog className="h-3.5 w-3.5" /> Staff
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="font-medium flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> Regular User
        </Badge>
      );
    }
  };

  // Data items for user profile
  const userDataItems = [
    { 
      icon: <Phone className="h-4 w-4" />, 
      label: 'Phone', 
      value: userData.phone_number 
    },
    { 
      icon: <Globe className="h-4 w-4" />, 
      label: 'Language', 
      value: userData.language === 'en' ? 'English' : 'Swahili' 
    },
    { 
      icon: <Calendar className="h-4 w-4" />, 
      label: 'Joined', 
      value: formatDate(userData.date_joined) 
    },
    { 
      icon: <LogIn className="h-4 w-4" />, 
      label: 'Last Login', 
      value: formatDate(userData.last_login) 
    },
    { 
      icon: <LogOut className="h-4 w-4" />, 
      label: 'Last Logout', 
      value: formatDate(userData.last_login ? userData.last_login : null) // Using last_login temporarily
    }
  ];

  return (
    <Card className="border-2">
      <CardHeader className="relative">
        <div className="absolute top-4 right-4">
          {getUserTypeBadge()}
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{userData.full_name}</CardTitle>
          <CardDescription className="text-base">{userData.phone_number}</CardDescription>
          <Badge 
            variant={userData.is_active ? "default" : "destructive"}
            className="mt-3 h-6 font-medium"
          >
            {userData.is_active ? (
              <><Check className="h-3.5 w-3.5 mr-1" /> Active</>
            ) : (
              <><X className="h-3.5 w-3.5 mr-1" /> Inactive</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userDataItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="text-muted-foreground">{item.icon}</div>
              <div className="w-24 text-muted-foreground text-sm">{item.label}</div>
              <div className="flex-1 text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <div className="w-full flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="user-status" className="text-sm font-medium">
              User Status
            </Label>
            <Switch 
              id="user-status" 
              checked={userData.is_active}
              disabled={isLoading || statusLoading || !onStatusChange}
              onCheckedChange={handleStatusChange}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {userData.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Refresh User Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will fetch the latest user data from the server. Any unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="w-full">
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset User Password</DialogTitle>
                <DialogDescription>
                  This will reset the users password. They will need to use the new password for their next login.
                </DialogDescription>
              </DialogHeader>
              
              {showResetSuccess ? (
                <div className="flex flex-col items-center py-4">
                  <div className="rounded-full bg-success/20 p-3 mb-3">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-center font-medium">Password reset successful!</p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    The new password has been set for {userData.full_name}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="new-password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          type="text"
                          placeholder="Enter new password"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generateRandomPassword}
                        >
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters and include numbers and special characters.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordResetOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={!newPassword || newPassword.length < 8 || resetLoading}
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}