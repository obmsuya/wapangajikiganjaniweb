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
            currentBalance: parseFloat(response.wallet?.balance || 0),
            totalEarned: parseFloat(response.wallet?.total_earned || 0),
            totalWithdrawn: parseFloat(response.wallet?.total_withdrawn || 0),
            canWithdraw: response.wallet?.can_withdraw || false,
            minimumPayout: 1000,
          },
          referralStats: {
            totalReferrals: parseInt(response.referral_stats?.total_referrals || 0),
            activeReferrals: parseInt(response.referral_stats?.active_referrals || 0),
            payingReferrals: parseInt(response.referral_stats?.paying_referrals || 0),
            conversionRate: parseFloat(response.referral_stats?.conversion_rate || 0),
            thisMonthReferrals: parseInt(response.referral_stats?.total_referrals || 0),
          },
          recentActivity: (response.recent_transactions || []).map((txn) => ({
            id: txn.id,
            transactionType: txn.transaction_type,
            amount: parseFloat(txn.amount || 0),
            description: txn.description || "",
            landlordName: txn.landlord_name || "",
            subscriptionPlan: txn.subscription_plan || "",
            createdAt: txn.created_at,
          })),
        };

        set({ dashboardData: formattedData, loading: false });
      } else {
        throw new Error(response?.error || "Failed to load dashboard");
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Dashboard Error", { description: error.message });
    }
  },

  fetchPartnerInfo: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get("/api/v1/auth/partner/statistics/");

      if (response && !response.error && response.partner_info) {
        set({
          partnerInfo: {
            fullName: response.partner_info.full_name || "",
            referralCode: response.partner_info.referral_code || "N/A",
            isActive: response.partner_info.is_active || false,
            createdAt: response.partner_info.created_at || null,
          },
          loading: false,
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchReferrals: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get("/api/v1/payments/partner/earnings/referrals/");

      if (response && !response.error) {
        set({
          referralStats: {
            stats: {
              totalReferrals: parseInt(response.referral_stats?.total_referrals || 0),
              activeReferrals: parseInt(response.referral_stats?.active_referrals || 0),
              payingReferrals: parseInt(response.referral_stats?.paying_referrals || 0),
              conversionRate: parseFloat(response.referral_stats?.conversion_rate || 0),
              totalCommissionEarned: parseFloat(response.referral_stats?.total_commission_earned || 0),
            },
            recentReferrals: (response.recent_referrals || []).map((ref) => ({
              landlordName: ref.landlord_name,
              landlordPhone: ref.landlord_phone,
              referralDate: ref.referral_date,
              isPaying: ref.is_paying || false,
            })),
          },
          loading: false,
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEarnings: async (filters = {}) => {
    try {
      set({ loading: true, error: null });

      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const url = params.toString()
        ? `/api/v1/payments/partner/earnings/summary/?${params.toString()}`
        : "/api/v1/payments/partner/earnings/summary/";

      const response = await api.get(url);

      if (response && !response.error) {
        set({
          earningsData: {
            walletSummary: {
              currentBalance: parseFloat(response.wallet_summary?.current_balance || 0),
              totalEarned: parseFloat(response.wallet_summary?.total_earned || 0),
              totalWithdrawn: parseFloat(response.wallet_summary?.total_withdrawn || 0),
              canRequestPayout: response.wallet_summary?.can_request_payout || false,
            },
            periodSummary: {
              totalEarnings: parseFloat(response.period_summary?.total_earnings || 0),
              transactionCount: parseInt(response.period_summary?.transaction_count || 0),
              averageCommission: parseFloat(response.period_summary?.average_commission || 0),
            },
            recentTransactions: (response.recent_transactions || []).map((txn) => ({
              id: txn.id,
              amount: parseFloat(txn.amount || 0),
              commissionRate: parseFloat(txn.commission_rate || 0),
              description: txn.description || "",
              landlordName: txn.landlord_name || "",
              subscriptionPlan: txn.subscription_plan || "",
              createdAt: txn.created_at,
            })),
          },
          loading: false,
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  requestPayout: async (amount, phoneNumber) => {
    try {
      set({ loading: true, error: null });

      const response = await api.post("/api/v1/payments/partner/payout/request/", {
        amount: parseFloat(amount),
        phone_number: phoneNumber,
      });

      if (response && !response.error) {
        toast.success("Payout Requested", {
          description: `Payout of ${get().formatCurrency(amount)} requested successfully`,
        });

        set({ showPayoutDialog: false, loading: false });
        await get().fetchPayoutHistory();
        await get().fetchDashboard();

        return { success: true, data: response };
      } else {
        throw new Error(response?.error || "Failed to request payout");
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Payout Failed", { description: error.message });
      return { success: false, error: error.message };
    }
  },

  fetchPayoutHistory: async (limit = 20) => {
    try {
      set({ loading: true, error: null });

      const response = await api.get(`/api/v1/payments/partner/payout/history/?limit=${limit}`);

      if (response && !response.error) {
        set({
          payoutHistory: (response.disbursements || []).map((payout) => ({
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
          })),
          loading: false,
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  checkPayoutEligibility: async () => {
    try {
      const response = await api.get("/api/v1/payments/partner/payout/eligibility/");

      if (response && !response.error) {
        const eligibility = {
          canPayout: response.can_payout || false,
          reason: response.reason || "",
          availableAmount: parseFloat(response.available_amount || 0),
          minimumPayout: 1000,
          currentBalance: parseFloat(response.current_balance || 0),
          shortfall: parseFloat(response.shortfall || 0),
        };

        set({ payoutEligibility: eligibility });
        return eligibility;
      }
    } catch (error) {
      set({ error: error.message });
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
      toast.error("Refresh Failed");
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

    return {
      balance: dashboardData.walletSummary.currentBalance,
      totalEarned: dashboardData.walletSummary.totalEarned,
      totalReferrals: dashboardData.referralStats.totalReferrals,
      payingReferrals: dashboardData.referralStats.payingReferrals,
      conversionRate: dashboardData.referralStats.conversionRate,
      canWithdraw: dashboardData.walletSummary.canWithdraw,
    };
  },
}));