"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomSidebar } from "@/components/custom-sidebar";
import AuthService from "@/services/auth";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton (hidden on mobile) */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card p-4">
        <div className="h-14 flex items-center mb-6 pl-2 gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 mb-3 pl-2" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 mb-3 pl-2" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <div className="mt-auto pt-4 border-t">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>

      {/* Main Content Skeleton (based on admin properties layout) */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:px-12 md:pt-10 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start pt-2">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-xl p-6 bg-card">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>

          {/* Tabs & Table Area */}
          <div className="border rounded-xl bg-card overflow-hidden mt-6">
            <div className="flex border-b p-2 bg-muted/30 gap-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
            <div className="p-6">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSetupRoute = pathname?.includes('/setup') || pathname?.includes('/welcome');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const userData = await AuthService.getCurrentUser();
        if (!userData) {
          router.push('/login');
          return;
        }

        setUser(userData);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  if (isSetupRoute) {
    return (
      <div className="min-h-screen bg-background dark:bg-background">
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <CustomSidebar role={user.user_type === 'landlord' ? 'landlord' : 'admin'} user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:px-12 md:pt-10 ">
          {children}
        </div>
      </main>
    </div>
  );
}