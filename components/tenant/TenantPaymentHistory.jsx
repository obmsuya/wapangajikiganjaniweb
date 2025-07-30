"use client";

import { useEffect, useState } from 'react';
import { History, Filter, Calendar, Building2, Clock, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

const PROVIDERS = [
  { value: 'Airtel', label: 'Airtel', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Tigo', label: 'Tigo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Halopesa', label: 'Halopesa', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Azampesa', label: 'Azampesa', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'Mpesa', label: 'M-Pesa', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CRDB', label: 'CRDB Bank', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'NMB', label: 'NMB Bank', color: 'bg-gray-100 text-gray-800 border-gray-200' }
];

export default function TenantPaymentHistory() {
  const { 
    paymentHistory, 
    loading, 
    error, 
    occupancies,
    fetchPaymentHistory,
    fetchOccupancies,
    formatCurrency,
    getPaymentStatusColor 
  } = useTenantPaymentStore();

  const [filters, setFilters] = useState({
    unitId: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (occupancies.length === 0) {
      fetchOccupancies();
    }
    fetchPaymentHistory(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      unitId: '',
      startDate: '',
      endDate: '',
      status: ''
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getProviderBadge = (paymentMethod, transactionId) => {
    if (paymentMethod === 'manual' || !transactionId) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Manual</Badge>;
    }
    
    const provider = PROVIDERS.find(p => 
      paymentMethod?.toLowerCase().includes(p.value.toLowerCase())
    );
    
    if (provider) {
      return <Badge className={provider.color} variant="outline">{provider.label}</Badge>;
    }
    
    return <Badge variant="outline" className="bg-blue-100 text-blue-800">System</Badge>;
  };

  const getPaymentStats = () => {
    const completed = paymentHistory.filter(p => p.status === 'completed');
    const pending = paymentHistory.filter(p => p.status === 'pending');
    const total = completed.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    return { completed: completed.length, pending: pending.length, total };
  };

  if (loading && paymentHistory.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const stats = getPaymentStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Payment History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="unit">Property & Unit</Label>
                <Select value={filters.unitId} onValueChange={(value) => handleFilterChange('unitId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All properties</SelectItem>
                    {occupancies.map((occ) => (
                      <SelectItem key={occ.unit_id} value={occ.unit_id.toString()}>
                        {occ.unit_name} - {occ.property_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">From Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">To Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {paymentHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No payments found</p>
              <p className="text-sm">Your payment history will appear here once you make payments</p>
              {Object.values(filters).some(f => f) && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                  Clear filters to see all payments
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-medium">{payment.unit_name}</p>
                        <p className="text-sm text-muted-foreground">{payment.property_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {getStatusText(payment.status)}
                        </Badge>
                        {getProviderBadge(payment.payment_method, payment.transaction_id)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(payment.payment_period_start).toLocaleDateString()} - {new Date(payment.payment_period_end).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>Floor {payment.floor_number}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {payment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleTimeString()}
                    </p>
                    {payment.transaction_id && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.transaction_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-green-700">Completed Payments</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-yellow-700">Pending Payments</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total)}</p>
                <p className="text-sm text-blue-700">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}