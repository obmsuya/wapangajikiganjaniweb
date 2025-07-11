// components/landlord/properties/tabs/PropertyPaymentsTab.jsx
"use client";

import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent, CloudflareStatCard } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";

export default function PropertyPaymentsTab({ property, floorData }) {
  // Placeholder data - will be connected when payment endpoints are ready
  const paymentStats = {
    totalExpected: 0,
    totalCollected: 0,
    outstanding: 0,
    overdue: 0,
    collectionRate: 0
  };

  const upcomingPayments = [];
  const recentPayments = [];
  const overduePayments = [];

  return (
    <div className="space-y-6">
      {/* Payment Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloudflareStatCard
          title="Expected Revenue"
          value={`TSh ${paymentStats.totalExpected.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Collected"
          value={`TSh ${paymentStats.totalCollected.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Outstanding"
          value={`TSh ${paymentStats.outstanding.toLocaleString()}`}
          icon={<Clock className="h-5 w-5" />}
        />
        <CloudflareStatCard
          title="Collection Rate"
          value={`${paymentStats.collectionRate}%`}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Payment Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Upcoming Payments" 
            actions={
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            }
          />
          <CloudflareCardContent>
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Payment Tracking Ready
                </h3>
                <p className="text-gray-500">
                  Payment tracking will be available when the payment system is connected.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Payment list will be rendered here */}
              </div>
            )}
          </CloudflareCardContent>
        </CloudflareCard>

        {/* Recent Payments */}
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Recent Payments" 
            actions={
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            }
          />
          <CloudflareCardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Payment History Ready
                </h3>
                <p className="text-gray-500">
                  Payment history will appear here once payments are processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Recent payments list will be rendered here */}
              </div>
            )}
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Overdue Payments Alert */}
      {overduePayments.length === 0 ? (
        <CloudflareCard>
          <CloudflareCardContent>
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Payment System Integration Pending
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  This tab is ready for payment system integration. Features will include:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 ml-4 list-disc">
                  <li>Real-time payment tracking</li>
                  <li>Automated rent collection</li>
                  <li>Payment reminders and notifications</li>
                  <li>Financial reports and analytics</li>
                  <li>Overdue payment management</li>
                </ul>
              </div>
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      ) : (
        <CloudflareCard>
          <CloudflareCardHeader 
            title="Overdue Payments" 
            actions={
              <Badge variant="destructive">
                {overduePayments.length} Overdue
              </Badge>
            }
          />
          <CloudflareCardContent>
            <div className="space-y-3">
              {/* Overdue payments list will be rendered here */}
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* Payment Actions */}
      <CloudflareCard>
        <CloudflareCardHeader title="Payment Actions" />
        <CloudflareCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" disabled>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Payment Report
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Send Payment Reminders
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export Payment Data
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Payment actions will be enabled when the payment system is connected.
          </p>
        </CloudflareCardContent>
      </CloudflareCard>
    </div>
  );
}