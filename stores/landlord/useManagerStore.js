// stores/landlord/useManagerStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';
import { toast } from 'sonner';

const BASE = '/api/v1/auth/managers';

const classifyError = (error) => {
  if (!error) return 'Something went wrong';
  const msg = error?.response?.data?.error
    || error?.response?.data?.detail
    || error?.message
    || 'Something went wrong';
  return msg;
};

export const useManagerStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  managers: [],           // all managers for this landlord
  propertyManagers: {},   // { [propertyId]: Manager[] }
  loading: false,
  actionLoading: false,   // for create / update / delete actions
  error: null,

  // ── Helpers ──────────────────────────────────────────────────────────────
  setLoading: (v) => set({ loading: v }),
  setError: (v) => set({ error: v }),
  clearError: () => set({ error: null }),

  // ── Fetch all managers for the landlord ──────────────────────────────────
  fetchManagers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get(`${BASE}/`);
      set({ managers: data, loading: false });
    } catch (err) {
      const msg = classifyError(err);
      set({ loading: false, error: msg });
      toast.error('Failed to load managers', { description: msg });
    }
  },

  // ── Fetch managers for a specific property ───────────────────────────────
  fetchPropertyManagers: async (propertyId) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get(`${BASE}/property/${propertyId}/`);
      set((state) => ({
        propertyManagers: { ...state.propertyManagers, [propertyId]: data.managers || [] },
        loading: false,
      }));
    } catch (err) {
      const msg = classifyError(err);
      set({ loading: false, error: msg });
      toast.error('Failed to load property managers', { description: msg });
    }
  },

  // ── Assign manager to a property (new or existing) ───────────────────────
  // payload: { property_id, phone_number, full_name, email? }  — new manager
  // payload: { property_id, manager_id }                       — existing manager
  assignManager: async (payload) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await api.post(`${BASE}/assign/`, payload);

      // Refresh property managers list
      await get().fetchPropertyManagers(payload.property_id);

      toast.success('Manager assigned', {
        description: data.message || 'Manager has been assigned to the property.',
      });

      if (data.temp_password && !data.sms_sent) {
        toast.info('SMS not delivered', {
          description: `Share this password manually: ${data.temp_password}`,
          duration: 10000,
        });
      }

      set({ actionLoading: false });
      return { success: true, data };
    } catch (err) {
      const msg = classifyError(err);
      set({ actionLoading: false, error: msg });
      toast.error('Failed to assign manager', { description: msg });
      return { success: false, error: msg };
    }
  },

  // ── Update manager permissions ───────────────────────────────────────────
  // fields: can_create_tenants | can_collect_payments | can_manage_maintenance | is_active
  updateManager: async (managerId, fields, propertyId = null) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await api.patch(`${BASE}/${managerId}/`, fields);

      // Update in managers list
      set((state) => ({
        managers: state.managers.map((m) => (m.id === managerId ? data.manager : m)),
      }));

      // Update in propertyManagers if we know which property
      if (propertyId) {
        set((state) => ({
          propertyManagers: {
            ...state.propertyManagers,
            [propertyId]: (state.propertyManagers[propertyId] || []).map((m) =>
              m.id === managerId ? data.manager : m
            ),
          },
        }));
      }

      toast.success('Manager updated', { description: data.message || 'Changes saved.' });
      set({ actionLoading: false });
      return { success: true };
    } catch (err) {
      const msg = classifyError(err);
      set({ actionLoading: false, error: msg });
      toast.error('Update failed', { description: msg });
      return { success: false, error: msg };
    }
  },

  // ── Remove manager from a single property ────────────────────────────────
  removeFromProperty: async (managerId, propertyId) => {
    set({ actionLoading: true, error: null });
    try {
      const data = await api.delete(`${BASE}/${managerId}/property/${propertyId}/remove/`);

      set((state) => ({
        propertyManagers: {
          ...state.propertyManagers,
          [propertyId]: (state.propertyManagers[propertyId] || []).filter(
            (m) => m.id !== managerId
          ),
        },
        actionLoading: false,
      }));

      toast.success('Manager removed', { description: data.message || 'Removed from property.' });
      return { success: true };
    } catch (err) {
      const msg = classifyError(err);
      set({ actionLoading: false, error: msg });
      toast.error('Remove failed', { description: msg });
      return { success: false, error: msg };
    }
  },

  // ── Delete manager entirely ──────────────────────────────────────────────
  deleteManager: async (managerId) => {
    set({ actionLoading: true, error: null });
    try {
      await api.delete(`${BASE}/${managerId}/delete/`);

      set((state) => {
        // Remove from flat list
        const managers = state.managers.filter((m) => m.id !== managerId);

        // Remove from all property buckets
        const propertyManagers = Object.fromEntries(
          Object.entries(state.propertyManagers).map(([pid, list]) => [
            pid,
            list.filter((m) => m.id !== managerId),
          ])
        );

        return { managers, propertyManagers, actionLoading: false };
      });

      toast.success('Manager deleted', { description: 'Manager account has been removed.' });
      return { success: true };
    } catch (err) {
      const msg = classifyError(err);
      set({ actionLoading: false, error: msg });
      toast.error('Delete failed', { description: msg });
      return { success: false, error: msg };
    }
  },

  reset: () =>
    set({ managers: [], propertyManagers: {}, loading: false, actionLoading: false, error: null }),
}));