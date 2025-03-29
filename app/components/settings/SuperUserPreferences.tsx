'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardDescription,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { setCookie } from 'cookies-next';
import { useAuth } from '@/app/context/AuthContext';

const landingPageOptions = [
  { value: '/dashboard', label: 'Admin Dashboard' },
  { value: '/client/dashboard', label: 'Landlord Dashboard' },
  { value: '/tenant/dashboard', label: 'Tenant Dashboard' },
  { value: '/manager/dashboard', label: 'Manager Dashboard' },
  { value: '/dashboard/properties', label: 'Properties Management' },
  { value: '/dashboard/users', label: 'User Management' },
  { value: '/dashboard/payments', label: 'Payments Management' },
];

export function SuperUserPreferences() {
  const { user } = useAuth();
  const [preferredLandingPage, setPreferredLandingPage] = useState<string>('/dashboard');
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is a system admin
  const isSystemAdmin = user?.userType === 'system_admin';
  
  useEffect(() => {
    // Load saved preference from localStorage
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('preferredLandingPage');
      if (savedPreference) {
        setPreferredLandingPage(savedPreference);
      }
    }
  }, []);

  const handleSavePreference = () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('preferredLandingPage', preferredLandingPage);
      
      // Save to cookie for middleware
      setCookie('preferredLandingPage', preferredLandingPage, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      toast.success('Preferences saved successfully', {
        description: 'Your preferred landing page has been updated.'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences', {
        description: 'An error occurred while saving your preferences.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Only render for system admins
  if (!isSystemAdmin) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin Navigation Preferences</CardTitle>
        <CardDescription>
          Configure your default landing page after login. As a system administrator, 
          you have access to all sections of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="preferredLandingPage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Preferred Landing Page
          </label>
          <Select
            value={preferredLandingPage}
            onValueChange={setPreferredLandingPage}
          >
            <SelectTrigger id="preferredLandingPage" className="w-full">
              <SelectValue placeholder="Select landing page" />
            </SelectTrigger>
            <SelectContent>
              {landingPageOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This is the page you will be redirected to after login.
          </p>
        </div>
        
        <Button 
          onClick={handleSavePreference} 
          disabled={isSaving}
          className="mt-4"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
        
        <div className="text-xs text-muted-foreground mt-4">
          <p>
            <strong>Note:</strong> As a system administrator, you can access all 
            sections of the application regardless of this setting. This preference 
            only affects where you land after logging in.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 