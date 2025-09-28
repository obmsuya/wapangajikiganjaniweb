"use client";

import React, { useEffect } from 'react';
import { Download, Users, Activity, ShieldAlert, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CloudflarePageHeader } from '@/components/cloudflare/Breadcrumbs';
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from '@/components/cloudflare/Card';
import { useAdminStore } from '@/stores/admin/adminStore';
import { Bar } from 'react-chartjs-2'; 
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AdminDashboardPage() {
  /* ---------- store ---------- */
  const { loading, error, dashboard, fetchDashboard } = useAdminStore();

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ---------- derived data ---------- */
  const totalUsers = dashboard?.total_users ?? 0;
  const activeUsers = dashboard?.active_users ?? 0;
  const pendingUsers = dashboard?.pending_users ?? 0;
  const last7Days = dashboard?.last_7_days_signups ?? [0, 0, 0, 0, 0, 0, 0];

  /* ---------- chart ---------- */
  const chartData = {
    labels: ['Day -6', '-5', '-4', '-3', '-2', 'Yesterday', 'Today'],
    datasets: [
      {
        label: 'New sign-ups',
        data: last7Days,
        backgroundColor: '#0ea5e9', // sky-500
      },
    ],
  };

  /* ---------- ui helpers ---------- */
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard' },
  ];

  const pageActions = (
    <>
      <Button variant="outline" size="sm" className="flex items-center">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </>
  );

  /* ---------- render ---------- */
  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <CloudflarePageHeader
        title="Admin Dashboard"
        description="Live overview of user metrics"
        breadcrumbs={breadcrumbItems}
        actions={pageActions}
      />

      {error && (
        <CloudflareCard className="mb-6 border-red-200 bg-red-50">
          <CloudflareCardContent>
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* ---------- summary cards ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users />} label="Total users" value={totalUsers} loading={loading} />
        <MetricCard icon={<Activity />} label="Active users" value={activeUsers} loading={loading} />
        <MetricCard icon={<TrendingUp />} label="Pending invites" value={pendingUsers} loading={loading} />
        <MetricCard icon={<Activity />} label="Sign-ups (7d)" value={last7Days.reduce((a, b) => a + b, 0)} loading={loading} />
      </div>

      {/* ---------- mini chart ---------- */}
      <CloudflareCard>
        <CloudflareCardHeader title="Sign-ups last 7 days" />
        <CloudflareCardContent>
          <div className="h-64">
            <Bar data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </CloudflareCardContent>
      </CloudflareCard>
    </div>
  );
}

/* ---------- tiny reusable card ---------- */
function MetricCard({ icon, label, value, loading }) {
  return (
    <CloudflareCard>
      <CloudflareCardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold mt-1">{loading ? '…' : value}</p>
          </div>
          <div className="text-blue-600">{icon}</div>
        </div>
      </CloudflareCardContent>
    </CloudflareCard>
  );
}