'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Avatar,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
  alpha,
  SelectChangeEvent,
  Snackbar
} from '@mui/material';

import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  ReceiptLong as ReceiptLongIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PaymentService, { 
  Transaction, 
  ReconcileTransactionRequest 
} from '@/services/payment';
import { motion } from 'framer-motion';

// Animated card component
const AnimatedCard = motion(Card);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

/**
 * PaymentReconciliation Component
 * Allows administrators to manually reconcile unmatched transactions
 */
export default function PaymentReconciliation() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState<boolean>(false);
  const [reconcileData, setReconcileData] = useState<ReconcileTransactionRequest>({
    payment_type: 'rent',
    payer_id: 0
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Fetch unreconciled transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch unreconciled transactions
        const data = await PaymentService.getUnreconciledTransactions();
        setTransactions(data.results || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching unreconciled transactions:', err);
        setError('Failed to load unreconciled transactions. Please try again later.');
        setTransactions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchData();
  }, [refreshing]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
  };

  // Handle reconcile button click
  const handleReconcileClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReconcileData({
      payment_type: 'rent',
      payer_id: transaction.user.id
    });
    setReconcileDialogOpen(true);
  };

  // Handle reconcile dialog close
  const handleReconcileDialogClose = () => {
    setReconcileDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Handle form field changes
  const handleFieldChange = (
    field: keyof ReconcileTransactionRequest, 
    value: string | number | null | undefined
  ) => {
    setReconcileData({
      ...reconcileData,
      [field]: value
    });
  };

  // Handle reconcile submit
  const handleReconcileSubmit = async () => {
    if (!selectedTransaction) return;
    
    try {
      await PaymentService.reconcileTransaction(
        selectedTransaction.id,
        reconcileData
      );
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Transaction reconciled successfully',
        severity: 'success'
      });
      
      // Close dialog and refresh data
      handleReconcileDialogClose();
      handleRefresh();
    } catch (err) {
      console.error('Error reconciling transaction:', err);
      
      // Show error notification
      setNotification({
        open: true,
        message: 'Failed to reconcile transaction',
        severity: 'error'
      });
    }
  };

  // Close notification
  const handleCloseNotification = () => {
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
  const formatDate = (dateString: string): string => {
    try {
      return dayjs(dateString).format('DD MMM YYYY, HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get payment provider logo
  const getProviderLogo = (provider: string): string => {
    const providerLogos: Record<string, string> = {
      'Airtel': '/images/payment-providers/airtel.png',
      'Tigo': '/images/payment-providers/mixx-by-yas.png',
      'Halopesa': '/images/payment-providers/halopesa.png',
      'Azampesa': '/images/payment-providers/azampesa.png',
      'Mpesa': '/images/payment-providers/mpesa.png',
      'CRDB': '/images/payment-providers/crdb.png',
      'NMB': '/images/payment-providers/nmb.png',
    };
    
    return providerLogos[provider] || '/images/payment-providers/default.png';
  };

  return (
    <Box>
      <AnimatedCard
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
          {/* Header */}
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Unreconciled Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manually reconcile transactions that couldn&apos;t be automatically matched
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

          {/* Error message */}
          {error && (
            <Snackbar setOpen={true} severity="error">
              <Typography>{error}</Typography>
            </Snackbar>
             
          )}

          {/* Transactions table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from(new Array(5)).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={100} height={36} /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.transaction_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.external_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {transaction.user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.user.phone_number}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={getProviderLogo(transaction.provider)}
                            alt={transaction.provider}
                            sx={{ width: 24, height: 24 }}
                            variant="rounded"
                          />
                          <Typography variant="body2">
                            {transaction.provider}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => handleReconcileClick(transaction)}
                        >
                          Reconcile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Empty state
                  <TableRow>
                    <TableCell {...{ colspan: 6 }} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <ReceiptLongIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.secondary, 0.5) }} />
                        <Typography variant="h6" color="text.secondary">
                          No unreconciled transactions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                          All transactions have been successfully reconciled. Check back later for new transactions.
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

      {/* Reconcile Dialog */}
      <Dialog
        open={reconcileDialogOpen}
        onClose={handleReconcileDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reconcile Transaction
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Grid container spacing={3}>
              {/* Transaction details */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05), 
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transaction Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction ID
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedTransaction.transaction_id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(selectedTransaction.amount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        User
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedTransaction.user.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(selectedTransaction.created_at)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Reconciliation form */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={reconcileData.payment_type}
                    onChange={(e: SelectChangeEvent) => handleFieldChange('payment_type', e.target.value as 'rent' | 'subscription' | 'deposit' | 'other')}
                    label="Payment Type"
                  >
                    <MenuItem value="rent">Rent Payment</MenuItem>
                    <MenuItem value="subscription">Subscription</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payer ID"
                  type="number"
                  value={reconcileData.payer_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('payer_id', parseInt(e.target.value))}
                  fullWidth
                  required
                  helperText="User ID of the payer"
                />
              </Grid>

              {reconcileData.payment_type === 'rent' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Property ID"
                      type="number"
                      value={reconcileData.property_id || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('property_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      fullWidth 
                      helperText="Property ID for rent payment"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Recipient ID"
                      type="number"
                      value={reconcileData.recipient_id || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('recipient_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      fullWidth
                      helperText="Landlord ID (recipient)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Payment Period Start"
                        value={reconcileData.payment_period_start ? dayjs(reconcileData.payment_period_start) : null}
                        onChange={(date: Dayjs | null) => handleFieldChange('payment_period_start', date ? date.format('YYYY-MM-DD') : undefined)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true, 
                            helperText: "Start date of rent period"
                          }
                        }}
                        format="DD MMM YYYY"
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Payment Period End"
                        value={reconcileData.payment_period_end ? dayjs(reconcileData.payment_period_end) : null}
                        onChange={(date: Dayjs | null) => handleFieldChange('payment_period_end', date ? date.format('YYYY-MM-DD') : undefined)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true, 
                            helperText: "End date of rent period"
                          }
                        }}
                        format="DD MMM YYYY"
                      />
                    </LocalizationProvider>
                  </Grid>
                </>
              )}

              {reconcileData.payment_type === 'subscription' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subscription ID"
                    type="number"
                    value={reconcileData.subscription_id || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('subscription_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    helperText="Subscription ID"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={reconcileData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('notes', e.target.value)}
                  fullWidth  
                  multiline
                  rows={3}
                  helperText="Additional notes about this reconciliation"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReconcileDialogClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleReconcileSubmit} 
            variant="contained" 
            color="primary"
            startIcon={<CheckCircleIcon />}
          >
            Reconcile Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Snackbar
          elevation={6}
          variant="filled"
          onClose={handleCloseNotification}
          severity={notification.severity}
        >
          <Typography> console.log(notification.message); </Typography>
        </Snackbar>
      </Snackbar>
    </Box>
  );
} 