'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  AppProvider, 
  DashboardLayout as ToolpadDashboardLayout,
} from '@toolpad/core';
import { 
  Dashboard, 
  BarChart, 
  Payment, 
  HomeWork, 
  People, 
  Person, 
  Settings,
  Notifications,
  Logout,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { 
  Badge, 
  Box, 
  IconButton, 
  Tooltip, 
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Typography
} from '@mui/material';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { authService } from '@/services/auth';

// Define a proper type for the menu props to avoid using 'any'
type ExtendedMenuProps = {
  PaperProps: {
    elevation: number;
    sx: {
      overflow: string;
      filter: string;
      mt: number;
      width: number;
      '& .MuiMenuItem-root'?: {
        px: number;
        py: number;
        borderRadius?: number;
        my?: number;
      };
      '&:before'?: {
        content: string;
        display: string;
        position: string;
        top: number;
        right: number;
        width: number;
        height: number;
        bgcolor: string;
        transform: string;
        zIndex: number;
      };
    };
  };
  transformOrigin: { 
    horizontal: 'left' | 'center' | 'right'; 
    vertical: 'top' | 'center' | 'bottom' 
  };
  anchorOrigin: { 
    horizontal: 'left' | 'center' | 'right'; 
    vertical: 'top' | 'center' | 'bottom' 
  };
};

// Custom toolbar actions component with notifications
const ToolbarActions = () => {
  const [notificationsAnchor, setNotificationsAnchor] = React.useState<null | HTMLElement>(null);
  const { mode, toggleColorMode } = useColorMode();
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const isNotificationsOpen = Boolean(notificationsAnchor);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Notifications">
          <IconButton 
            color="inherit"
            onClick={handleNotificationsOpen}
            size="large"
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* Custom theme toggle button */}
        <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={isNotificationsOpen}
        onClose={handleNotificationsClose}
        {...{
          PaperProps: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              width: 320,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5,
                borderRadius: 1,
                my: 0.5,
              },
            }
          },
          transformOrigin: { horizontal: 'right', vertical: 'top' },
          anchorOrigin: { horizontal: 'right', vertical: 'bottom' }
        } as ExtendedMenuProps}
      >
        <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 600 }}>
          Notifications
        </Typography>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              New property added
            </Typography>
            <Typography variant="caption" color="text.secondary">
              2 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Maintenance issue reported
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 hour ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Payment received
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3 hours ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

// Custom app title component
const CustomAppTitle = () => {
  return (
    <Typography
      variant="h6"
      component="div"
      sx={{
        fontWeight: 600,
        fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      }}
    >
      Wapangaji Kiganjani
    </Typography>
  );
};

// Define the navigation structure
const NAVIGATION = [
  { 
    segment: 'dashboard', 
    title: 'Dashboard', 
    icon: <Dashboard />,
    pattern: 'dashboard'
  },
  { 
    segment: 'analytics', 
    title: 'Analytics', 
    icon: <BarChart />,
    pattern: 'dashboard/analytics{/:segment}*'
  },
  { 
    segment: 'payments', 
    title: 'Payments', 
    icon: <Payment />,
    pattern: 'dashboard/payments{/:segment}*'
  },
  { 
    segment: 'properties', 
    title: 'Properties', 
    icon: <HomeWork />,
    pattern: 'dashboard/properties{/:segment}*'
  },
  { 
    segment: 'tenants', 
    title: 'Tenants', 
    icon: <People />,
    pattern: 'dashboard/tenants{/:segment}*'
  },
  { 
    segment: 'users', 
    title: 'Users', 
    icon: <Person />,
    pattern: 'dashboard/users{/:segment}*'
  },
  { 
    segment: 'settings', 
    title: 'Settings', 
    icon: <Settings />,
    pattern: 'dashboard/settings{/:segment}*'
  },
];

// Define branding
const BRANDING = {
  title: 'Wapangaji Admin',
  homeUrl: '/dashboard',
};

// Custom account menu component
const AccountMenu = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { mode, toggleColorMode } = useColorMode();
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  const handleProfile = () => {
    router.push('/dashboard/users/profile');
    handleMenuClose();
  };

  const handleSettings = () => {
    router.push('/dashboard/settings');
    handleMenuClose();
  };
  
  const handleThemeToggle = () => {
    toggleColorMode();
    handleMenuClose();
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          onClick={handleProfileMenuOpen}
          size="large"
          edge="end"
          color="inherit"
          sx={{ ml: 1 }}
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            A
          </Avatar>
        </IconButton>
      </Tooltip>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        {...{
          PaperProps: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              width: 200,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            }
          },
          transformOrigin: { horizontal: 'right', vertical: 'top' },
          anchorOrigin: { horizontal: 'right', vertical: 'bottom' }
        } as ExtendedMenuProps}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </ListItemIcon>
          {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  
  // Create a router object compatible with Toolpad
  const toolpadRouter = {
    pathname: pathname || '/',
    navigate: (url: string | URL) => router.push(url.toString()),
    searchParams: new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
  };

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={toolpadRouter}
      theme={theme}
      branding={BRANDING}
      window={typeof window !== 'undefined' ? window : undefined}
    >
      <ToolpadDashboardLayout
        slots={{
          appTitle: CustomAppTitle,
          toolbarActions: ToolbarActions,
          toolbarAccount: AccountMenu,
        }}
        defaultSidebarCollapsed={false}
        sx={{
          '& .MuiToolpadDashboardLayout-content': {
            padding: 3,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          {children}
        </Box>
      </ToolpadDashboardLayout>
    </AppProvider>
  );
} 