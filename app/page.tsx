// app/page.tsx
'use client';

import { CircularProgress } from "@mui/material";
import { Box } from "@mui/material";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/auth'; // Make sure this import matches your actual file

export default function RootPage() {
  const router = useRouter();
  const [, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const isUserAuthenticated = isAuthenticated();
        
        if (isUserAuthenticated) {
          // Check user role/type to determine where to redirect
          // This is a placeholder - replace with your actual role checking logic
          const userIsAdmin = localStorage.getItem('user_role') === 'admin';
          
          if (userIsAdmin) {
            // Admin users go to dashboard
            router.push('/dashboard');
          } else {
            // Regular users/clients go to client portal
            router.push('/client');
          }
        } else {
          // Not authenticated - redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error during authentication check:', error);
        // On error, safely redirect to login
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);

  // Return a loading state while redirecting
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <CircularProgress />
    </Box>
  );
}