"use client";

import { useState, useEffect } from 'react';
import { Home, Users, Wallet, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  CloudflareBreadcrumbs, 
  CloudflarePageHeader 
} from '@/components/cloudflare/Breadcrumbs';
import PartnerOverview from '@/components/partner/PartnerOverview';
import PartnerReferrals from '@/components/partner/PartnerReferrals';
import PartnerEarningsPayouts from '@/components/partner/PartnerEarningsPayout';
import PartnerPayoutDialog from '@/components/partner/PartnerPayoutDialog';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  const { refreshData, setActiveTab: setStoreActiveTab } = usePartnerStore();

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setStoreActiveTab(activeTab);
  }, [activeTab, setStoreActiveTab]);

  const handlePayoutRequest = () => {
    // This will be handled by the payout dialog component
  };

  const breadcrumbItems = [
    { 
      label: 'Partner Dashboard', 
      icon: <User className="h-4 w-4" /> 
    }
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      component: PartnerOverview
    },
    {
      id: 'referrals',
      label: 'My Referrals',
      icon: Users,
      component: PartnerReferrals
    },
    {
      id: 'earnings',
      label: 'Earnings & Payouts',
      icon: Wallet,
      component: PartnerEarningsPayouts
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
          relative flex flex-col items-center justify-center p-4 rounded-lg
          ${isActive 
            ? 'bg-blue-600 text-white shadow-sm' 
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
          <div className="absolute -bottom-1 w-8 h-1 bg-blue-600 rounded-full" />
        )}
      </button>
    );
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Partner Dashboard"
        description="Manage your referrals, track earnings, and request payouts"
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
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{activeTabData?.label}</h2>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'overview' && 'Your partner overview and quick stats'}
                          {activeTab === 'referrals' && 'View and manage your referred landlords'}
                          {activeTab === 'earnings' && 'Track earnings and manage payouts'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {isClient && ActiveComponent && (
                <ActiveComponent onRequestPayout={handlePayoutRequest} />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payout Dialog */}
      <PartnerPayoutDialog />
    </div>
  );
}