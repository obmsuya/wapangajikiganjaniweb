'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Divider,
  Avatar,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import { Alert } from '@/components/ui/alert';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { OutlinedInputProps } from '@mui/material';
import PaymentService, { Transaction } from '@/services/payment';
import NextLink from 'next/link';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';


// Payment provider logos
const PROVIDER_LOGOS: Record<string, string> = {
  'Airtel': '/images/payment-providers/airtel.png',
  'Tigo': '/images/payment-providers/mixx-by-yas.png',
  'Halopesa': '/images/payment-providers/halopesa.png',
  'Azampesa': '/images/payment-providers/azampesa.png',
  'Mpesa': '/images/payment-providers/mpesa.png',
  'CRDB': '/images/payment-providers/crdb.png',
  'NMB': '/images/payment-providers/nmb.png',
};

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

// Filter interface
interface TransactionFilters {
  status: string;
  provider: string;
  fromDate: Date | null;
  toDate: Date | null;
  search: string;
}

/**
 * TransactionList Component
 * Displays a list of transactions with filtering, sorting, and pagination
 */
export default function TransactionList() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState<TransactionFilters>({
    status: '',
    provider: '',
    fromDate: null,
    toDate: null,
    search: ''
  });
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch transactions with current filters and pagination
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params: Record<string, string | number> = {
        page: page + 1, // API uses 1-based indexing
        page_size: rowsPerPage
      };
      
      // Add filters if they are set
      if (filters.status) params.status = filters.status;
      if (filters.provider) params.provider = filters.provider;
      if (filters.fromDate) params.from_date = dayjs(filters.fromDate).format('YYYY-MM-DD');
      if (filters.toDate) params.to_date = dayjs(filters.toDate).format('YYYY-MM-DD');
      if (filters.search) params.search = filters.search;
      
      // Fetch data from API
      const response = await PaymentService.getTransactions(params);
      
      // Update state with response data
      setTransactions(response.results);
      setTotalCount(response.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, rowsPerPage, filters]);

  // Fetch transactions on initial load and when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (name: keyof TransactionFilters, value: string | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      status: '',
      provider: '',
      fromDate: null,
      toDate: null,
      search: ''
    });
    setPage(0);
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

  // Format date properly
  const formatDate = (dateString: string): string => {
    try {
      return dayjs(dateString).format('DD MMM YYYY, HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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
        return <CheckCircleIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'pending':
        return <PendingIcon fontSize="small" />;
      case 'processing':
        return <AccessTimeIcon fontSize="small" />;
      default:
        return <AccessTimeIcon fontSize="small" />;
    }
  };

  // Get provider logo
  const getProviderLogo = (provider: string): string => {
    return PROVIDER_LOGOS[provider] || '/images/payment-providers/default.png';
  };

  return (
    <AnimatedCard
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      sx={{
        borderRadius: 3,
        boxShadow: theme.shadows[3],
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header with search and filters */}
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Transactions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFiltersVisible(!filtersVisible)}
                color={Object.values(filters).some(v => v !== '' && v !== null) ? 'primary' : 'inherit'}
              >
                Filters
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            placeholder="Search by transaction ID, user name, or phone number"
            variant="outlined"
            value={filters.search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }as OutlinedInputProps}
            sx={{ mb: filtersVisible ? 2 : 0 }}
          />

          {/* Advanced filters */}
          {filtersVisible && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e: SelectChangeEvent) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={filters.provider}
                      onChange={(e: SelectChangeEvent) => handleFilterChange('provider', e.target.value)}
                      label="Provider"
                    >
                      <MenuItem value="">All Providers</MenuItem>
                      <MenuItem value="Airtel">Airtel</MenuItem>
                      <MenuItem value="Tigo">Tigo</MenuItem>
                      <MenuItem value="Halopesa">Halopesa</MenuItem>
                      <MenuItem value="Azampesa">Azampesa</MenuItem>
                      <MenuItem value="Mpesa">Mpesa</MenuItem>
                      <MenuItem value="CRDB">CRDB</MenuItem>
                      <MenuItem value="NMB">NMB</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel shrink>Date Range</InputLabel>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="From"
                          value={filters.fromDate ? dayjs(filters.fromDate) : null}
                          onChange={(date) => handleFilterChange('fromDate', date ? date.toDate() : null)}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true, 
                              size: 'small',
                              variant: 'outlined'
                            }
                          }}
                          format="DD MMM YYYY"
                        />
                        <DatePicker
                          label="To"
                          value={filters.toDate ? dayjs(filters.toDate) : null}
                          onChange={(date) => handleFilterChange('toDate', date ? date.toDate() : null)}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true, 
                              size: 'small',
                              variant: 'outlined'
                            }
                          }}
                          format="DD MMM YYYY"
                          minDate={filters.fromDate ? dayjs(filters.fromDate) : undefined}
                        />
                      </LocalizationProvider>
                    </Box>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetFilters}
                  startIcon={<CloseIcon />}
                  sx={{ mr: 1 }}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => fetchTransactions()}
                  startIcon={<SearchIcon />}
                >
                  Apply Filters
                </Button>
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}
        </Box>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
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
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                    <TableCell align="right"><Skeleton variant="rectangular" width={80} height={30} /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length > 0 ? (
                // Transaction rows
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
                        {transaction.external_id.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.user.phone_number}
                      </Typography>
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
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: 'background.paper',
                            border: `1px solid ${theme.palette.divider}`,
                            padding: '2px'
                          }}
                        />
                        <Typography variant="body2">
                          {transaction.provider}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(transaction.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(transaction.status)}
                        label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        color={getStatusColor(transaction.status)}
                        size="small"
                        sx={{
                          fontWeight: 'medium',
                          '& .MuiChip-icon': {
                            marginLeft: '4px',
                            marginRight: '-4px'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          component={NextLink}
                          href={`/payments/${transaction.id}`}
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Receipt">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            // Download receipt functionality would go here
                            console.log(`Download receipt for transaction ${transaction.id}`);
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell {...{ colspan: 7 }} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <ReceiptLongIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.secondary, 0.5) }} />
                      <Typography variant="h6" color="text.secondary">
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                        {Object.values(filters).some(v => v !== '' && v !== null)
                          ? 'Try adjusting your filters to see more results'
                          : 'Transactions will appear here once payments are processed'}
                      </Typography>
                      {Object.values(filters).some(v => v !== '' && v !== null) && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleResetFilters}
                          startIcon={<CloseIcon />}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </AnimatedCard>
  );
} 