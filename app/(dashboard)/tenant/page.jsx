"use client";

import { useState, useEffect } from 'react';
import { Home, Calendar, CreditCard, History, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  CloudflareBreadcrumbs, 
  CloudflarePageHeader 
} from '@/components/cloudflare/Breadcrumbs';
import TenantOverview from '@/components/tenant/TenantOverview';
import TenantRentSchedule from '@/components/tenant/TenantRentSchedule';
import TenantPaymentFlow from '@/components/tenant/TenantPaymentFlow';
import TenantPaymentHistory from '@/components/tenant/TenantPaymentHistory';
import TenantPaymentDialog from '@/components/tenant/TenantPaymentDialog';
import { useTenantDashboardStore } from '@/stores/tenant/useTenantDashboardStore';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { refreshData } = useTenantDashboardStore();
  const { paymentFlow, resetPaymentFlow, showPaymentDialog } = useTenantPaymentStore();

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (paymentFlow === 'success') {
      setTimeout(() => {
        setShowPaymentSheet(false);
        resetPaymentFlow();
        refreshData();
      }, 3000);
    }
  }, [paymentFlow, resetPaymentFlow, refreshData]);

  const handlePayNow = () => {
    setShowPaymentSheet(true);
  };

  const breadcrumbItems = [
    { 
      label: 'Tenant Dashboard', 
      icon: <User className="h-4 w-4" /> 
    }
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      component: TenantOverview
    },
    {
      id: 'schedule',
      label: 'Rent Schedule',
      icon: Calendar,
      component: TenantRentSchedule
    },
    {
      id: 'history',
      label: 'Payment History',
      icon: History,
      component: TenantPaymentHistory
    }
  ];

  const renderTabButton = (tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          relative flex flex-col items-center justify-center p-4 rounded-full transition-all duration-200
          ${isActive 
            ? 'bg-blue-600 text-white shadow-lg scale-105' 
            : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 shadow-sm border border-gray-200'
          }
          min-w-[80px] h-20
        `}
      >
        <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-white' : 'text-current'}`} />
        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-current'}`}>
          {tab.label}
        </span>
        {isActive && (
          <div className="absolute -bottom-2 w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </button>
    );
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Tenant Dashboard"
        description="Manage your rent payments and property information"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-6 bg-white border-gray-200">
            <h3 className="text-lg font-semibold mb-6 text-center">Navigation</h3>
            <div className="flex lg:flex-col gap-4 justify-center lg:justify-start">
              {tabs.map(renderTabButton)}
            </div>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="min-h-[600px] bg-white border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                {(() => {
                  const activeTabData = tabs.find(tab => tab.id === activeTab);
                  const Icon = activeTabData?.icon;
                  return (
                    <>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{activeTabData?.label}</h2>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'overview' && 'Your rental overview and quick actions'}
                          {activeTab === 'schedule' && 'View and manage your rent payment schedule'}
                          {activeTab === 'history' && 'Track all your payment history'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {isClient && ActiveComponent && (
                <ActiveComponent onPayNow={handlePayNow} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-white border-gray-200">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Make Payment
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TenantPaymentFlow />
          </div>
        </SheetContent>
      </Sheet>

      <TenantPaymentDialog />
    </div>
  );
}