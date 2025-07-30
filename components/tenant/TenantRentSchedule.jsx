"use client";

import { useEffect } from 'react';
import { Calendar, Clock, CreditCard, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantDashboardStore } from '@/stores/tenant/useTenantDashboardStore';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

export default function TenantRentSchedule({ onPayNow }) {
  const { 
    rentSchedules, 
    loading, 
    error, 
    fetchRentSchedules, 
    getUpcomingRent, 
    getOverdueRent,
    getPaymentStatus,
    formatCurrency,
    getStatusColor 
  } = useTenantDashboardStore();

  const { setSelectedUnit, setPaymentFlow } = useTenantPaymentStore();

  useEffect(() => {
    fetchRentSchedules();
  }, [fetchRentSchedules]);

  const handlePayNow = (schedule) => {
    setSelectedUnit({
      id: schedule.unit_id,
      name: schedule.unit_name,
      property: schedule.property_name,
      amount: schedule.rent_amount,
      propertyId: schedule.property?.id,
      schedule: schedule
    });
    setPaymentFlow('select');
    onPayNow?.();
  };

  const upcomingRent = getUpcomingRent();
  const overdueRent = getOverdueRent();

  const getSchedulesByStatus = () => {
    const paid = rentSchedules.filter(s => s.is_paid);
    const unpaid = rentSchedules.filter(s => !s.is_paid);
    const overdue = unpaid.filter(s => s.days_overdue > 0);
    const upcoming = unpaid.filter(s => s.days_overdue === 0);
    
    return { paid, unpaid, overdue, upcoming };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
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

  const { paid, unpaid, overdue, upcoming } = getSchedulesByStatus();

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Overdue Payments ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-medium text-red-900">{schedule.unit_name}</p>
                      <p className="text-sm text-red-700">{schedule.property_name}</p>
                    </div>
                    <Badge variant="destructive">
                      {schedule.days_overdue} days overdue
                    </Badge>
                  </div>
                  <p className="text-xs text-red-600">
                    Due: {new Date(schedule.due_date).toLocaleDateString()} • 
                    Period: {new Date(schedule.period_start).toLocaleDateString()} - {new Date(schedule.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-900 text-lg">{formatCurrency(schedule.rent_amount)}</p>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handlePayNow(schedule)}
                    className="mt-2"
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Due Soon ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-medium text-yellow-900">{schedule.unit_name}</p>
                      <p className="text-sm text-yellow-700">{schedule.property_name}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {getPaymentStatus(schedule)}
                    </Badge>
                  </div>
                  <p className="text-xs text-yellow-600">
                    Due: {new Date(schedule.due_date).toLocaleDateString()} • 
                    Period: {new Date(schedule.period_start).toLocaleDateString()} - {new Date(schedule.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-900 text-lg">{formatCurrency(schedule.rent_amount)}</p>
                  <Button 
                    size="sm"
                    onClick={() => handlePayNow(schedule)}
                    className="mt-2"
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Rent Schedules
            </CardTitle>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">
                {paid.length} paid • {unpaid.length} pending
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rentSchedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No rent schedules found</p>
              <p className="text-sm">Your rent payment schedule will appear here once set up by your landlord</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rentSchedules.map((schedule) => {
                const status = getPaymentStatus(schedule);
                const isPaid = schedule.is_paid;
                const isOverdue = schedule.days_overdue > 0;
                
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className="font-medium">{schedule.unit_name}</p>
                          <p className="text-sm text-muted-foreground">{schedule.property_name}</p>
                        </div>
                        <Badge className={getStatusColor(schedule)}>
                          {status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(schedule.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          <span>
                            Period: {new Date(schedule.period_start).toLocaleDateString()} - {new Date(schedule.period_end).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(schedule.rent_amount)}</p>
                      
                      {isPaid ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 mt-2">
                          ✓ Paid
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handlePayNow(schedule)}
                          className="mt-2"
                          variant={isOverdue ? "destructive" : "default"}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {rentSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{paid.length}</p>
                <p className="text-sm text-green-700">Paid</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{upcoming.length}</p>
                <p className="text-sm text-yellow-700">Due Soon</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
                <p className="text-sm text-red-700">Overdue</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(paid.reduce((sum, s) => sum + s.rent_amount, 0))}
                </p>
                <p className="text-sm text-blue-700">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}