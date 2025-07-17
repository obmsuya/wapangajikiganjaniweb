"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomSidebar } from "@/components/custom-sidebar";
import AuthService from "@/services/auth";

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null;

  if (isSetupRoute) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden">
      <CustomSidebar role={user.user_type === 'landlord' ? 'landlord' : 'admin'} user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}