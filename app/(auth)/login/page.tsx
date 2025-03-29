// app/(auth)/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, useTheme, useMediaQuery, Paper, Button } from '@mui/material';
import LoginForm from '@/app/components/auth/login-form';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorMode } from '@/app/components/theme/ThemeProvider';

/**
 * Login page component
 * Serves as the entry point for user authentication
 */
export default function LoginPage() {
  const theme = useTheme();
  const colorMode = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentYear, setCurrentYear] = useState<number>(2023);
  
  // Update currentYear after component mounts to avoid hydration issues
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        position: 'relative',
      }}
    >
      {/* Theme toggle button */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Button
          onClick={colorMode.toggleColorMode}
          variant="outlined"
          color="primary"
          startIcon={theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          size="small"
        >
          {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode
        </Button>
      </Box>
      
      {/* Left side - Login form */}
      <Box
        sx={{
          flex: '1 1 100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box 
            sx={{ 
              mb: 6, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: 180, 
                height: 60, 
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                mb: 2
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                WapangajiKiganjani
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              align="center" 
              sx={{ 
                mt: 2,
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>
          
          <LoginForm />
          
          <Typography 
            variant="body2" 
            color="textSecondary" 
            align="center" 
            sx={{ mt: 8 }}
          >
            &copy; {currentYear} WapangajiKiganjani. All rights reserved.
          </Typography>
        </Container>
      </Box>
      
      {/* Right side - Decorative image (hidden on mobile) */}
      {!isMobile && (
        <Box
          sx={{
            flex: '1 1 100%',
            position: 'relative',
            overflow: 'hidden',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Paper
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 30, 60, 0.9)' : 'rgba(25, 118, 210, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 6,
            }}
          >
            <Box sx={{ 
              maxWidth: 500, 
              mx: 'auto', 
              textAlign: 'center', 
              color: '#fff' 
            }}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Property Management Simplified
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                Administer your property management system with ease and efficiency
              </Typography>
              
              <Box sx={{ 
                mt: 6, 
                p: 4, 
                borderRadius: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}>
                <Typography variant="h5" gutterBottom fontWeight="medium">
                  System Features
                </Typography>
                <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
                  <Typography component="li" variant="body1" sx={{ mt: 1 }}>
                    Complete property oversight
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mt: 1 }}>
                    Tenant management and verification
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mt: 1 }}>
                    Payment tracking and reconciliation
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mt: 1 }}>
                    System-wide data quality control
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}