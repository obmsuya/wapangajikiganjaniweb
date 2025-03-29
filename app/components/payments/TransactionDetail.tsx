'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  Chip,
  Skeleton,
  Stack,
  Button,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import { Alert } from '@/components/ui/alert';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import PaymentService, { TransactionDetail } from '@/services/payment';
import NextLink from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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

interface TransactionDetailProps {
  transactionId: string;
}

// Define a proper type for transaction steps
interface TransactionStep {
  label: string;
  description: string;
  completed: boolean;
  error?: boolean; // Make error optional
}

export default function TransactionDetailComponent({ transactionId }: TransactionDetailProps) {
  const theme = useTheme();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    fetchTransactionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);
      const data = await PaymentService.getTransactionDetail(Number(transactionId));
      setTransaction(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTransactionDetail();
    } finally {
      setRefreshing(false);
    }
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
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status chip color
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'pending':
      case 'processing':
        return <PendingIcon />;
      default:
        return <AccessTimeIcon />;
    }
  };

  // Get transaction steps
  const getTransactionSteps = (): TransactionStep[] => {
    const steps: TransactionStep[] = [
      {
        label: 'Transaction Initiated',
        description: `Transaction was initiated on ${formatDate(transaction?.created_at || '')}`,
        completed: true
      },
      {
        label: 'Processing Payment',
        description: 'Payment is being processed by the payment provider',
        completed: ['processing', 'completed'].includes(transaction?.status || '')
      },
      {
        label: 'Payment Completed',
        description: transaction?.status === 'completed' 
          ? `Payment was successfully completed on ${formatDate(transaction?.updated_at || '')}`
          : 'Waiting for payment to complete',
        completed: transaction?.status === 'completed'
      }
    ];

    if (transaction?.status === 'failed') {
      steps[1] = {
        label: 'Payment Failed',
        description: `Payment failed: ${transaction.error_message || 'Unknown error'}`,
        completed: true,
        error: true // Now this is properly typed
      };
      steps.splice(2, 1);
    }

    return steps;
  };

  const handleDeleteTransaction = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.'
    });
  };

  const confirmDelete = async () => {
    try {
      await PaymentService.deleteTransaction(Number(transactionId));
      setNotification({
        open: true,
        message: 'Transaction deleted successfully',
        severity: 'success'
      });
      
      // Close dialog
      setConfirmDialog({
        ...confirmDialog,
        open: false
      });
      
      // Redirect to transactions list after a short delay
      setTimeout(() => {
        router.push('/payments');
      }, 1500);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setNotification({
        open: true,
        message: 'Failed to delete transaction',
        severity: 'error'
      });
      setConfirmDialog({
        ...confirmDialog,
        open: false
      });
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  const closeNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 3 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert variant="destructive" >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          component={NextLink} 
          href="/payments"
        >
          Back to Payments
        </Button>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert variant="default" >
          <AlertTitle>Transaction Not Found</AlertTitle>
          The requested transaction could not be found.
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          component={NextLink} 
          href="/payments"
        >
          Back to Payments
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            component={NextLink} 
            href="/payments"
            size="small"
          >
            Back
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Transaction Details
          </Typography>
          <Chip
            icon={getStatusIcon(transaction.status)}
            label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            color={getStatusColor(transaction.status)}
            sx={{ fontWeight: 'medium' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Receipt">
            <IconButton disabled={transaction.status !== 'completed'}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Receipt">
            <IconButton disabled={transaction.status !== 'completed'}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Transaction">
            <IconButton
              color="error"
              onClick={handleDeleteTransaction}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Transaction Details */}
        <Grid item xs={12} md={8}>
          <AnimatedCard 
            custom={1}
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
              {/* Transaction Header */}
              <Box sx={{ 
                p: 3, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Transaction #{transaction.transaction_id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  External ID: {transaction.external_id}
                </Typography>
              </Box>

              {/* Transaction Info */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Payment Provider
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <CreditCardIcon color="primary" />
                          <Typography variant="body1">
                            {transaction.provider}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Account Number
                        </Typography>
                        <Typography variant="body1">
                          {transaction.account_number}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date Created
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <CalendarTodayIcon color="primary" />
                          <Typography variant="body1">
                            {formatDate(transaction.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(transaction.updated_at)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          User
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <PersonIcon color="primary" />
                          <Typography variant="body1">
                            {transaction.user.name} ({transaction.user.phone_number})
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                {/* Transaction Timeline */}
                <Typography variant="h6" gutterBottom>
                  Transaction Timeline
                </Typography>
                
                <Stepper orientation="vertical" sx={{ mt: 2 }}>
                  {getTransactionSteps().map((step, index) => (
                    <Step key={index} active={true} completed={step.completed}>
                      <StepLabel
                        StepIconProps={{
                          error: step.error || false,
                        }}
                      >
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </CardContent>
          </AnimatedCard>
        </Grid>
        
        {/* Additional Information */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* User Information */}
            <AnimatedCard 
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{ 
                borderRadius: 3,
                boxShadow: theme.shadows[3]
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  User Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={transaction.user.name}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CreditCardIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone Number" 
                      secondary={transaction.user.phone_number}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </AnimatedCard>
            
            {/* Payment Records */}
            <AnimatedCard 
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{ 
                borderRadius: 3,
                boxShadow: theme.shadows[3]
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Payment Records
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {transaction.payment_records && transaction.payment_records.length > 0 ? (
                  <List disablePadding>
                    {transaction.payment_records.map((record, index) => (
                      <ListItem 
                        key={record.id} 
                        disablePadding 
                        sx={{ 
                          mb: 1,
                          pb: 1,
                          borderBottom: index < transaction.payment_records.length - 1 ? 
                            `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ReceiptIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={record.payment_type} 
                          secondary={
                            <>
                              <Typography variant="body2">
                                {formatCurrency(record.amount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(record.created_at)}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                        <Chip 
                          label={record.status} 
                          size="small"
                          color={getStatusColor(record.status)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No payment records found
                  </Typography>
                )}
              </CardContent>
            </AnimatedCard>
            
            {/* Callbacks */}
            <AnimatedCard 
              custom={4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{ 
                borderRadius: 3,
                boxShadow: theme.shadows[3]
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Callback History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {transaction.callbacks && transaction.callbacks.length > 0 ? (
                  <List disablePadding>
                    {transaction.callbacks.map((callback, index) => (
                      <ListItem 
                        key={callback.id} 
                        disablePadding 
                        sx={{ 
                          mb: 1,
                          pb: 1,
                          borderBottom: index < transaction.callbacks.length - 1 ? 
                            `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none'
                        }}
                      >
                        <ListItemText 
                          primary={formatDate(callback.created_at)} 
                          secondary={
                            <>
                              <Typography variant="body2">
                                {callback.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ref: {callback.reference}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                        <Chip 
                          label={callback.status} 
                          size="small"
                          color={getStatusColor(callback.status)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No callbacks received yet
                  </Typography>
                )}
              </CardContent>
            </AnimatedCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
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
            onClick={confirmDelete} 
            color="error" 
            variant="contained" 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ position: 'relative', width: '100%' }}>
          <Alert variant={notification.severity === 'error' ? 'destructive' : 'default'}>
            <Box sx={{ pr: 4 }}> {/* Add padding to make room for close button */}
              {notification.message}
            </Box>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={closeNotification}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Alert>
        </Box>
      </Snackbar>
    </Box>
  );
} 