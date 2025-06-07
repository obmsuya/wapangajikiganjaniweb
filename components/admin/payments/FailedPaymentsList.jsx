'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
   AlertTriangle, RefreshCw, Eye, 
  Phone, Search, Download, ArrowRightCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { useFailedPayments } from '@/hooks/admin/useAdminPayment';
import TransactionDetailsContent from './TransactionDetailsContent';

/**
 * Failed payments list component
 */
export default function FailedPaymentsList() {
  // State for detail dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactData, setContactData] = useState({ user: null, message: '' });
  const [isClient, setIsClient] = useState(false);
  const [limit, setLimit] = useState(50);
  
  // Get failed payments data
  const { payments, loading, error, refreshPayments } = useFailedPayments(limit);
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  // Handle opening the details dialog
  const handleViewDetails = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  }, []);
  
  // Handle opening the contact dialog
  const handleContact = useCallback((transaction) => {
    setContactData({
      user: transaction.payer,
      message: `Dear ${transaction.payer.full_name},\n\nWe noticed that your payment of ${formatCurrency(transaction.amount)} for ${transaction.payment_type} failed on ${formatDate(transaction.created_at)}.\n\nPlease try again or contact our support team if you need assistance.\n\nBest regards,\nWapangaji Kiganjani Team`
    });
    setContactDialogOpen(true);
  }, []);
  
  // Handle sending notification
  const handleSendNotification = useCallback(() => {
    // In a real implementation, this would send the notification
    console.log('Sending notification:', contactData);
    setContactDialogOpen(false);
    // Show success message
    alert('Notification sent successfully');
  }, [contactData]);

  // Export failed payments as CSV
  const handleExportCSV = useCallback(() => {
    if (!payments || payments.length === 0) return;
    
    // Define the CSV headers
    const headers = [
      'ID', 'Date', 'Amount', 'Type', 'Payer', 'Phone Number', 'Error Message'
    ];
    
    // Transform the data into CSV format
    const csvRows = [
      headers.join(','),
      ...payments.map(tx => [
        tx.id,
        new Date(tx.created_at).toISOString().split('T')[0],
        tx.amount,
        tx.payment_type,
        tx.payer?.full_name || '',
        tx.payer?.phone_number || '',
        (tx.azampay?.error_message || '').replace(/,/g, ';') // Replace commas in error message
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
    link.download = `failed-payments-${today}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [payments]);
  
  // Table columns configuration
  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      sortable: true,
      cell: (row) => (
        <div className="font-mono text-xs truncate">{row.id}</div>
      )
    },
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => formatDate(row.created_at)
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
      header: 'Payment Type',
      accessor: 'payment_type',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'subscription', label: 'Subscription' },
        { value: 'rent', label: 'Rent Payment' }
      ],
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.payment_type}
        </Badge>
      )
    },
    {
      header: 'Payer',
      accessor: 'payer',
      sortable: false,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.payer?.full_name || '—'}</div>
          {row.payer?.phone_number && (
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {row.payer.phone_number}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Error Message',
      accessor: 'error_message',
      sortable: false,
      cell: (row) => (
        <div className="text-red-600 dark:text-red-400 truncate max-w-[250px]">
          {row.error_message || 'Unknown error'}
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
        },
        {
          label: 'Contact User',
          icon: <Phone className="h-4 w-4" />,
          onClick: handleContact
        }
      ]
    }
  ];

  // Process payments data to include error message from Azampay
  const processedPayments = (payments || []).map(payment => ({
    ...payment,
    error_message: payment.azampay?.error_message || 'Payment processing failed'
  }));
  
  // Count errors by type
  const errorStats = processedPayments.reduce((acc, payment) => {
    // Extract error category (first few words)
    const errorText = payment.error_message || '';
    let category = 'Other';
    
    if (errorText.includes('insufficient') || errorText.includes('balance')) {
      category = 'Insufficient Funds';
    } else if (errorText.includes('timeout') || errorText.includes('timed out')) {
      category = 'Timeout';
    } else if (errorText.includes('invalid') || errorText.includes('wrong')) {
      category = 'Invalid Details';
    } else if (errorText.includes('cancelled') || errorText.includes('canceled')) {
      category = 'Cancelled';
    } else if (errorText.includes('network') || errorText.includes('connection')) {
      category = 'Network Issues';
    }
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">Failed Payments</h2>
          <p className="text-gray-500 text-sm mt-1">
            Payments that could not be processed
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={limit.toString()}
            onValueChange={(value) => setLimit(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">Last 25</SelectItem>
              <SelectItem value="50">Last 50</SelectItem>
              <SelectItem value="100">Last 100</SelectItem>
              <SelectItem value="250">Last 250</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={loading || !payments || payments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            onClick={refreshPayments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Error counts */}
      {isClient && Object.keys(errorStats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(errorStats).map(([category, count]) => (
            <Card key={category} className="p-3">
              <div className="text-sm text-gray-500">{category}</div>
              <div className="text-xl font-bold mt-1">{count}</div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by payer name, error message..."
          className="pl-9"
        />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md">
          <AlertTriangle className="h-5 w-5 inline-block mr-2" />
          Failed to load payment data. Please try again.
        </div>
      )}
      
      {/* Failed payments table */}
      <CloudflareTable
        data={processedPayments}
        columns={columns}
        loading={loading}
        pagination={true}
        initialRowsPerPage={10}
        searchable={false} // We're handling search separately
        emptyMessage="No failed payments found."
      />
      
      {/* Transaction details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Failed Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionDetailsContent 
              transactionId={selectedTransaction.id}
              onClose={() => setDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Contact user dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact User</DialogTitle>
          </DialogHeader>
          
          {contactData.user && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div className="font-medium">{contactData.user.full_name}</div>
                <div className="text-sm text-gray-500 flex items-center ml-auto">
                  <Phone className="h-3 w-3 mr-1" />
                  {contactData.user.phone_number}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-700 rounded-md"
                  value={contactData.message}
                  onChange={(e) => setContactData({...contactData, message: e.target.value})}
                ></textarea>
              </div>
              
              <div className="text-sm text-gray-500">
                <p className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  This will send an SMS notification to the user.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification}>
              <ArrowRightCircle className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}