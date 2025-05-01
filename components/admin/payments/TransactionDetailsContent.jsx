'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, XCircle, AlertTriangle, 
  CreditCard, Calendar, Clock, User, Phone, Building
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTransactionDetails } from '@/hooks/useAdminPayment';

/**
 * Transaction detail content component for displaying transaction information
 */
export default function TransactionDetailsContent({ transactionId, onClose }) {
  const [isClient, setIsClient] = useState(false);
  
  // Get transaction details
  const { transaction, loading, error, refreshTransaction } = useTransactionDetails(transactionId);
  
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
  
  // Get status icon and color
  const getStatusDetails = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'Completed'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          label: 'Failed'
        };
      case 'pending':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          label: 'Pending'
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          label: status
        };
    }
  };
  
  // Get transaction type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'subscription':
        return <CreditCard className="h-5 w-5" />;
      case 'rent':
        return <Calendar className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="p-6 bg-error-50 text-error-700 rounded-md text-center">
        <XCircle className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Failed to load transaction details</h3>
        <p className="mb-4">There was an error fetching the transaction information.</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={refreshTransaction}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  // If no transaction found
  if (!transaction) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h3 className="text-lg font-bold mb-2">Transaction Not Found</h3>
        <p className="mb-4">The requested transaction could not be found or has been deleted.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }
  
  // Get status details
  const statusDetails = getStatusDetails(transaction.status);

  return (
    <div className="space-y-6">
      {/* Transaction Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className={`p-4 rounded-full ${statusDetails.bgColor} ${statusDetails.color}`}>
          {statusDetails.icon}
        </div>
        
        <div className="flex-grow">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <Badge variant="outline" className="mb-2 font-mono">
                ID: {transaction.id}
              </Badge>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {getTypeIcon(transaction.payment_type)}
                <span className="capitalize">{transaction.payment_type} Payment</span>
              </h3>
            </div>
            
            <Badge className={`
              ${transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
               transaction.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
               'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}
              text-sm px-3 py-1
            `}>
              {statusDetails.label}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-2 text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(transaction.created_at)}
            </div>
            <div className="font-medium">
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payment-info">Payment Information</TabsTrigger>
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payer Information */}
            {transaction.payer && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Payer Information</h4>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {getInitials(transaction.payer.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-grow">
                    <div className="font-medium">{transaction.payer.full_name}</div>
                    {transaction.payer.phone_number && (
                      <div className="text-sm flex items-center text-gray-500 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {transaction.payer.phone_number}
                      </div>
                    )}
                    {transaction.payer.user_type && (
                      <div className="text-sm text-gray-500 mt-1">
                        Type: <span className="capitalize">{transaction.payer.user_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Recipient Information */}
            {transaction.recipient && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Recipient Information</h4>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {getInitials(transaction.recipient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-grow">
                    <div className="font-medium">{transaction.recipient.full_name}</div>
                    {transaction.recipient.phone_number && (
                      <div className="text-sm flex items-center text-gray-500 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {transaction.recipient.phone_number}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Property Information */}
            {transaction.property && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Property Information</h4>
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-md bg-blue-100 text-blue-700">
                    <Building className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-grow">
                    <div className="font-medium">{transaction.property.name}</div>
                    {transaction.property.location && (
                      <div className="text-sm text-gray-500 mt-1">
                        Location: {transaction.property.location}
                      </div>
                    )}
                    {transaction.property.id && (
                      <div className="text-sm text-gray-500 mt-1">
                        Property ID: {transaction.property.id}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Payment Period */}
            {(transaction.payment_period_start || transaction.payment_period_end) && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Payment Period</h4>
                <div className="space-y-2">
                  {transaction.payment_period_start && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span>{formatDate(transaction.payment_period_start)}</span>
                    </div>
                  )}
                  {transaction.payment_period_end && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">End Date:</span>
                      <span>{formatDate(transaction.payment_period_end)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Notes */}
          {transaction.notes && (
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <p>{transaction.notes}</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="payment-info" className="space-y-6">
          {/* AzamPay Information */}
          {transaction.azampay && (
            <Card className="p-4">
              <h4 className="text-lg font-medium mb-4">Payment Gateway Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono">{transaction.azampay.transaction_id || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">External ID</p>
                  <p className="font-mono">{transaction.azampay.external_id || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="capitalize">{transaction.azampay.provider || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p>{transaction.azampay.account_number || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p>{transaction.azampay.currency || 'TZS'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="capitalize">{transaction.azampay.status || '—'}</p>
                </div>
              </div>
              
              {transaction.azampay.error_message && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                  <h5 className="font-medium mb-1">Error Message</h5>
                  <p>{transaction.azampay.error_message}</p>
                </div>
              )}
              
              {transaction.azampay.payment_url && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Payment URL</p>
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      value={transaction.azampay.payment_url} 
                      readOnly 
                      className="flex-grow p-2 bg-gray-50 border border-gray-200 rounded font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-2"
                      onClick={() => window.open(transaction.azampay.payment_url, '_blank')}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <div>Created: {formatDate(transaction.azampay.created_at)}</div>
                <div>Updated: {formatDate(transaction.azampay.updated_at)}</div>
              </div>
            </Card>
          )}
          
          {/* Transaction Timeline */}
          <Card className="p-4">
            <h4 className="text-lg font-medium mb-4">Transaction Timeline</h4>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-gray-200">
              <div className="relative">
                <div className="absolute -left-6 mt-1 h-4 w-4 rounded-full bg-blue-500"></div>
                <div>
                  <p className="font-medium">Transaction Created</p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                </div>
              </div>
              
              {transaction.azampay?.created_at && (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 h-4 w-4 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="font-medium">Payment Initiated</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.azampay.created_at)}</p>
                  </div>
                </div>
              )}
              
              {transaction.azampay?.updated_at && transaction.azampay?.updated_at !== transaction.azampay?.created_at && (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 h-4 w-4 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="font-medium">Payment Status Updated</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.azampay.updated_at)}</p>
                  </div>
                </div>
              )}
              
              {transaction.status === 'completed' && (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 h-4 w-4 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium">Transaction Completed</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.updated_at)}</p>
                  </div>
                </div>
              )}
              
              {transaction.status === 'failed' && (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 h-4 w-4 rounded-full bg-red-500"></div>
                  <div>
                    <p className="font-medium">Transaction Failed</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.updated_at)}</p>
                    {transaction.azampay?.error_message && (
                      <p className="text-sm text-red-600 mt-1">{transaction.azampay.error_message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
          <TabsContent value="metadata">
            <Card className="p-4">
              <h4 className="text-lg font-medium mb-4">Transaction Metadata</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(transaction.metadata, null, 2)}
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <div className="flex justify-end mt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}