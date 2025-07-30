import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

export const useTenantDashboardStore = create((set, get) => ({
  loading: false,
  error: null,
  occupancies: [],
  rentSchedules: [],
 
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchOccupancies: async () => {
    try {
      set({ loading: true, error: null });
     
      const response = await api.get('/api/v1/payments/rent/tenant/occupancy/');
     
      if (response.success) {
        const activeOccupancies = (response.occupancies || []).filter(occ =>
          occ.status === 'active'
        );
        
        const formattedOccupancies = activeOccupancies.map(occ => ({
          unit_id: occ.unit_id,
          unit_name: occ.unit_name,
          floor_number: occ.floor_number,
          property_id: occ.property_id,
          property_name: occ.property_name,
          rent_amount: parseFloat(occ.rent_amount || 0),
          payment_frequency: occ.payment_frequency,
          start_date: occ.start_date,
          status: occ.status,
          recent_payments: (occ.recent_payments || []).map(payment => ({
            id: payment.id,
            amount: parseFloat(payment.amount || 0),
            payment_period_start: payment.payment_period_start,
            payment_period_end: payment.payment_period_end,
            status: payment.status,
            created_at: payment.created_at
          }))
        }));
        
        set({
          occupancies: formattedOccupancies,
          loading: false
        });
      } else {
        throw new Error(response.error || 'Failed to load occupancies');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load occupancies';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Error", {
        description: errorMessage,
      });
    }
  },

  fetchRentSchedules: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
     
      const params = new URLSearchParams();
      if (filters.unitId) params.append('unit_id', filters.unitId);
      if (filters.paidOnly !== undefined) params.append('paid_only', filters.paidOnly);
      if (filters.overdueOnly !== undefined) params.append('overdue_only', filters.overdueOnly);
     
      const queryString = params.toString();
      const url = queryString
        ? `/api/v1/payments/rent/schedule/?${queryString}`
        : '/api/v1/payments/rent/schedule/';
     
      const response = await api.get(url);
     
      if (response.success) {
        const formattedSchedules = (response.schedules || []).map(schedule => ({
          id: schedule.id,
          property_name: schedule.property_name,
          unit_id: schedule.unit?.id || null,
          unit_name: schedule.unit_name,
          floor_number: schedule.floor_number,
          tenant_name: schedule.tenant_name,
          rent_amount: parseFloat(schedule.rent_amount || 0),
          due_date: schedule.due_date,
          period_start: schedule.period_start,
          period_end: schedule.period_end,
          is_paid: schedule.is_paid,
          days_overdue: schedule.days_overdue || 0,
          payment_id: schedule.payment_id
        }));
        
        set({
          rentSchedules: formattedSchedules,
          loading: false
        });
      } else {
        throw new Error(response.error || 'Failed to load rent schedules');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load rent schedules';
      set({
        error: errorMessage,
        loading: false
      });
      
      toast.error("Error", {
        description: errorMessage,
      });
    }
  },

  getUpcomingRent: () => {
    const { rentSchedules } = get();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
   
    return rentSchedules.filter(schedule => {
      if (schedule.is_paid) return false;
      
      const dueDate = new Date(schedule.due_date);
      return dueDate <= nextWeek && dueDate >= today;
    });
  },

  getOverdueRent: () => {
    const { rentSchedules } = get();
    return rentSchedules.filter(schedule =>
      !schedule.is_paid && schedule.days_overdue > 0
    );
  },

  getTotalMonthlyRent: () => {
    const { occupancies } = get();
    return occupancies.reduce((total, occ) => total + (occ.rent_amount || 0), 0);
  },

  getCurrentOccupancy: (unitId) => {
    const { occupancies } = get();
    return occupancies.find(occ => occ.unit_id === parseInt(unitId));
  },

  getUnitSchedules: (unitId) => {
    const { rentSchedules } = get();
    return rentSchedules.filter(schedule => schedule.unit_id === parseInt(unitId));
  },

  formatCurrency: (amount) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  getStatusColor: (schedule) => {
    if (schedule.is_paid) return 'bg-green-100 text-green-800 border-green-200';
    if (schedule.days_overdue > 0) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  },

  getPaymentStatus: (schedule) => {
    if (schedule.is_paid) return 'Paid';
    if (schedule.days_overdue > 0) return 'Overdue';
    
    const today = new Date();
    const dueDate = new Date(schedule.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 7 && daysUntilDue > 0) return 'Due Soon';
    if (daysUntilDue <= 0) return 'Due Today';
    return 'Upcoming';
  },

  getNextPaymentDue: () => {
    const { rentSchedules } = get();
    const unpaidSchedules = rentSchedules.filter(schedule => !schedule.is_paid);
    
    if (unpaidSchedules.length === 0) return null;
    
    return unpaidSchedules.reduce((earliest, current) => {
      const currentDue = new Date(current.due_date);
      const earliestDue = new Date(earliest.due_date);
      return currentDue < earliestDue ? current : earliest;
    });
  },

  refreshData: async () => {
    try {
      set({ loading: true });
      await Promise.all([
        get().fetchOccupancies(),
        get().fetchRentSchedules()
      ]);
    } catch (error) {
      toast.error("Refresh Failed", {
        description: "Failed to refresh dashboard data",
      });
    } finally {
      set({ loading: false });
    }
  },

  getOccupancyStats: () => {
    const { occupancies, rentSchedules } = get();
    const totalUnits = occupancies.length;
    const totalMonthlyRent = get().getTotalMonthlyRent();
    const overduePayments = get().getOverdueRent().length;
    const upcomingPayments = get().getUpcomingRent().length;
    
    return {
      totalUnits,
      totalMonthlyRent,
      overduePayments,
      upcomingPayments,
      hasActiveRentals: totalUnits > 0
    };
  }
}));