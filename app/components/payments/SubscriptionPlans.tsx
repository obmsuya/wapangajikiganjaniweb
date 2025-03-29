'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  SelectChangeEvent,
  Snackbar,
  OutlinedInputProps
} from '@mui/material';
import { Alert } from '@/components/ui/alert';  
import MuiAlert from '@mui/material/Alert';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  CreditCard as CreditCardIcon,
  Autorenew as AutoRenewIcon
} from '@mui/icons-material';
import PaymentService, { 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionReport 
} from '@/services/payment';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Animated card component
const AnimatedCard = motion(Card);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

// Custom TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Replace the AlertWithChildren component with properly typed version
interface AlertProps {
  elevation?: number;
  variant?: 'standard' | 'filled' | 'outlined';
  onClose?: () => void;
  severity?: 'success' | 'info' | 'warning' | 'error';
  sx?: React.CSSProperties;
  children?: React.ReactNode;
}

const AlertWithChildren: React.FC<AlertProps> = (props) => (
  <MuiAlert {...props}>
    {props.children}
  </MuiAlert>
);

// Replace the SwitchWithProps component with properly typed version
interface SwitchProps {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
  disabled?: boolean;
  size?: 'small' | 'medium';
  edge?: 'start' | 'end' | false;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const SwitchWithProps: React.FC<SwitchProps> = (props) => (
  <Switch {...props} />
);

/**
 * SubscriptionPlans Component
 * Displays subscription plans and active subscriptions
 */
export default function SubscriptionPlans() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [report, setReport] = useState<SubscriptionReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editPlan, setEditPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmAction: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    confirmAction: () => {}
  });
  
  // Snackbar notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch subscription plans and active subscriptions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch subscription plans
        const plansData = await PaymentService.getSubscriptionPlans();
        setPlans(plansData || []);
        
        // Fetch user subscriptions
        const subscriptionsData = await PaymentService.getUserSubscriptions();
        setSubscriptions(subscriptionsData?.results || []);
        
        // Fetch subscription report
        const reportData = await PaymentService.getSubscriptionReport();
        setReport(reportData || null);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data. Please try again later.');
        // Set default empty arrays to prevent undefined errors
        setPlans([]);
        setSubscriptions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchData();
  }, [refreshing]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
  };

  // Handle dialog open for creating/editing plan
  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditPlan({ ...plan });
    } else {
      setEditPlan({
        name: '',
        plan_type: 'basic',
        duration: 'monthly',
        price: 0,
        property_limit: 1,
        description: '',
        is_active: true,
        features: {}
      });
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditPlan(null);
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: string | number | boolean | Record<string, unknown>) => {
    if (editPlan) {
      setEditPlan({
        ...editPlan,
        [field]: value
      });
    }
  };

  // Handle save plan
  const handleSavePlan = async () => {
    if (!editPlan) return;
    
    try {
      if (editPlan.id) {
        // Update existing plan
        await PaymentService.updateSubscriptionPlan(editPlan.id.toString(), editPlan);
        showNotification('Plan updated successfully', 'success');
      } else {
        // Create new plan
        await PaymentService.createSubscriptionPlan(editPlan as SubscriptionPlan);
        showNotification('Plan created successfully', 'success');
      }
      
      // Refresh data
      setRefreshing(true);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving subscription plan:', err);
      setError('Failed to save subscription plan. Please try again.');
      showNotification('Failed to save plan', 'error');
    }
  };
  
  // Handle delete plan
  const handleDeletePlan = (plan: SubscriptionPlan) => {
    openConfirmDialog(
      'Delete Plan',
      `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`,
      async () => {
        try {
          await PaymentService.deleteSubscriptionPlan(plan.id!.toString());
          showNotification('Plan deleted successfully', 'success');
          setRefreshing(true);
        } catch (err) {
          console.error('Error deleting plan:', err);
          showNotification('Failed to delete plan', 'error');
        }
      }
    );
  };
  
  // Handle toggle auto-renew
  const handleToggleAutoRenew = (subscription: Subscription) => {
    openConfirmDialog(
      `${subscription.auto_renew ? 'Disable' : 'Enable'} Auto-Renew`,
      `Are you sure you want to ${subscription.auto_renew ? 'disable' : 'enable'} auto-renewal for this subscription?`,
      async () => {
        try {
          await PaymentService.updateSubscription(subscription.id, {
            auto_renew: !subscription.auto_renew
          });
          showNotification('Subscription updated successfully', 'success');
          setRefreshing(true);
        } catch (err) {
          console.error('Error updating subscription:', err);
          showNotification('Failed to update subscription', 'error');
        }
      }
    );
  };
  
  // Handle delete subscription
  const handleDeleteSubscription = (subscription: Subscription) => {
    openConfirmDialog(
      'Delete Subscription',
      `Are you sure you want to delete this subscription? This action cannot be undone.`,
      async () => {
        try {
          await PaymentService.deleteSubscription(subscription.id);
          showNotification('Subscription deleted successfully', 'success');
          setRefreshing(true);
        } catch (err) {
          console.error('Error deleting subscription:', err);
          showNotification('Failed to delete subscription', 'error');
        }
      }
    );
  };
  
  // Open confirmation dialog
  const openConfirmDialog = (title: string, message: string, confirmAction: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmAction
    });
  };
  
  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };
  
  // Show notification
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // Close notification
  const closeNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get plan type color
  const getPlanTypeColor = (planType: string): string => {
    switch (planType) {
      case 'basic':
        return theme.palette.info.main;
      case 'premium':
        return theme.palette.warning.main;
      case 'enterprise':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Get subscription status color
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get days remaining text and color
  const getDaysRemainingInfo = (daysRemaining: number | null) => {
    if (daysRemaining === null) return { text: 'N/A', color: 'text.secondary' };
    
    if (daysRemaining <= 0) {
      return { text: 'Expired', color: theme.palette.error.main };
    } else if (daysRemaining <= 7) {
      return { text: `${daysRemaining} days (expiring soon)`, color: theme.palette.warning.main };
    } else {
      return { text: `${daysRemaining} days`, color: theme.palette.success.main };
    }
  };

  // Render subscription plans tab
  const renderPlansTab = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
          <Alert variant="destructive" >
          <Typography>{error}</Typography>
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create New Plan
          </Button>
        </Box>

        <Grid container spacing={3}>
          {plans.length > 0 ? (
            plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={plan.id}>
                <AnimatedCard
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: theme.shadows[3],
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  {/* Plan type badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: getPlanTypeColor(plan.plan_type),
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      borderBottomLeftRadius: 8,
                    }}
                  >
                    {plan.plan_type.toUpperCase()}
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {formatCurrency(plan.price)}
                        <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                          / {plan.duration}
                        </Typography>
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Features:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {Object.entries(plan.features).map(([key, value]) => (
                          <Box component="li" key={key} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>{key}:</strong> {value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>
                        Property Limit:
                      </Typography>
                      <Chip 
                        label={plan.property_limit} 
                        size="small" 
                        color="primary"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>
                        Status:
                      </Typography>
                      <Chip 
                        label={plan.is_active ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={plan.is_active ? 'success' : 'default'}
                      />
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(plan)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeletePlan(plan)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No subscription plans found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first subscription plan to get started
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </>
    );
  };

  // Render subscriptions tab
  const renderSubscriptionsTab = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={3} key={item}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      );
    }

    if (error) {
      return (
          <Alert variant="destructive" >
          {error}
        </Alert>
      );
    }

    return (
      <>
        {/* Summary cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard
              custom={0}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Active Subscriptions
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {report?.summary.total_active_subscriptions || 0}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Recurring Revenue
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CreditCardIcon color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(report?.summary.monthly_recurring_revenue || 0)}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Auto-Renew Enabled
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AutoRenewIcon color="success" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {report?.auto_renew_breakdown.find(item => item.auto_renew)?.count || 0}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Upcoming Renewals (30d)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {report?.summary.upcoming_renewals_30d || 0}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </Grid>
        </Grid>

        {/* Active subscriptions */}
        <AnimatedCard
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          sx={{
            borderRadius: 3,
            boxShadow: theme.shadows[3],
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Active Subscriptions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage all active subscriptions
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Landlord</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Auto Renew</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subscriptions && subscriptions.length > 0) ? (
                    subscriptions.map((subscription) => {
                      const daysRemainingInfo = getDaysRemainingInfo(subscription.days_remaining);
                      
                      return (
                        <TableRow
                          key={subscription.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {subscription.landlord?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subscription.plan.name}
                              size="small"
                              sx={{
                                bgcolor: alpha(getPlanTypeColor(subscription.plan.plan_type), 0.1),
                                color: getPlanTypeColor(subscription.plan.plan_type),
                                fontWeight: 'medium'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(subscription.start_date)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2">
                                {formatDate(subscription.end_date)}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ color: daysRemainingInfo.color }}
                              >
                                {daysRemainingInfo.text}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`Click to ${subscription.auto_renew ? 'disable' : 'enable'} auto-renewal`}>
                              <Chip
                                icon={subscription.auto_renew ? <AutoRenewIcon /> : <CancelIcon />}
                                label={subscription.auto_renew ? "Yes" : "No"}
                                size="small"
                                color={subscription.auto_renew ? "success" : "default"}
                                onClick={() => handleToggleAutoRenew(subscription)}
                                clickable
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                              color={getStatusColor(subscription.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Delete Subscription">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSubscription(subscription)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell {...{ colspan: 7 }} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <PersonIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.secondary, 0.5) }} />
                          <Typography variant="h6" color="text.secondary">
                            No active subscriptions found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                            There are no active subscriptions at the moment.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AnimatedCard>

        {/* Upcoming renewals section */}
        {report && report.upcoming_renewals && report.upcoming_renewals.length > 0 && (
          <AnimatedCard
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              mt: 4,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Renewals
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Landlord</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Days Remaining</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.upcoming_renewals.map((renewal) => {
                      const daysRemainingInfo = getDaysRemainingInfo(renewal.days_remaining);
                      
                      return (
                        <TableRow
                          key={renewal.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {renewal.landlord || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {renewal.plan}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(renewal.end_date)}
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ color: daysRemainingInfo.color }}
                            >
                              {daysRemainingInfo.text}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </AnimatedCard>
        )}
      </>
    );
  };

  // Render create/edit plan dialog
  const renderPlanDialog = () => {
    if (!editPlan) return null;
    
    const isEdit = Boolean(editPlan.id);
    
    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEdit ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Plan Name"
                value={editPlan.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('name', e.target.value)}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Plan Type</InputLabel>
                <Select
                  value={editPlan.plan_type || 'basic'}
                  onChange={(e: SelectChangeEvent) => handleFieldChange('plan_type', e.target.value)}
                  label="Plan Type"
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Price"
                type="number"
                value={editPlan.price || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('price', parseFloat(e.target.value))}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>TZS</Typography>,
                }as OutlinedInputProps}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Duration</InputLabel>
                <Select
                  value={editPlan.duration || 'monthly'}
                  onChange={(e: SelectChangeEvent) => handleFieldChange('duration', e.target.value)}
                  label="Duration"
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="annual">Annual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Property Limit"
                type="number"
                value={editPlan.property_limit || 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('property_limit', parseInt(e.target.value))}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <SwitchWithProps
                    checked={editPlan.is_active || false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('is_active', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={editPlan.description || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Features (JSON)
              </Typography>
              <TextField
                value={JSON.stringify(editPlan.features || {}, null, 2)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  try {
                    const features = JSON.parse(e.target.value);
                    handleFieldChange('features', features);
                  } catch (err) {
                    // Invalid JSON, don't update
                    console.error('Invalid JSON:', err);
                  }
                }}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                multiline
                rows={6}
                placeholder='{"feature1": "value1", "feature2": "value2"}'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSavePlan} 
            variant="contained" 
            color="primary"
            disabled={!editPlan.name || !editPlan.price}
          >
            {isEdit ? 'Update Plan' : 'Create Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render confirmation dialog
  const renderConfirmDialog = () => {
    return (
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              confirmDialog.confirmAction();
              closeConfirmDialog();
            }} 
            color="error" 
            variant="contained" 
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Plans" />
          <Tab label="Subscriptions" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderPlansTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderSubscriptionsTab()}
      </TabPanel>

      {renderPlanDialog()}
      {renderConfirmDialog()}

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <AlertWithChildren
          elevation={6}
          variant="filled"
          onClose={closeNotification}
          severity={notification.severity}
        >
          {notification.message}
        </AlertWithChildren>
      </Snackbar>
    </Box>
  );
}