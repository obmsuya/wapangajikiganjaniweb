'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { authService } from '@/services/auth';

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthed = authService.isAuthenticated();
        
        if (isAuthed) {
          // Check if user is admin or superuser
          const isAdminUser = await authService.isAdmin();
          const isSysAdmin = await authService.isSystemAdmin();
          
          if (isAdminUser || isSysAdmin) {
            setAuthenticated(true);
          } else {
            // Redirect non-admin users
            router.push('/auth/login');
          }
        } else {
          // Redirect unauthenticated users
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: theme.palette.background.default,
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // If not authenticated, don't render anything (redirection happens in useEffect)
  if (!authenticated) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}