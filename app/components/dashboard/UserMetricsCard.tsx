'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Skeleton, 
  Grid, 
  Stack,
  useTheme,
  LinearProgress,
  Tooltip,
  Avatar,
  IconButton,
  Chip,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha } from '@mui/material/styles';

// Define the interface for user metrics data
interface UserMetrics {
  total_users: number;
  active_users: number;
  inactive_users: number;
}

interface DashboardData {
  user_metrics: UserMetrics;
  recent_users: Array<{
    id: string | number;
    full_name: string;
    phone_number: string;
    date_joined: string;
  }>;
  system_status: {
    status: string;
    last_checked: string;
  };
}

// Define proper types for the status
type StatusColor = 'success' | 'primary' | 'warning' | 'error';
interface ActiveRateStatus {
  color: StatusColor;
  text: string;
  icon: React.ReactNode | null;
}

/**
 * UserMetricsCard Component
 * 
 * Displays key user metrics in a visually engaging card layout for the admin dashboard
 * Shows total users, active users, and inactive users with interactive visual indicators
 * Fetches data directly from the backend API
 */
export default function UserMetricsCard() {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const API_URL = 'http://localhost:8000/api/v1/auth/admin/dashboard/';

  const fetchUserMetrics = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Fetch data from the API
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Failed to fetch user metrics';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
          console.error('Error fetching user metrics:', e);
        }
        
        throw new Error(`${errorMessage} (${response.status})`);
      }

      // Parse successful response
      const data: DashboardData = await response.json();
      
      // Set user metrics
      setUserMetrics(data.user_metrics);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount and when retry count changes
  useEffect(() => {
    fetchUserMetrics();
  }, [retryCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRetryCount(prev => prev + 1);
  };

  // Calculate active user percentage for progress bar
  const activePercentage = userMetrics && userMetrics.total_users > 0
    ? Math.round((userMetrics.active_users / userMetrics.total_users) * 100)
    : 0;

  // Update the getActiveRateStatus function with proper typing
  const getActiveRateStatus = (): ActiveRateStatus => {
    if (activePercentage >= 75) return { color: 'success', text: 'Excellent', icon: <TrendingUpIcon /> };
    if (activePercentage >= 50) return { color: 'primary', text: 'Good', icon: <TrendingUpIcon /> };
    if (activePercentage >= 25) return { color: 'warning', text: 'Average', icon: null };
    return { color: 'error', text: 'Poor', icon: <TrendingDownIcon /> };
  };

  const activeRateStatus = getActiveRateStatus();

  // Component for status chip with proper type handling
  const StatusChip = ({ status }: { status: ActiveRateStatus }) => {
    return (
      <Chip 
        label={status.text} 
        color={status.color}
        size="small"
        icon={status.icon as React.ReactElement || undefined}
      />
    );
  };

  return (
    <Card 
      sx={{ 
        mb: 3,
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'light' 
            ? '0 10px 20px rgba(0,0,0,0.1)'
            : '0 10px 20px rgba(0,0,0,0.3)',
        },
      }}
    >
      {/* Card Header with Title and Refresh Button */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40
            }}
          >
            <PeopleAltIcon />
          </Avatar>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
            }}
          >
            User Metrics
          </Typography>
        </Stack>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            sx={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: 1 }} />
            <Grid container spacing={2}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={4} key={item}>
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 1 }} />
          </Stack>
        ) : error ? (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center', 
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.error.main, 0.1)
                : alpha(theme.palette.error.main, 0.2),
              borderRadius: 2
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            {/* User Count Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Total Users Card */}
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    height: '100%',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      right: -20, 
                      top: -20, 
                      opacity: 0.2,
                      transform: 'rotate(15deg)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 120 }} />
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="overline">
                      TOTAL USERS
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      {userMetrics?.total_users.toLocaleString()}
                    </Typography>
                    <Tooltip title="All registered users in the system">
                      <Chip 
                        label="System Total" 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          width: 'fit-content'
                        }} 
                      />
                    </Tooltip>
                  </Stack>
                </Box>
              </Grid>

              {/* Active Users Card */}
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    height: '100%',
                    bgcolor: theme.palette.success.main,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      right: -20, 
                      top: -20, 
                      opacity: 0.2,
                      transform: 'rotate(15deg)'
                    }}
                  >
                    <VerifiedUserIcon sx={{ fontSize: 120 }} />
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="overline">
                      ACTIVE USERS
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      {userMetrics?.active_users.toLocaleString()}
                    </Typography>
                    <Tooltip title="Users with active accounts">
                      <Chip 
                        label={`${activePercentage}% of total`} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          width: 'fit-content'
                        }} 
                      />
                    </Tooltip>
                  </Stack>
                </Box>
              </Grid>

              {/* Inactive Users Card */}
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    height: '100%',
                    bgcolor: theme.palette.error.main,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      right: -20, 
                      top: -20, 
                      opacity: 0.2,
                      transform: 'rotate(15deg)'
                    }}
                  >
                    <BlockIcon sx={{ fontSize: 120 }} />
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="overline">
                      INACTIVE USERS
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      {userMetrics?.inactive_users.toLocaleString()}
                    </Typography>
                    <Tooltip title="Users with deactivated accounts">
                      <Chip 
                        label={`${100 - activePercentage}% of total`} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          width: 'fit-content'
                        }} 
                      />
                    </Tooltip>
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            {/* Active Rate Progress Section */}
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.02)' 
                  : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">
                  Active User Rate
                </Typography>
                <StatusChip status={activeRateStatus} />
              </Stack>
              
              <LinearProgress 
                variant="determinate" 
                value={activePercentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  mb: 1,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: `linear-gradient(90deg, 
                      ${theme.palette.error.main} 0%, 
                      ${theme.palette.warning.main} 50%, 
                      ${theme.palette.success.main} 100%)`
                  }
                }}
              />
              
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                sx={{ 
                  mt: 0.5,
                  px: 1
                }}
              >
                <Typography variant="caption" color="text.secondary">0%</Typography>
                <Typography variant="caption" color="text.secondary">50%</Typography>
                <Typography variant="caption" color="text.secondary">100%</Typography>
              </Stack>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
