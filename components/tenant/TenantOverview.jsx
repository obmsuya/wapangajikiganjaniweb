// components/tenant/TenantOverview.jsx
"use client";

import { useEffect } from 'react';
import { Home, Calendar, DollarSign, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDashboardStore } from '@/stores/tenant/useTenantDashboardStore';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

export default function TenantOverview({ onPayNow }) {
  const { occupancies, loading, error, fetchOccupancies, getUpcomingRent, getOverdueRent, getTotalMonthlyRent, getOccupancyStats, formatCurrency } = useTenantDashboardStore();
  const { setSelectedUnit, setShowPaymentDialog } = useTenantPaymentStore();

  useEffect(() => {
    fetchOccupancies();
  }, [fetchOccupancies]);

  const handleQuickPay = (occupancy) => {
    setSelectedUnit({
      unit_id: occupancy.unit_id,
      unit_name: occupancy.unit_name,
      property_name: occupancy.property_name,
      rent_amount: occupancy.rent_amount,
      floor_number: occupancy.floor_number,
      property_id: occupancy.property_id
    });
    
    if (onPayNow) {
      onPayNow();
    } else {
      setShowPaymentDialog(true);
    }
  };

  const upcomingRent = getUpcomingRent();
  const overdueRent = getOverdueRent();
  const stats = getOccupancyStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Home className="h-4 w-4" />
              Your Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-gray-500 mt-1">Active rentals</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Monthly Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthlyRent)}</div>
            <p className="text-xs text-gray-500 mt-1">Total per month</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.overduePayments > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
                  <Badge variant="destructive">Overdue</Badge>
                </>
              ) : stats.upcomingPayments > 0 ? (
                <>
                  <div className="text-2xl font-bold text-yellow-600">{stats.upcomingPayments}</div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Due Soon</Badge>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Up to Date</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {overdueRent.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Urgent: Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueRent.slice(0, 3).map((rent) => (
              <div key={rent.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-900">{rent.unit_name}</p>
                  <p className="text-sm text-red-700">{rent.property_name}</p>
                  <p className="text-xs text-red-600">{rent.days_overdue} days overdue</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-900">{formatCurrency(rent.rent_amount)}</p>
                  <Button size="sm" variant="destructive" onClick={() => handleQuickPay({
                    unit_id: rent.unit_id, unit_name: rent.unit_name, property_name: rent.property_name,
                    rent_amount: rent.rent_amount, property_id: rent.property_id, floor_number: rent.floor_number
                  })} className="mt-1">
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcomingRent.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingRent.slice(0, 3).map((rent) => (
              <div key={rent.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-900">{rent.unit_name}</p>
                  <p className="text-sm text-yellow-700">{rent.property_name}</p>
                  <p className="text-xs text-yellow-600">Due: {new Date(rent.due_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-900">{formatCurrency(rent.rent_amount)}</p>
                  <Button size="sm" onClick={() => handleQuickPay({
                    unit_id: rent.unit_id, unit_name: rent.unit_name, property_name: rent.property_name,
                    rent_amount: rent.rent_amount, property_id: rent.property_id, floor_number: rent.floor_number
                  })} className="mt-1">
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Your Rental Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats.hasActiveRentals ? (
            <div className="text-center py-8 text-gray-500">
              <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No active rentals</p>
              <p className="text-sm">Contact your landlord to get started with rent payments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupancies.map((occupancy) => (
                <Card key={occupancy.unit_id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{occupancy.unit_name}</h3>
                        <p className="text-sm text-gray-500">{occupancy.property_name}</p>
                        <p className="text-xs text-gray-500">Floor {occupancy.floor_number}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Rent Amount:</span>
                        <span className="font-medium">{formatCurrency(occupancy.rent_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Payment Schedule:</span>
                        <span className="capitalize">{occupancy.payment_frequency}</span>
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full flex items-center gap-2"
                      onClick={() => handleQuickPay(occupancy)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Make Payment
                    </Button>

                    {occupancy.recent_payments && occupancy.recent_payments.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Recent Payments:</p>
                        <div className="space-y-1">
                          {occupancy.recent_payments.slice(0, 2).map((payment) => (
                            <div key={payment.id} className="flex justify-between text-xs text-gray-500">
                              <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                              <span>{formatCurrency(payment.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}