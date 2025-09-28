'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, Search, Download, Filter, Eye, RefreshCw, 
  CreditCard, Check, XCircle, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { useTransactionHistory, useTransactionDetails } from '@/hooks/admin/useAdminPayment';
import TransactionDetailsContent from './TransactionDetailsContent';

/**
 * Transactions list component with filtering options
 */
export default function TransactionsList() {
  // State for detail dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });
  
  // Convert date range to string format for API
  const getDateRangeParams = useCallback(() => {
    const formatDateForApi = (date) => {
      return date ? format(date, 'yyyy-MM-dd') : '';
    };

    return {
      start_date: formatDateForApi(dateRange.from),
      end_date: formatDateForApi(dateRange.to)
    };
  }, [dateRange]);
  
  // Get transaction history data
  const { 
    transactions, 
    loading, 
    error, 
    filters, 
    updateFilters,
    refreshTransactions 
  } = useTransactionHistory({
    ...getDateRangeParams(),
    limit: 100
  });
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update filters when date range changes
  useEffect(() => {
    if (isClient) {
      updateFilters(getDateRangeParams());
    }
  }, [dateRange, isClient, updateFilters, getDateRangeParams]);

  // Format currency to TZS
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP p'); // e.g., "Apr 29, 2023, 3:45 PM"
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  // Handle opening the details dialog
  const handleViewDetails = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  }, []);

  // Export transactions as CSV
  const handleExportCSV = useCallback(() => {
    if (!transactions || transactions.length === 0) return;
    
    // Define the CSV headers
    const headers = [
      'ID', 'Date', 'Amount', 'Type', 'Status', 'Payer', 'Phone Number', 'Payment Method'
    ];
    
    // Transform the data into CSV format
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.id,
        new Date(tx.created_at).toISOString().split('T')[0],
        tx.amount,
        tx.payment_type,
        tx.status,
        tx.payer?.full_name || '',
        tx.payer?.phone_number || '',
        tx.azampay?.provider || ''
      ].join(','))
    ];
    
    // Create a Blob with the CSV data
    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Format the date for the filename
    const today = format(new Date(), 'yyyy-MM-dd');
    link.download = `transactions-${today}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transactions]);
  
  // Table columns configuration
  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'id',
      sortable: true,
      cell: (row) => (
        <div className="font-mono text-xs">{row.id}</div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => (
        <div className="whitespace-nowrap">{formatDate(row.created_at)}</div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{formatCurrency(row.amount)}</div>
      )
    },
    {
      header: 'Payer',
      accessor: 'payer',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.payer?.full_name || '—'}</div>
          {row.payer?.phone_number && (
            <div className="text-sm text-gray-500">{row.payer.phone_number}</div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'payment_type',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'subscription', label: 'Subscription' },
        { value: 'rent', label: 'Rent Payment' }
      ],
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.payment_type === 'subscription' ? (
            <>
              <CreditCard className="h-3 w-3 mr-1" />
              Subscription
            </>
          ) : row.payment_type === 'rent' ? (
            <>
              <Calendar className="h-3 w-3 mr-1" />
              Rent
            </>
          ) : (
            row.payment_type
          )}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' }
      ],
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Payment Method',
      accessor: 'payment_method',
      sortable: true,
      cell: (row) => (
        <div className="capitalize">
          {row.azampay?.provider || '—'}
        </div>
      )
    },
    {
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'View Details',
          icon: <Eye className="h-4 w-4" />,
          onClick: handleViewDetails
        }
      ]
    }
  ];

  // Calculate summary statistics
  const calculateSummary = useCallback(() => {
    if (!transactions) return {};
    
    const total = transactions.length;
    const completed = transactions.filter(tx => tx.status === 'completed').length;
    const pending = transactions.filter(tx => tx.status === 'pending').length;
    const failed = transactions.filter(tx => tx.status === 'failed').length;
    
    const totalAmount = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      
    const subscriptionAmount = transactions
      .filter(tx => tx.status === 'completed' && tx.payment_type === 'subscription')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      
    const rentAmount = transactions
      .filter(tx => tx.status === 'completed' && tx.payment_type === 'rent')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    
    return {
      total,
      completed,
      pending,
      failed,
      totalAmount,
      subscriptionAmount,
      rentAmount
    };
  }, [transactions]);
  
  const summary = calculateSummary();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Transaction History</h2>
        
        <div className="flex items-center gap-2">
          {isClient && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {dateRange.from ? format(dateRange.from, 'PP') : '—'} - {dateRange.to ? format(dateRange.to, 'PP') : '—'}
                  </span>
                  <span className="sm:hidden">Date Range</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DatePickerWithRange
                  from={dateRange.from}
                  to={dateRange.to}
                  onUpdate={(range) => setDateRange(range)}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={handleExportCSV}
            disabled={loading || !transactions || transactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9" 
            onClick={refreshTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <CloudflareTable
        data={transactions || []}
        columns={columns}
        loading={loading}
        pagination={true}
        initialRowsPerPage={10}
        searchable={false} // We're handling search in our own filters
        emptyMessage="No transactions found. Try adjusting your filters."
      />
      
      {/* Transaction details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionDetailsContent 
              transactionId={selectedTransaction.id}
              onClose={() => setDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}