// services/landlord/tenant.js
import api from "@/lib/api/api-client";

const TenantService = {

  // ── read ────────────────────────────────────────────────────────────────────

  getPropertyTenants: async (propertyId) => {
    if (!propertyId) throw new Error("Property ID is required");
    return api.get(`/api/v1/tenants/property/${propertyId}/tenants/`);
  },

  getFloorTenants: async (propertyId, floorNumber) => {
    if (!propertyId || !floorNumber) throw new Error("Property ID and floor number are required");
    return api.get(`/api/v1/tenants/property/${propertyId}/floor/${floorNumber}/tenants/`);
  },

  getTenantDetails: async (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.get(`/api/v1/tenants/list/${tenantId}/`);
  },

  getTenantHistory: async (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.get(`/api/v1/tenants/tenants/${tenantId}/occupancy-history/`);
  },

  checkUnitTenant: async (unitId) => {
    if (!unitId) throw new Error("Unit ID is required");
    return api.get(`/api/v1/tenants/tenant-unit/${unitId}/`);
  },

  getRentDue: () => api.get("/api/v1/tenants/rent/due/"),
  getLandlordInfo: () => api.get("/api/v1/tenants/landlord/info/"),
  getPaymentHistory: () => api.get("/api/v1/tenants/payment/history/"),

  // ── assign new tenant ───────────────────────────────────────────────────────

  assignTenantToUnit: async (data) => {
    return api.post("/api/v1/tenants/assign-tenant/", data);
  },

  // ── existing tenant — register (POST) ──────────────────────────────────────
  // Backend: register_existing_tenant  →  POST /api/v1/tenants/register-existing/

  registerExistingTenant: async (data) => {
    return api.post("/api/v1/tenants/register-existing-tenant/", data);
  },

  // ── existing tenant — update (PATCH) ───────────────────────────────────────
  // Backend: update_existing_tenant  →  PATCH /api/v1/tenants/existing/<occupancy_id>/update/
  // Fields allowed: rent_amount, payment_frequency, original_move_in_date, last_payment_amount

  updateExistingTenant: async (occupancyId, data) => {
    if (!occupancyId) throw new Error("Occupancy ID is required");
    return api.patch(`/api/v1/tenants/existing/${occupancyId}/update/`, data);
  },

  // ── mutations ───────────────────────────────────────────────────────────────

  vacateTenant: async (tenantId, data = {}) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.post(`/api/v1/tenants/${tenantId}/vacate/`, data);
  },

  sendTenantReminder: async (tenantId, data = {}) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.post(`/api/v1/tenants/${tenantId}/send-reminder/`, data);
  },

  updateTenant: async (tenantId, data) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.put(`/api/v1/tenants/list/${tenantId}/`, data);
  },

  deleteTenant: async (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID is required");
    return api.delete(`/api/v1/tenants/list/${tenantId}/`);
  },

  searchTenants: async (q) => {
    return api.get(`/api/v1/tenants/list/?search=${encodeURIComponent(q)}`);
  },

  // ── validation ──────────────────────────────────────────────────────────────

  validateTenantAssignment: (data) => {
    const errors = [];
    if (!data.unit_id) errors.push("Unit selection is required");
    if (!data.full_name?.trim()) errors.push("Tenant name is required");
    if (!data.phone_number?.trim()) errors.push("Phone number is required");
    if (!data.rent_amount || data.rent_amount <= 0) errors.push("Rent amount is required");
    if (!data.payment_frequency) errors.push("Payment schedule is required");
    return { isValid: errors.length === 0, errors };
  },

  // ── display helpers ─────────────────────────────────────────────────────────

  formatTenantForDisplay: (t) => ({
    id: t.id,
    tenant: t.tenant,                              // keep full nested object
    name: t.tenant?.full_name || t.full_name || "No Name",
    phone: t.tenant?.phone_number || t.phone_number || "No Phone",
    status: t.tenant?.status || t.status || "active",
    unit_id: t.unit_id || null,
    unit_name: t.unit_name || "No Unit",
    unit_svg_id: t.unit_svg_id || null,
    floor_number: t.floor_number || 1,
    floor_name: t.floor_name || `Floor ${t.floor_number || 1}`,
    rent_amount: t.rent_amount || 0,
    payment_frequency: t.payment_frequency || "1",
    move_in_date: t.move_in_date || t.tenant?.move_in_date || null,
    next_payment_date: t.next_payment_date || null,
    occupancy_id: t.occupancy_id || null,
    occupancy_status: t.occupancy_status || null,
    payment_status: t.payment_status || null,      
    payment_details: t.payment_details || null,
  }),

};

export default TenantService;