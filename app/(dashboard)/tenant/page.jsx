// app/(dashboard)/tenant/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { Home, Calendar, History, User } from 'lucide-react';
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from '@/components/cloudflare/Breadcrumbs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import TenantOverview from '@/components/tenant/TenantOverview';
import TenantRentSchedule from '@/components/tenant/TenantRentSchedule';
import TenantPaymentHistory from '@/components/tenant/TenantPaymentHistory';
import TenantPaymentDialog from '@/components/tenant/TenantPaymentDialog';
import { useTenantDashboardStore } from '@/stores/tenant/useTenantDashboardStore';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home, component: TenantOverview },
  { id: 'schedule', label: 'Rent Schedule', icon: Calendar, component: TenantRentSchedule },
  { id: 'history', label: 'Payment History', icon: History, component: TenantPaymentHistory },
];

const TAB_DESCRIPTIONS = {
  overview: 'Your rental overview and quick actions',
  schedule: 'View your rent payment schedule',
  history: 'Track all your payment history',
};

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  const { refreshData } = useTenantDashboardStore();
  const { paymentFlow, resetPaymentFlow,
    setShowPaymentDialog, setSelectedUnit } = useTenantPaymentStore();

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
  const activeTabData = TABS.find(t => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon;

  return (
    <div className="space-y-3">
      <CloudflareBreadcrumbs items={breadcrumbItems} />
      <CloudflarePageHeader
        title="Tenant Dashboard"
        description="Manage your rent payments and property information"
      />

      {/* ── Icon-only tab bar — sits above content, takes no column space ── */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1 border-b pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-t-md
                      transition-colors
                      ${isActive
                        ? 'text-primary bg-primary/8 border border-b-0 border-border -mb-px'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                    `}
                    aria-label={tab.label}
                  >
                    <Icon className="h-4 w-4" />
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tab.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* ── Content — full width, no sidebar ──────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {/* Subtle active tab context line */}
        <div className="flex items-center gap-2 px-5 py-3 border-b">
          {ActiveIcon && <ActiveIcon className="h-4 w-4 text-primary" />}
          <span className="text-sm font-medium">{activeTabData?.label}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — {TAB_DESCRIPTIONS[activeTab]}
          </span>
        </div>

        <div className="p-5">
          {isClient && ActiveComponent && (
            <ActiveComponent onPayNow={handlePayNow} />
          )}
        </div>
      </div>

      <TenantPaymentDialog />
    </div>
  );
}