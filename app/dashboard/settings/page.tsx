'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuperUserPreferences } from '@/app/components/settings/SuperUserPreferences';
import { useAuth } from '@/app/context/AuthContext';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { user } = useAuth();
  const isSystemAdmin = user?.userType === 'system_admin';

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isSystemAdmin && <TabsTrigger value="admin">Admin Preferences</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Account Settings</h2>
            <p className="text-muted-foreground">
              Update your account information and manage your profile.
            </p>
            
            {/* Account settings form would go here */}
            <div className="p-8 text-center border rounded-md bg-muted/10">
              <p className="text-muted-foreground">Account settings coming soon.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Appearance</h2>
            <p className="text-muted-foreground">
              Customize the appearance of the application.
            </p>
            
            {/* Appearance settings would go here */}
            <div className="p-8 text-center border rounded-md bg-muted/10">
              <p className="text-muted-foreground">Appearance settings coming soon.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
            <p className="text-muted-foreground">
              Control how and when you receive notifications.
            </p>
            
            {/* Notification settings would go here */}
            <div className="p-8 text-center border rounded-md bg-muted/10">
              <p className="text-muted-foreground">Notification settings coming soon.</p>
            </div>
          </div>
        </TabsContent>
        
        {isSystemAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Administrator Preferences</h2>
              <p className="text-muted-foreground">
                Special settings available only to system administrators.
              </p>
              
              <SuperUserPreferences />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 