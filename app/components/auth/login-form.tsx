// components/auth/LoginForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useTheme,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputBase
} from '@mui/material';
import { Visibility, VisibilityOff, Phone, Lock, ConstructionOutlined } from '@mui/icons-material';
import { authService } from '@/services/auth';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Construction dialog state
  const [showConstructionDialog, setShowConstructionDialog] = useState(false);
  
  // Phone number validation
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Check for previously saved remember me preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('rememberMe') === 'true';
      setRememberMe(remembered);
      
      // If remembered, try to get the saved phone number
      if (remembered) {
        const savedPhone = localStorage.getItem('rememberedPhone');
        if (savedPhone) {
          setPhoneNumber(savedPhone);
        }
      }
    }
  }, []);
  
  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for Tanzanian phone numbers
    const phoneRegex = /^(\+?255|0)[67]\d{8}$/;
    const isValid = phoneRegex.test(phone);
    
    if (!isValid) {
      setPhoneError('Please enter a valid phone number');
    } else {
      setPhoneError(null);
    }
    
    return isValid;
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  // Handle construction dialog close
  const handleConstructionDialogClose = () => {
    setShowConstructionDialog(false);
    setIsLoading(false);
  };

  // Form submission handler
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Reset previous error states
    setError(null);
    setSuccessMessage(null);
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save remember me preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('rememberMe', rememberMe.toString());
        if (rememberMe) {
          localStorage.setItem('rememberedPhone', phoneNumber);
        } else {
          localStorage.removeItem('rememberedPhone');
        }
      }
      
      // Use the auth service to login
      const response = await authService.login({
        phone_number: phoneNumber,
        password: password
      });
      
      // Set access token in localStorage for API interceptors
      localStorage.setItem('token', response.tokens.access);
      localStorage.setItem('refreshToken', response.tokens.refresh);
      
      // Set cookies for Next.js middleware authentication
      setCookie('token', response.tokens.access, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      setCookie('userType', response.user.user_type, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Store user data in localStorage for client-side access
      localStorage.setItem('userData', JSON.stringify({
        id: response.user.id,
        fullName: response.user.full_name,
        phoneNumber: response.user.phone_number,
        userType: response.user.user_type,
        isStaff: response.user.is_staff,
        isSuperuser: response.user.is_superuser
      }));
      
      // Check user type and redirect accordingly
      const userType = response.user.user_type;
      const isSuperUser = userType === 'system_admin';
      
      setSuccessMessage('Login successful! Redirecting...');
      setShowSnackbar(true);
      
      // For superusers, check if they have a preferred landing page
      if (isSuperUser) {
        const preferredLandingPage = localStorage.getItem('preferredLandingPage');
        if (preferredLandingPage) {
          setCookie('preferredLandingPage', preferredLandingPage, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }
      }
      
      // Determine redirect path based on user type
      let redirectPath = '/dashboard'; // Default for system_admin
      
      if (isSuperUser) {
        // System admin - use preferred page or default to admin dashboard
        const preferredLandingPage = localStorage.getItem('preferredLandingPage');
        if (preferredLandingPage) {
          redirectPath = preferredLandingPage;
        } else {
          redirectPath = '/dashboard';
        }
      } else if (userType === 'landlord') {
        // Landlord goes to client dashboard
        redirectPath = '/client/dashboard';
      } else if (userType === 'tenant') {
        // Tenant goes to tenant dashboard
        redirectPath = '/tenant/dashboard';
      } else if (userType === 'manager') {
        // Manager goes to manager dashboard
        redirectPath = '/manager/dashboard';
      } else {
        // Use construction dialog for unknown user types
        setShowConstructionDialog(true);
        return;
      }
      
      // Get the callback URL if it exists
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');
      
      // Redirect after a short delay
      setTimeout(() => {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push(redirectPath);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle error - since AuthError is just a type, we check for properties instead
      if (error && typeof error === 'object' && 'message' in error) {
        setError(error.message as string);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setShowSnackbar(true);
    } finally {
      if (!showConstructionDialog) {
        setIsLoading(false);
      }
    }
  }

  return (
    <Paper 
      elevation={3} 
      sx={{
        p: 4,
        maxWidth: 400,
        width: '100%',
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h5" component="h1" align="center" gutterBottom fontWeight="bold">
        Admin Login
      </Typography>
      
      <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
        Enter your credentials to access the admin dashboard
      </Typography>
      
      <Box component="form" onSubmit={handleLogin} noValidate>
        <TextField
          required
          fullWidth
          id="phone"
          label="Phone Number"
          name="phone"
          autoComplete="tel"
          autoFocus
          value={phoneNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
          error={!!phoneError}
          helperText={phoneError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone color="action" />
              </InputAdornment>
            ),
          } as React.ComponentProps<typeof InputBase>}
          sx={{ mb: 2, mt: 2 }}
        />
        
        <TextField
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          } as React.ComponentProps<typeof InputBase>}
          sx={{ mb: 2, mt: 2 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
          label="Remember me"
          sx={{ mb: 2 }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            mt: 2,
            mb: 2,
            py: 1.5,
            fontWeight: 'bold',
            borderRadius: 1.5,
            position: 'relative',
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
        
        <Typography variant="body2" color="textSecondary" align="center">
          If you&apos;re having trouble logging in, please contact the system administrator.
        </Typography>
      </Box>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {React.createElement(
          Alert,
          {
            onClose: handleSnackbarClose,
            severity: error ? "error" : "success",
            sx: { width: '100%' },
            variant: "filled",
            slotProps: {
              root: {
                elevation: 6
              }
            }
          },
          error || successMessage  // This is passed as children
        )}
      </Snackbar>
      
      {/* Construction Dialog for non-admin users */}
      <Dialog
        open={showConstructionDialog}
        onClose={handleConstructionDialogClose}
        aria-labelledby="construction-dialog-title"
        aria-describedby="construction-dialog-description"
      >
        <DialogTitle id="construction-dialog-title" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          color: theme.palette.warning.main
        }}>
          <ConstructionOutlined color="warning" />
          Site Under Construction
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="construction-dialog-description">
            Thank you for logging in. The tenant portal is currently under construction and will be available soon. 
            Only administrators can access the system at this time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConstructionDialogClose} color="primary" autoFocus>
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};