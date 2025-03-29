'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Grid, useTheme, CircularProgress } from '@mui/material';
// import { useRouter } from 'next/navigation';
import PropertyKPICard from '@/app/components/dashboard/PropertyKPICard';

// This would normally be imported from your dashboard components folder
import KPISummaryCards from '@/app/components/dashboard/KPISummaryCards';
// import { isAuthenticated } from '@/services/auth';

export default function DashboardPage() {
  const theme = useTheme();
  // const router = useRouter();
  const [loading] = useState(false);
  
  // Check authentication on component mount
  useEffect(() => {
    // const checkAuth = async () => {
    //   try {
    //     const authed = isAuthenticated();
        
    //     if (!authed) {  
    //       const currentPath = window.location.pathname;
    //       if (!currentPath.includes('/auth/login')) {
    //         router.push('/auth/login');
    //       }
    //     } else {
    //       setLoading(false);
    //     }
    //   } catch (error) {
    //     console.error('Authentication check failed:', error);
    //     router.push('/auth/login');
    //   }
    // };
    // checkAuth();
  }, []);
  
  // Show loading state while checking authentication
  if (loading) {
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
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 700,
          fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
        }}
      >
        Admin Dashboard
      </Typography>

      {/* If you have KPISummaryCards already implemented */}
      <Box sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        <KPISummaryCards />
      </Box>

      {/* Property Overview Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            fontWeight: 600,
            fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
          }}
        >
          Property Overview
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'light' 
              ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
              : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <PropertyKPICard />
        </Paper>
      </Box>

      {/* Dashboard Grid Layout for Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'light'
                ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
                : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
              }}
            >
              Revenue Analytics
            </Typography>
            
            {/* This would be a chart component in a real implementation */}
            <Box 
              sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                color: 'text.secondary'
              }}
            >
              Revenue Chart (Coming Soon)
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'light'
                ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
                : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
              }}
            >
              Payment Methods
            </Typography>
            
            {/* This would be a chart component in a real implementation */}
            <Box 
              sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                color: 'text.secondary'
              }}
            >
              Payment Methods Chart (Coming Soon)
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* More sections for tenant and maintenance overview could go here */}
    </Container>
  );
}