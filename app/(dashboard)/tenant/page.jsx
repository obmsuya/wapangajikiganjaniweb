// app/(dashboard)/tenant/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { Home, Calendar, History, User } from 'lucide-react';
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from '@/components/cloudflare/Breadcrumbs';
import TenantOverview       from '@/components/tenant/TenantOverview';
import TenantRentSchedule   from '@/components/tenant/TenantRentSchedule';
import TenantPaymentHistory from '@/components/tenant/TenantPaymentHistory';
import TenantPaymentDialog  from '@/components/tenant/TenantPaymentDialog';
import { useTenantDashboardStore } from '@/stores/tenant/useTenantDashboardStore';
import { useTenantPaymentStore }   from '@/stores/tenant/useTenantPaymentStore';

const TABS = [
  { id: 'overview', label: 'Overview',        icon: Home,     component: TenantOverview      },
  { id: 'schedule', label: 'Rent Schedule',    icon: Calendar, component: TenantRentSchedule  },
  { id: 'history',  label: 'Payment History',  icon: History,  component: TenantPaymentHistory },
];

const TAB_DESCRIPTIONS = {
  overview: 'Your rental overview and quick actions',
  schedule: 'View your rent payment schedule',
  history:  'Track all your payment history',
};

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient]   = useState(false);

  const { refreshData }                                       = useTenantDashboardStore();
  const { paymentFlow, resetPaymentFlow,
          setShowPaymentDialog, setSelectedUnit }             = useTenantPaymentStore();

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (paymentFlow === 'success') {
      setTimeout(() => {
        resetPaymentFlow();
        refreshData();
      }, 3000);
    }
  }, [paymentFlow, resetPaymentFlow, refreshData]);

  const handlePayNow = (unit = null) => {
    if (unit) setSelectedUnit(unit);
    setShowPaymentDialog(true);
  };

  const breadcrumbItems = [
    { label: 'Tenant Dashboard', icon: <User className="h-4 w-4" /> },
  ];

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component;
  const activeTabData   = TABS.find(t => t.id === activeTab);
  const ActiveIcon      = activeTabData?.icon;

  return (
    <div className="space-y-4">
      <CloudflareBreadcrumbs items={breadcrumbItems} />
      <CloudflarePageHeader
        title="Tenant Dashboard"
        description="Manage your rent payments and property information"
      />

      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Compact sidebar navigation ─────────────────────────────── */}
        <nav className="lg:w-48 flex-shrink-0">
          {/* Mobile: horizontal scrollable row */}
          {/* Desktop: vertical list */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible
                          pb-1 lg:pb-0 rounded-lg border bg-card p-2">
            {TABS.map((tab) => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium
                    transition-all whitespace-nowrap flex-shrink-0
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  `}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Content area ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border bg-card">
            {/* Tab header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              {ActiveIcon && (
                <div className="p-2 rounded-lg bg-primary/10">
                  <ActiveIcon className="h-4 w-4 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold">{activeTabData?.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {TAB_DESCRIPTIONS[activeTab]}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {isClient && ActiveComponent && (
                <ActiveComponent onPayNow={handlePayNow} />
              )}
            </div>
          </div>
        </div>
      </div>

      <TenantPaymentDialog />
    </div>
  );
}