// stores/partner/usePartnerStore.js
import { create } from "zustand";
import api from "@/lib/api/api-client";
import { toast } from "sonner";

export const usePartnerStore = create((set, get) => ({
  loading: false,
  error: null,
  dashboardData: null,
  referralStats: null,
  earningsData: null,
  partnerInfo: null,
  payoutHistory: [],
  activeTab: "overview",
  showPayoutDialog: false,
  payoutEligibility: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowPayoutDialog: (show) => set({ showPayoutDialog: show }),

  fetchDashboard: async () => {
    try {
      set({ loading: true, error: null });

      const response = await api.get("/api/v1/payments/partner/dashboard/");

      if (response && !response.error) {
        const formattedData = {
          walletSummary: {
            currentBalance: parseFloat(
              response.wallet_summary?.current_balance || 0
            ),
            totalEarned: parseFloat(response.wallet_summary?.total_earned || 0),
            totalWithdrawn: parseFloat(
              response.wallet_summary?.total_withdrawn || 0
            ),
            canWithdraw: response.wallet_summary?.can_withdraw || false,
            minimumPayout: parseFloat(
              response.wallet_summary?.minimum_payout || 5000
            ),
          },
          referralStats: {
            totalReferrals: parseInt(
              response.referral_stats?.total_referrals || 0
            ),
            payingReferrals: parseInt(
              response.referral_stats?.paying_referrals || 0
            ),
            conversionRate: parseFloat(
              response.referral_stats?.conversion_rate || 0
            ),
            thisMonthReferrals: parseInt(
              response.referral_stats?.this_month_referrals || 0
            ),
          },
          recentActivity: (response.recent_activity || []).map((activity) => ({
            id: activity.id,
            transactionType: activity.transaction_type,
            amount: parseFloat(activity.amount || 0),
            description: activity.description || "",
            landlordName: activity.landlord_name || "",
            subscriptionPlan: activity.subscription_plan || "",
            createdAt: activity.created_at,
          })),
        };

        set({
          dashboardData: formattedData,
          loading: false,
        });
      } else {
        throw new Error(response?.error || "Failed to load dashboard");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to load dashboard";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Dashboard Error", {
        description: errorMessage,
      });
    }
  },

  fetchPartnerInfo: async () => {
    try {
      set({ loading: true, error: null });

      const response = await api.get("/api/v1/auth/partner/statistics/");

      if (response && !response.error && response.partner_info) {
        const formattedPartnerInfo = {
          fullName: response.partner_info.full_name || "",
          referralCode: response.partner_info.referral_code || "N/A",
          isActive: response.partner_info.is_active || false,
          createdAt: response.partner_info.created_at || null,
        };

        set({
          partnerInfo: formattedPartnerInfo,
          loading: false,
        });
      } else {
        throw new Error(response?.error || "Failed to load partner info");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to load partner info";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Partner Info Error", {
        description: errorMessage,
      });
    }
  },

  fetchReferrals: async () => {
    try {
      set({ loading: true, error: null });

      const response = await api.get(
        "/api/v1/payments/partner/earnings/referrals/"
      );

      if (response && !response.error) {
        const formattedStats = {
          stats: {
            totalReferrals: parseInt(
              response.referral_stats?.total_referrals || 0
            ),
            activeReferrals: parseInt(
              response.referral_stats?.active_referrals || 0
            ),
            payingReferrals: parseInt(
              response.referral_stats?.paying_referrals || 0
            ),
            conversionRate: parseFloat(
              response.referral_stats?.conversion_rate || 0
            ),
            totalCommissionEarned: parseFloat(
              response.referral_stats?.total_commission_earned || 0
            ),
          },
          recentReferrals: (response.recent_referrals || []).map(
            (referral) => ({
              landlordName: referral.landlord_name,
              landlordPhone: referral.landlord_phone,
              referralDate: referral.referral_date,
              isPaying: referral.is_paying || false,
            })
          ),
        };

        set({
          referralStats: formattedStats,
          loading: false,
        });
      } else {
        throw new Error(response?.error || "Failed to load referrals");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to load referrals";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Referrals Error", {
        description: errorMessage,
      });
    }
  },

  fetchEarnings: async (filters = {}) => {
    try {
      set({ loading: true, error: null });

      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const queryString = params.toString();
      const url = queryString
        ? `/api/v1/payments/partner/earnings/summary/?${queryString}`
        : "/api/v1/payments/partner/earnings/summary/";

      const response = await api.get(url);

      if (response && !response.error) {
        const formattedData = {
          walletSummary: {
            currentBalance: parseFloat(
              response.wallet_summary?.current_balance || 0
            ),
            totalEarned: parseFloat(response.wallet_summary?.total_earned || 0),
            totalWithdrawn: parseFloat(
              response.wallet_summary?.total_withdrawn || 0
            ),
            canRequestPayout:
              response.wallet_summary?.can_request_payout || false,
          },
          periodSummary: {
            totalEarnings: parseFloat(
              response.period_summary?.total_earnings || 0
            ),
            transactionCount: parseInt(
              response.period_summary?.transaction_count || 0
            ),
            averageCommission: parseFloat(
              response.period_summary?.average_commission || 0
            ),
          },
          recentTransactions: (response.recent_transactions || []).map(
            (transaction) => ({
              id: transaction.id,
              amount: parseFloat(transaction.amount || 0),
              commissionRate: parseFloat(transaction.commission_rate || 0),
              description: transaction.description || "",
              landlordName: transaction.landlord_name || "",
              subscriptionPlan: transaction.subscription_plan || "",
              createdAt: transaction.created_at,
            })
          ),
        };

        set({
          earningsData: formattedData,
          loading: false,
        });
      } else {
        throw new Error(response?.error || "Failed to load earnings");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to load earnings";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Earnings Error", {
        description: errorMessage,
      });
    }
  },

  requestPayout: async (amount, phoneNumber) => {
    try {
      set({ loading: true, error: null });

      const response = await api.post(
        "/api/v1/payments/partner/payout/request/",
        {
          amount: parseFloat(amount),
          phone_number: phoneNumber,
        }
      );

      if (response && !response.error) {
        toast.success("Payout Requested", {
          description: `Payout of ${get().formatCurrency(
            amount
          )} requested successfully`,
        });

        set({
          showPayoutDialog: false,
          loading: false,
        });

        await get().fetchPayoutHistory();
        await get().fetchDashboard();

        return { success: true, data: response };
      } else {
        throw new Error(response?.error || "Failed to request payout");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to request payout";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Payout Failed", {
        description: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  fetchPayoutHistory: async (limit = 20) => {
    try {
      set({ loading: true, error: null });

      const response = await api.get(
        `/api/v1/payments/partner/payout/history/?limit=${limit}`
      );

      if (response && !response.error) {
        const formattedHistory = (response.disbursements || []).map(
          (payout) => ({
            id: payout.id,
            amount: parseFloat(payout.amount || 0),
            phoneNumber: payout.phone_number || "",
            status: payout.status || "pending",
            statusDisplay: payout.status_display || payout.status,
            externalReferenceId: payout.external_reference_id || "",
            failureReason: payout.failure_reason || "",
            requestedAt: payout.requested_at,
            processedAt: payout.processed_at,
            completedAt: payout.completed_at,
          })
        );

        set({
          payoutHistory: formattedHistory,
          loading: false,
        });
      } else {
        throw new Error(response?.error || "Failed to load payout history");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to load payout history";
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error("Payout History Error", {
        description: errorMessage,
      });
    }
  },

  checkPayoutEligibility: async () => {
    try {
      const response = await api.get(
        "/api/v1/payments/partner/payout/eligibility/"
      );

      if (response && !response.error) {
        const eligibility = {
          canPayout: response.can_payout || false,
          reason: response.reason || "",
          availableAmount: parseFloat(response.available_amount || 0),
          minimumPayout: parseFloat(response.minimum_payout || 5000),
          currentBalance: parseFloat(response.current_balance || 0),
          shortfall: parseFloat(response.shortfall || 0),
        };

        set({ payoutEligibility: eligibility });
        return eligibility;
      } else {
        throw new Error(response?.error || "Failed to check eligibility");
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to check payout eligibility";
      set({ error: errorMessage });
      return null;
    }
  },

  refreshData: async () => {
    try {
      set({ loading: true });
      const { activeTab } = get();

      if (activeTab === "overview") {
        await get().fetchDashboard();
      } else if (activeTab === "referrals") {
        await get().fetchReferrals();
      } else if (activeTab === "earnings") {
        await get().fetchEarnings();
        await get().fetchPayoutHistory();
      }
    } catch (error) {
      toast.error("Refresh Failed", {
        description: "Failed to refresh data",
      });
    } finally {
      set({ loading: false });
    }
  },

  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return "TZS 0";
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  getConversionRateColor: (rate) => {
    if (rate >= 70) return "text-green-600";
    if (rate >= 40) return "text-yellow-600";
    return "text-red-600";
  },

  getPayoutStatusColor: (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || colors.pending;
  },

  getBalanceStatus: () => {
    const { dashboardData } = get();
    if (!dashboardData) return { canWithdraw: false, message: "Loading..." };

    const balance = dashboardData.walletSummary.currentBalance;
    const minimum = dashboardData.walletSummary.minimumPayout;

    if (balance >= minimum) {
      return {
        canWithdraw: true,
        message: `Available for withdrawal: ${get().formatCurrency(balance)}`,
      };
    } else {
      const shortfall = minimum - balance;
      return {
        canWithdraw: false,
        message: `Need ${get().formatCurrency(shortfall)} more to withdraw`,
      };
    }
  },

  getDashboardStats: () => {
    const { dashboardData } = get();
    if (!dashboardData) return null;

    const { walletSummary, referralStats } = dashboardData;

    return {
      balance: walletSummary.currentBalance,
      totalEarned: walletSummary.totalEarned,
      totalReferrals: referralStats.totalReferrals,
      payingReferrals: referralStats.payingReferrals,
      conversionRate: referralStats.conversionRate,
      canWithdraw: walletSummary.canWithdraw,
    };
  },
}));
