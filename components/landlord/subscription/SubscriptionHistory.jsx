"use client";

import { useEffect } from 'react';
import { Calendar, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';

export default function SubscriptionHistory() {
  const { 
    subscriptionHistory, 
    loading, 
    error, 
    fetchSubscriptionHistory, 
    formatCurrency,
    getSubscriptionStatusColor 
  } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscriptionHistory();
  }, [fetchSubscriptionHistory]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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
      <div>
        <h2 className="text-xl font-semibold mb-2">Subscription History</h2>
        <p className="text-gray-600">View all your past and current subscriptions</p>
      </div>

      {subscriptionHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription History</h3>
            <p className="text-gray-500">You haven't subscribed to any plans yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptionHistory.map((subscription) => (
            <Card key={subscription.id} className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(subscription.status)}
                      <h3 className="font-semibold text-lg">{subscription.planName}</h3>
                      <Badge className={getSubscriptionStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                      {subscription.isCurrent && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Plan Type</p>
                        <p className="font-medium capitalize">{subscription.planType}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Property Limit</p>
                        <p className="font-medium">
                          {subscription.propertyLimit === -1 ? 'Unlimited' : subscription.propertyLimit}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="font-medium">
                          {subscription.startDate ? 
                            new Date(subscription.startDate).toLocaleDateString() : 
                            '—'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-medium">
                          {subscription.endDate ? 
                            new Date(subscription.endDate).toLocaleDateString() : 
                            '—'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {formatCurrency(subscription.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(subscription.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}