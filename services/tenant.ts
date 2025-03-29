/**
 * Tenant management service for admin dashboard
 * Provides functionality for managing tenants, occupancies, documents, and generating tenant reports
 */
import { api } from '@/lib/api';

// Type definitions for tenant-related data
export interface Tenant {
    id: number;
    full_name: string;
    phone_number: string;
    alternative_phone?: string;
    email?: string;
    dob?: string;
    id_type: string;
    id_number: string;
    id_image?: string;
    profile_image?: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    occupation?: string;
    employer_name?: string;
    employer_contact?: string;
    status: 'active' | 'pending' | 'former' | 'blacklisted';
    language: 'en' | 'sw';
    preferred_contact_method: 'sms' | 'email' | 'call';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deactivated_at?: string;
    deactivation_reason?: string;
    active_occupancy_count: number;
    document_count: number;
    date_joined: string;
  }
  
  export interface TenantOccupancy {
    id: number;
    tenant: number;
    tenant_name: string;
    unit: number;
    unit_number: string;
    property: number;
    property_name: string;
    start_date: string;
    end_date?: string;
    rent_amount: number;
    deposit_amount: number;
    key_deposit: number;
    utilities_included: Record<string, number>;
    payment_frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'custom';
    payment_day: number;
    grace_period_days: number;
    late_fee_amount: number;
    contract_document?: string;
    move_in_checklist?: Record<string, boolean>;
    move_out_checklist?: Record<string, boolean>;
    status: 'active' | 'pending' | 'ended' | 'terminated';
    is_active: boolean;
    move_out_date?: string;
    move_out_reason?: string;
    deposit_refunded: boolean;
    deposit_refund_amount?: number;
    deposit_deduction_reason?: string;
    allowed_occupants: number;
    actual_occupants?: Array<{name: string; relationship: string}>;
    special_conditions?: string;
    created_at: string;
    updated_at: string;
    occupancy_duration?: number;
  }
  
  export interface TenantDocument {
    id: number;
    tenant: number;
    tenant_name: string;
    occupancy: number;
    occupancy_details?: {
      id: number;
      property_name: string;
      unit_number: string;
      start_date: string;
    };
    document_type: 'contract' | 'id' | 'employment' | 'reference' | 'inspection' | 'notice' | 'other';
    title: string;
    file: string;
    description?: string;
    is_verified: boolean;
    verified_by?: number;
    verified_by_name?: string;
    verified_at?: string;
    uploaded_at: string;
    updated_at: string;
    verification_status: 'Verified' | 'Unverified';
  }
  
  export interface TenantNote {
    id: number;
    tenant: number;
    tenant_name: string;
    occupancy: number;
    note_type: 'general' | 'complaint' | 'maintenance' | 'payment' | 'violation' | 'warning';
    title: string;
    content: string;
    is_private: boolean;
    created_by?: number;
    created_by_name: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface MaintenanceRequest {
    id: number;
    reported_by: number;
    tenant_name: string;
    description: string;
    priority: string;
    status: string;
    reported_date: string;
    resolution_date?: string;
    resolution_time?: number;
    property_details?: {
      property_id?: number;
      property_name?: string;
      unit_id?: number;
      unit_number?: string;
    };
  }
  
  export interface TenantAnalytics {
    overview: {
      total_tenants: number;
      new_tenants_30d: number;
      tenant_status: Array<{
        status: string;
        count: number;
      }>;
    };
    registration_trends: Array<{
      month: string;
      count: number;
    }>;
    top_landlords: Array<{
      owner__id: number;
      owner__full_name: string;
      tenant_count: number;
    }>;
    language_distribution: Array<{
      language: string;
      count: number;
    }>;
    data_health: {
      missing_email: number;
      missing_alt_phone: number;
      missing_profile_image: number;
      missing_id_image: number;
    };
  }
  
  export interface SystemAudit {
    tenant_details: {
      id: number;
      full_name: string;
      email: string;
      phone_number: string;
      status: string;
    };
    system_access: {
      last_login: string;
      login_count: number;
      failed_login_attempts: number;
      password_changes: number;
      last_password_change: string;
    };
    data_modifications: Array<{
      timestamp: string;
      field: string;
      old_value: string;
      new_value: string;
      modified_by: string;
    }>;
    document_activity: Array<{
      timestamp: string;
      document_id: number;
      document_title: string;
      action: string;
      performed_by: string;
    }>;
    communication_history: Array<{
      timestamp: string;
      type: string;
      subject: string;
      status: string;
      sent_by: string;
    }>;
  }
  
  export interface DataQualityReport {
    total_tenants: number;
    missing_critical_info: {
      email: number;
      phone: number;
      id_number: number;
      dob: number;
      emergency_contact: number;
    };
    missing_images: {
      profile_image: number;
      id_image: number;
    };
    document_status: {
      total_documents: number;
      verified_documents: number;
      unverified_documents: number;
      verification_rate: number;
    };
    tenant_records: {
      tenants_without_documents: number;
      tenants_without_occupancy: number;
    };
    data_quality_score: number;
  }
  
  export interface UsageStatistics {
    daily_activity: {
      today_registrations: number;
      this_week_registrations: number;
      this_month_registrations: number;
    };
    monthly_trends: {
      tenant_registrations: Array<{
        month: string;
        count: number;
      }>;
      property_growth: Array<{
        month: string;
        count: number;
      }>;
      document_uploads: Array<{
        month: string;
        count: number;
      }>;
    };
  }
  
  export interface BulkOperationRequest {
    operation: 'system_status_update' | 'export_data';
    tenant_ids: number[];
    status?: string;
    format?: 'json' | 'csv' | 'excel';
    fields?: string[];
  }
  
  export interface BulkOperationResponse {
    message: string;
    updated_count?: number;
    export_url?: string;
  }
  
  export interface DocumentVerificationRequest {
    document_ids: number[];
    verification_note?: string;
  }
  
  export interface PaginatedResponse<T> {
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
  }
  
  // Base API URL for tenant endpoints
  const ADMIN_TENANT_API_BASE = '/api/v1/tenants/admin';
  
  /**
   * Admin Tenant Service
   * Provides functions for administrative tenant management
   */
  const AdminTenantService = {
    /**
     * Fetch all tenants with optional filtering and pagination
     * @param params Optional query parameters for filtering and pagination
     * @returns Promise with paginated tenant list
     */
    getAdminTenants: async (params: {
      search?: string;
      status?: string;
      property_owner?: number;
      created_after?: string;
      created_before?: string;
      page?: number;
      page_size?: number;
      ordering?: string;
    } = {}): Promise<PaginatedResponse<Tenant>> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/`, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching tenants:', error);
        throw error;
      }
    },
  
    /**
     * Fetch detailed information about a specific tenant
     * @param tenantId Tenant ID to fetch details for
     * @returns Promise with tenant details
     */
    getAdminTenantDetails: async (tenantId: number): Promise<Tenant> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant details:', error);
        throw error;
      }
    },
  
    /**
     * Create a new tenant
     * @param tenantData Tenant data to create
     * @returns Promise with created tenant
     */
    createTenant: async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant> => {
      try {
        const response = await api.post(`${ADMIN_TENANT_API_BASE}/tenants/`, tenantData);
        return response.data;
      } catch (error) {
        console.error('Error creating tenant:', error);
        throw error;
      }
    },
  
    /**
     * Update an existing tenant
     * @param tenantId Tenant ID to update
     * @param tenantData Tenant data to update
     * @returns Promise with updated tenant
     */
    updateTenant: async (tenantId: number, tenantData: Partial<Tenant>): Promise<Tenant> => {
      try {
        const response = await api.patch(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/`, tenantData);
        return response.data;
      } catch (error) {
        console.error('Error updating tenant:', error);
        throw error;
      }
    },
  
    /**
     * Delete a tenant
     * @param tenantId Tenant ID to delete
     * @returns Promise with deletion confirmation
     */
    deleteTenant: async (tenantId: number): Promise<void> => {
      try {
        await api.delete(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/`);
      } catch (error) {
        console.error('Error deleting tenant:', error);
        throw error;
      }
    },
  
    /**
     * Fetch tenant analytics for admin dashboard
     * @returns Promise with tenant analytics data
     */
    getTenantAnalytics: async (): Promise<TenantAnalytics> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/analytics-dashboard/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant analytics:', error);
        throw error;
      }
    },
  
    /**
     * Perform bulk operations on tenants
     * @param bulkOperationData Bulk operation data
     * @returns Promise with operation result
     */
    performBulkOperation: async (bulkOperationData: BulkOperationRequest): Promise<BulkOperationResponse> => {
      try {
        const response = await api.post(`${ADMIN_TENANT_API_BASE}/tenants/bulk-operations/`, bulkOperationData);
        return response.data;
      } catch (error) {
        console.error('Error performing bulk operation:', error);
        throw error;
      }
    },
  
    /**
     * Get system audit for a specific tenant
     * @param tenantId Tenant ID to audit
     * @returns Promise with tenant system audit data
     */
    getTenantSystemAudit: async (tenantId: number): Promise<SystemAudit> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/system-audit/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant system audit:', error);
        throw error;
      }
    },
  
    /**
     * Get tenant data quality report
     * @returns Promise with data quality report
     */
    getDataQualityReport: async (): Promise<DataQualityReport> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/data-quality-report/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching data quality report:', error);
        throw error;
      }
    },
  
    /**
     * Fetch all tenant documents with optional filtering
     * @param params Optional query parameters for filtering
     * @returns Promise with paginated document list
     */
    getAdminDocuments: async (params: {
      verified?: boolean;
      document_type?: string;
      page?: number;
      page_size?: number;
    } = {}): Promise<PaginatedResponse<TenantDocument>> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/documents/`, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
    },
  
    /**
     * Verify tenant documents
     * @param verificationData Document verification data
     * @returns Promise with verification result
     */
    verifyDocuments: async (verificationData: DocumentVerificationRequest): Promise<{ message: string; verified_count: number }> => {
      try {
        const response = await api.post(`${ADMIN_TENANT_API_BASE}/documents/verify/`, verificationData);
        return response.data;
      } catch (error) {
        console.error('Error verifying documents:', error);
        throw error;
      }
    },
  
    /**
     * Fetch occupancies for a specific tenant
     * @param tenantId Tenant ID to fetch occupancies for
     * @returns Promise with paginated occupancy list
     */
    getTenantOccupancies: async (tenantId: number, params: {
      page?: number;
      page_size?: number;
    } = {}): Promise<PaginatedResponse<TenantOccupancy>> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/occupancies/`, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant occupancies:', error);
        throw error;
      }
    },
  
    /**
     * Fetch documents for a specific tenant
     * @param tenantId Tenant ID to fetch documents for
     * @returns Promise with paginated document list
     */
    getTenantDocuments: async (tenantId: number, params: {
      page?: number;
      page_size?: number;
      document_type?: string;
    } = {}): Promise<PaginatedResponse<TenantDocument>> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/documents/`, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant documents:', error);
        throw error;
      }
    },
  
    /**
     * Fetch notes for a specific tenant
     * @param tenantId Tenant ID to fetch notes for
     * @returns Promise with paginated note list
     */
    getTenantNotes: async (tenantId: number, params: {
      page?: number;
      page_size?: number;
      note_type?: string;
    } = {}): Promise<PaginatedResponse<TenantNote>> => {
      try {
        const response = await api.get(`${ADMIN_TENANT_API_BASE}/tenants/${tenantId}/notes/`, { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching tenant notes:', error);
        throw error;
      }
    }
  };
  
  export default AdminTenantService;