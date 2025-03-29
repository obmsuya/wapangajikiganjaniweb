// services/adminProperty.ts
// Breaking circular dependency by directly implementing the API client
import axios from 'axios';

// Create API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Django usually expects trailing slashes; ensure the URL has one if it doesn't end with '/' or has query parameters
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url = `${config.url}/`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Avoid logging the entire request object which may contain circular references
      console.error('No response received. Request was sent but no response was received.');
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Admin Property service for property management system
 * Implements administrative functions for properties, units, and maintenance
 * Based on Django backend using GeoDjango models
 */

// =========================================
// Type Definitions
// =========================================

/**
 * Property category types from Django model
 */
export type PropertyCategory = 'apartment' | 'villa' | 'rooms' | 'bungalow';

/**
 * Unit status types from Django model
 */
export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

/**
 * Maintenance issue priority levels
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'emergency';

/**
 * Maintenance issue status options
 */
export type IssueStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * GeoJSON Point type for location coordinates
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * GeoJSON Polygon type for property boundaries
 */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings
}

/**
 * Property owner information
 */
export interface PropertyOwner {
  id: string | number;
  full_name: string;
  phone_number?: string;
  email?: string;
}

/**
 * Base property information
 */
export interface PropertyBase {
  id: string | number;
  name: string;
  category: PropertyCategory;
  total_floors: number;
  address: string;
  total_area?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed property information
 */
export interface PropertyDetail extends PropertyBase {
  owner: PropertyOwner;
  location?: GeoPoint;
  boundary?: GeoPolygon;
  image?: string;
  total_rooms?: number;
}

/**
 * Property unit summary information
 */
export interface PropertyUnitBase {
  id: string | number;
  unit_number: string;
  floor_number: number;
  area?: number;
  rent_amount: number;
  status: UnitStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Property unit with property reference
 */
export interface PropertyUnitSummary extends PropertyUnitBase {
  property: {
    id: string | number;
    name: string;
  };
}

/**
 * Tenant information
 */
export interface Tenant {
  id: string;
  full_name: string;
  phone_number: string;
}

/**
 * Unit utility information
 */
export interface UnitUtility {
  id: string;
  utility_type: string;
  included_in_rent: boolean;
  meter_number?: string;
  cost_allocation: 'landlord' | 'tenant';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maintenance issue base information
 */
export interface MaintenanceIssueBase {
  id: string;
  issue_type: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  reported_date: string;
  completion_date?: string;
}

/**
 * Maintenance issue summary with property and unit info
 */
export interface MaintenanceIssueSummary extends MaintenanceIssueBase {
  unit: {
    id: string;
    unit_number: string;
    property: {
      id: string;
      name: string;
    };
  };
  reported_by?: {
    id: string;
    full_name: string;
  };
}

/**
 * Detailed maintenance issue information
 */
export interface MaintenanceIssueDetail extends MaintenanceIssueBase {
  unit: {
    id: string;
    unit_number: string;
    property: {
      id: string;
      name: string;
    };
  };
  reported_by?: {
    id: string;
    full_name: string;
  };
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed property unit information
 */
export interface PropertyUnitDetail extends PropertyUnitBase {
  property: {
    id: string;
    name: string;
    category: PropertyCategory;
  };
  location?: GeoPolygon;
  current_tenant?: Tenant;
  utilities: UnitUtility[];
  maintenance_issues: MaintenanceIssueSummary[];
}

/**
 * Portfolio analytics response from adminPropertyViewSet.portfolio_analytics
 */
export interface PortfolioAnalytics {
  total_properties: number;
  total_units: number;
  occupancy_rate: number;
  vacancy_rate: number;
  revenue_stats: {
    monthly_revenue: number;
    last_month_revenue: number;
    growth_percentage: number;
  };
  property_categories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  units_by_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Unit analytics response from adminPropertyUnitViewSet.unit_analytics
 */
export interface UnitAnalytics {
  unit_info: {
    id: string;
    unit_number: string;
    property: string;
    floor_number: number;
    area: number;
    rent_amount: number;
    status: string;
  };
  occupancy_metrics: {
    vacancy_rate: number;
    average_stay_days: number;
    total_occupancies: number;
    current_occupancy?: {
      tenant: string;
      tenant_id: string;
      start_date: string;
      rent_amount: number;
      duration_days: number;
    };
  };
  maintenance_metrics: {
    total_issues: number;
    open_issues: number;
    total_cost: number;
    maintenance_cost_per_year: number;
  };
  occupancy_history: Array<{
    tenant: string;
    start_date: string;
    end_date?: string;
    duration_days: number;
    rent_amount: number;
  }>;
  maintenance_history: Array<{
    issue_type: string;
    priority: string;
    status: string;
    reported_date: string;
    completion_date?: string;
    resolution_time_days?: number;
    cost?: number;
  }>;
  utilities: Array<{
    utility_type: string;
    included_in_rent: boolean;
    cost_allocation: string;
  }>;
}

/**
 * Maintenance dashboard response from adminMaintenanceViewSet.maintenance_dashboard
 */
export interface MaintenanceDashboard {
  summary: {
    total_issues: number;
    open_issues: number;
    completed_issues: number;
    emergency_issues: number;
    total_estimated_cost: number;
    total_actual_cost: number;
  };
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
  priority_breakdown: Array<{
    priority: string;
    count: number;
  }>;
  property_issues: Array<{
    unit__property__name: string;
    count: number;
  }>;
  resolution_times: Array<{
    priority: string;
    average_days: number;
    count: number;
  }>;
  cost_analysis: {
    total_estimated: number;
    total_actual: number;
    cost_ratio: number;
    avg_cost_by_type: Array<{
      issue_type: string;
      average_cost: number;
    }>;
  };
  recent_issues: Array<{
    id: string;
    issue_type: string;
    unit: string;
    property: string;
    priority: string;
    status: string;
    reported_date: string;
    reported_by?: string;
  }>;
  monthly_trends: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Bulk unit update request parameters
 */
export interface BulkUnitUpdateRequest {
  units: { id: string | number; status: string; rent_amount?: number }[];
  operation: 'status_change' | 'price_update';
}

/**
 * Bulk unit update response
 */
export interface BulkUnitUpdateResponse {
  updated_count: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * GeoJSON layout processing request
 */
export interface ProcessLayoutRequest {
  layout_type: string;
  boundary?: GeoPolygon;
  total_units?: number;
  raw_data?: string;
}

/**
 * Layout processing response
 */
export interface ProcessLayoutResponse {
  message: string;
  area?: number;
  layout?: Record<string, unknown>;
}

/**
 * Pagination and filtering parameters
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Property filtering parameters
 */
export interface PropertyFilterParams extends PaginationParams {
  search?: string;
  category?: PropertyCategory;
  is_active?: boolean;
  ordering?: string;
}

/**
 * Unit filtering parameters
 */
export interface UnitFilterParams extends PaginationParams {
  search?: string;
  status?: UnitStatus;
  property?: string;
  floor_number?: number;
  ordering?: string;
}

/**
 * Maintenance issue filtering parameters
 */
export interface MaintenanceFilterParams extends PaginationParams {
  search?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  property?: string;
  ordering?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Interface for room-based property creation request
 */
export interface RoomBasedPropertyRequest {
  name: string;
  category: PropertyCategory;
  address: string;
  location?: GeoPoint;
  total_rooms: number;
  boundary?: GeoPolygon;
  total_area?: number;
  default_rent?: number;
  payment_frequency?: string;
  has_corridor?: boolean;
}

/**
 * Room layout generation request
 */
export interface RoomLayoutRequest {
  total_rooms: number;
  default_rent?: number;
  payment_frequency?: string;
}

/**
 * Room layout generation response
 */
export interface RoomLayoutResponse {
  message: string;
  floor_id: string;
  total_units: number;
}

/**
 * Interface for property creation data
 */
export interface PropertyCreateData {
  name: string;
  category: PropertyCategory;
  address: string;
  location?: GeoPoint;
  total_rooms?: number;
  boundary?: GeoPolygon;
  total_area?: number;
  default_rent?: number;
  payment_frequency?: string;
  has_corridor?: boolean;
}

// =========================================
// API Constants
// =========================================

// API base paths
export const API_V1_BASE = 'http://localhost:8000/api/v1';
export const PROPERTIES_BASE = `${API_V1_BASE}/properties`;
export const PROPERTIES_ADMIN_BASE = `${PROPERTIES_BASE}/admin`;
export const UNITS_BASE = `${API_V1_BASE}/units`;

// =========================================
// Admin Property Service
// =========================================

/**
 * Service for administrative property operations
 * Provides functions for admin dashboard and system-wide property management
 */
const AdminPropertyService = {
  /**
   * Get portfolio analytics for admin dashboard
   * Corresponds to AdminPortfolioAnalyticsView
   * 
   * @returns Promise with portfolio analytics data
   * @throws Error if API request fails
   */
  getPortfolioAnalytics: async (): Promise<PortfolioAnalytics> => {
    try {
      const response = await api.get(`${PROPERTIES_ADMIN_BASE}/properties/portfolio-analytics/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get a list of all properties with pagination and filtering
   * 
   * @param params - Optional filtering and pagination parameters
   * @returns Promise with paginated property list
   * @throws Error if API request fails
   */
  getProperties: async (page = 1, pageSize = 10, search?: string): Promise<PaginatedResponse<PropertyBase>> => {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(search && { search })
      };
      
      const response = await api.get(`${PROPERTIES_BASE}/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed information for a specific property
   * 
   * @param propertyId - ID of the property to retrieve
   * @returns Promise with property details
   * @throws Error if property not found or API request fails
   */
  getPropertyDetail: async (propertyId: string | number): Promise<PropertyDetail> => {
    try {
      const response = await api.get(`${PROPERTIES_BASE}/${propertyId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new property
   * 
   * @param propertyData - Property data to create
   * @returns Promise with created property
   * @throws Error if validation fails or API request fails
   */
  createProperty: async (propertyData: PropertyCreateData): Promise<PropertyDetail> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/`,
        propertyData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing property
   * 
   * @param propertyId - ID of the property to update
   * @param propertyData - Property data to update
   * @returns Promise with updated property
   * @throws Error if property not found or API request fails
   */
  updateProperty: async (propertyId: string | number, propertyData: Partial<PropertyCreateData>): Promise<PropertyDetail> => {
    try {
      const response = await api.patch(
        `${PROPERTIES_BASE}/${propertyId}/`,
        propertyData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a property
   * 
   * @param propertyId - ID of the property to delete
   * @returns Promise with deletion confirmation
   * @throws Error if property not found or API request fails
   */
  deleteProperty: async (propertyId: string | number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`${PROPERTIES_BASE}/${propertyId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Perform bulk updates on units within a property
   * Corresponds to AdminPropertyViewSet.bulk_unit_update method
   * 
   * @param propertyId - ID of the property
   * @param updateData - Bulk update operation data
   * @returns Promise with update result
   * @throws Error if property not found or API request fails
   */
  bulkUnitUpdate: async (
    propertyId: string | number, 
    updateData: BulkUnitUpdateRequest
  ): Promise<BulkUnitUpdateResponse> => {
    try {
      const response = await api.post(
        `${PROPERTIES_ADMIN_BASE}/properties/${propertyId}/bulk-unit-update/`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error(`Error performing bulk unit update for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Process and validate property layout data
   * Corresponds to AdminPropertyViewSet.process_layout method
   * 
   * @param propertyId - ID of the property
   * @param layoutData - Layout data to process
   * @returns Promise with processing result
   * @throws Error if property not found or API request fails
   */
  processLayout: async (
    propertyId: string | number, 
    layoutData: ProcessLayoutRequest
  ): Promise<ProcessLayoutResponse> => {
    try {
      const response = await api.post(
        `${PROPERTIES_ADMIN_BASE}/properties/${propertyId}/process-layout/`,
        layoutData
      );
      return response.data;
    } catch (error) {
      console.error(`Error processing layout for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a list of all property units
   * 
   * @param params - Optional filtering and pagination parameters
   * @returns Promise with paginated unit list
   * @throws Error if API request fails
   */
  getUnits: async (params: { property?: string | number, floor?: string | number } & PaginationParams = {}): Promise<PaginatedResponse<PropertyUnitSummary>> => {
    try {
      const response = await api.get(`${UNITS_BASE}/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed information for a specific unit
   * 
   * @param unitId - ID of the unit to retrieve
   * @returns Promise with unit details
   * @throws Error if unit not found or API request fails
   */
  getUnitDetail: async (unitId: string | number): Promise<PropertyUnitSummary> => {
    try {
      const response = await api.get(`${UNITS_BASE}/${unitId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching unit ${unitId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a unit
   * 
   * @param unitId - ID of the unit to update
   * @param unitData - Unit data to update
   * @returns Promise with updated unit
   * @throws Error if unit not found or API request fails
   */
  updateUnit: async (unitId: string | number, unitData: Partial<PropertyUnitBase>): Promise<PropertyUnitSummary> => {
    try {
      const response = await api.patch(
        `${UNITS_BASE}/${unitId}/`,
        unitData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating unit ${unitId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get analytics for a specific unit
   * Corresponds to AdminPropertyUnitViewSet.unit_analytics method
   * 
   * @param unitId - ID of the unit
   * @returns Promise with unit analytics
   * @throws Error if unit not found or API request fails
   */
  getUnitAnalytics: async (unitId: string): Promise<UnitAnalytics> => {
    try {
      const response = await api.get(`${PROPERTIES_ADMIN_BASE}/units/${unitId}/unit-analytics/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for unit ${unitId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a list of all maintenance issues
   * 
   * @param params - Optional filtering and pagination parameters
   * @returns Promise with paginated maintenance issue list
   * @throws Error if API request fails
   */
  getMaintenanceIssues: async (
    params: MaintenanceFilterParams = {}
  ): Promise<PaginatedResponse<MaintenanceIssueSummary>> => {
    try {
      const response = await api.get(`${PROPERTIES_ADMIN_BASE}/maintenance/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance issues:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed information for a specific maintenance issue
   * 
   * @param issueId - ID of the maintenance issue to retrieve
   * @returns Promise with maintenance issue details
   * @throws Error if issue not found or API request fails
   */
  getMaintenanceIssueDetail: async (issueId: string): Promise<MaintenanceIssueDetail> => {
    try {
      const response = await api.get(`${PROPERTIES_ADMIN_BASE}/maintenance/${issueId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching maintenance issue ${issueId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new maintenance issue
   * 
   * @param issueData - Maintenance issue data
   * @returns Promise with created maintenance issue
   * @throws Error if validation fails or API request fails
   */
  createMaintenanceIssue: async (
    issueData: Omit<MaintenanceIssueDetail, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MaintenanceIssueDetail> => {
    try {
      const response = await api.post(
        `${PROPERTIES_ADMIN_BASE}/maintenance/`,
        issueData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating maintenance issue:', error);
      throw error;
    }
  },
  
  /**
   * Update a maintenance issue
   * 
   * @param issueId - ID of the maintenance issue to update
   * @param issueData - Maintenance issue data to update
   * @returns Promise with updated maintenance issue
   * @throws Error if issue not found or API request fails
   */
  updateMaintenanceIssue: async (
    issueId: string, 
    issueData: Partial<MaintenanceIssueDetail>
  ): Promise<MaintenanceIssueDetail> => {
    try {
      const response = await api.patch(
        `${PROPERTIES_ADMIN_BASE}/maintenance/${issueId}/`,
        issueData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating maintenance issue ${issueId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a maintenance issue
   * 
   * @param issueId - ID of the maintenance issue to delete
   * @returns Promise with deletion confirmation
   * @throws Error if issue not found or API request fails
   */
  deleteMaintenanceIssue: async (issueId: string): Promise<{ detail: string }> => {
    try {
      const response = await api.delete(`${PROPERTIES_ADMIN_BASE}/maintenance/${issueId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting maintenance issue ${issueId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get maintenance dashboard analytics
   * Corresponds to AdminMaintenanceDashboardView
   * 
   * @returns Promise with maintenance dashboard data
   * @throws Error if API request fails
   */
  getMaintenanceDashboard: async (): Promise<MaintenanceDashboard> => {
    try {
      const response = await api.get(`${PROPERTIES_ADMIN_BASE}/maintenance/maintenance-dashboard/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance dashboard:', error);
      throw error;
    }
  },
  
  /**
   * Create a room-based property with generated units
   * 
   * @param propertyData - Room-based property data including layout information
   * @returns Promise with property ID and created units
   * @throws Error if API request fails
   */
  createRoomBasedProperty: async (propertyData: RoomBasedPropertyRequest): Promise<{
    property_id: string | number;
    units?: Array<{ id: string | number; name: string }>;
  }> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/create-room-based/`,
        propertyData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating room-based property:', error);
      throw error;
    }
  },
  
  /**
   * Generate a room-based layout for an existing property
   * 
   * @param propertyId - ID of the property
   * @param layoutData - Layout generation data
   * @returns Promise with layout generation response
   * @throws Error if property not found or API request fails
   */
  generateRoomLayout: async (
    propertyId: string | number,
    layoutData: RoomLayoutRequest
  ): Promise<RoomLayoutResponse> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/${propertyId}/generate-room-layout/`,
        layoutData
      );
      return response.data;
    } catch (error) {
      console.error(`Error generating room layout for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Validate SVG layout before saving
   * 
   * @param svgData - SVG data to validate
   * @returns Promise with validation result
   * @throws Error if validation fails or API request fails
   */
  validateSvgLayout: async (svgData: { svg_content: string }): Promise<{ valid: boolean; message: string; area?: number }> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/validate-svg/`,
        svgData
      );
      return response.data;
    } catch (error) {
      console.error('Error validating SVG layout:', error);
      throw error;
    }
  },
  
  /**
   * Save SVG layout for a property
   * 
   * @param propertyId - ID of the property
   * @param svgData - SVG data to save
   * @returns Promise with save result
   * @throws Error if property not found or API request fails
   */
  saveSvgLayout: async (
    propertyId: string,
    svgData: { svg_content: string; meta_data?: Record<string, unknown> }
  ): Promise<{ message: string; layout_id?: string }> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/${propertyId}/svg-layout/`,
        svgData
      );
      return response.data;
    } catch (error) {
      console.error(`Error saving SVG layout for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get SVG layout for a property
   * 
   * @param propertyId - ID of the property
   * @returns Promise with SVG layout data
   * @throws Error if property not found or API request fails
   */
  getSvgLayout: async (propertyId: string): Promise<{ svg_content: string; meta_data?: Record<string, unknown> }> => {
    try {
      const response = await api.get(
        `${PROPERTIES_BASE}/${propertyId}/svg-layout/`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting SVG layout for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Save unit SVG layouts for a property
   * 
   * @param propertyId - ID of the property
   * @param unitSvgData - Unit SVG data to save
   * @returns Promise with save result
   * @throws Error if property not found or API request fails
   */
  saveUnitSvgLayout: async (
    propertyId: string,
    unitSvgData: { unit_layouts: Array<{ unit_id: string; svg_content: string }> }
  ): Promise<{ message: string; updated_units: number }> => {
    try {
      const response = await api.post(
        `${PROPERTIES_BASE}/${propertyId}/units/svg/`,
        unitSvgData
      );
      return response.data;
    } catch (error) {
      console.error(`Error saving unit SVG layouts for property ${propertyId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update unit status
   * 
   * @param unitId - ID of the unit to update
   * @param status - New status for the unit
   * @returns Promise with update result
   * @throws Error if unit not found or API request fails
   */
  updateUnitStatus: async (
    unitId: string | number, 
    status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  ): Promise<{ message: string }> => {
    try {
      const response = await api.post(
        `${UNITS_BASE}/${unitId}/update_status/`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating status for unit ${unitId}:`, error);
      throw error;
    }
  }
};

export default AdminPropertyService;