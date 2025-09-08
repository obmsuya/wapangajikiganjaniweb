// services/landlord/notification.js 
import api from '@/lib/api/api-client';

const NOTIFICATION_TYPES = {
  // Payment notifications
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_AUTO_CONFIRMED: 'payment_auto_confirmed',
  
  // System payment notifications
  SYSTEM_PAYMENT_RECEIVED: 'system_payment_received',
  SYSTEM_PAYMENT_COMPLETED: 'system_payment_completed',
  SYSTEM_PAYMENT_FAILED: 'system_payment_failed',
  
  // Subscription notifications
  SUBSCRIPTION_PAYMENT_INITIATED: 'subscription_payment_initiated',
  SUBSCRIPTION_PAYMENT_COMPLETED: 'subscription_payment_completed',
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription_payment_failed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_EXPIRING_SOON: 'subscription_expiring_soon',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  
  // Rent notifications
  RENT_OVERDUE: 'rent_overdue',
  NEXT_RENT_DUE: 'next_rent_due',
  NEXT_PAYMENT_DUE: 'next_payment_due',
  
  // Maintenance notifications
  MAINTENANCE_REQUEST: 'maintenance_request',
  MAINTENANCE_RESPONSE: 'maintenance_response',
  MAINTENANCE_UPDATE: 'maintenance_update',
  
  // Tenant management
  TENANT_ASSIGNED: 'tenant_assigned',
  TENANT_VACATED: 'tenant_vacated',
  
  // System
  ADMIN_ALERT: 'admin_alert',
  SYSTEM_UPDATE: 'system_update',
  WELCOME: 'welcome'
};

const NotificationService = {
  getNotifications: async (unreadOnly = false, limit = 50) => {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unread_only', 'true');
      if (limit) params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/v1/notifications/?${queryString}` 
        : '/api/v1/notifications/';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  getNotificationDetail: async (notificationId) => {
    try {
      if (!notificationId) {
        throw new Error("Notification ID is required");
      }
      
      const response = await api.get(`/api/v1/notifications/${notificationId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching notification ${notificationId}:`, error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      if (!notificationId) {
        throw new Error("Notification ID is required");
      }
      
      const response = await api.put(`/api/v1/notifications/${notificationId}/`);
      return response;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      if (!notificationId) {
        throw new Error("Notification ID is required");
      }
      
      const response = await api.delete(`/api/v1/notifications/${notificationId}/`);
      return response;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },

  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/api/v1/notifications/unread/');
      return response;
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/v1/notifications/count/');
      return response.unread_count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/api/v1/notifications/mark-all-read/');
      return response;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  getNotificationPreferences: async () => {
    try {
      const response = await api.get('/api/v1/notifications/preferences/');
      return response || {
        rent_reminder_sms: false,
        payment_confirmation_sms: true,
        payment_received_sms: true,
        subscription_payment_sms: true,
        subscription_expiry_sms: true,
        maintenance_request_sms: true,
        maintenance_response_sms: true,
        urgent_maintenance_sms: true,
        tenant_assignment_sms: true,
        email_notifications: true,
        push_notifications: true
      };
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return {
        rent_reminder_sms: false,
        payment_confirmation_sms: true,
        payment_received_sms: true,
        subscription_payment_sms: true,
        subscription_expiry_sms: true,
        maintenance_request_sms: true,
        maintenance_response_sms: true,
        urgent_maintenance_sms: true,
        tenant_assignment_sms: true,
        email_notifications: true,
        push_notifications: true
      };
    }
  },

  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await api.put('/api/v1/notifications/preferences/', preferences);
      return response;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },

  formatNotificationForDisplay: (notification) => {
    return {
      id: notification.id,
      title: notification.title || 'Notification',
      message: notification.message || notification.content || '',
      type: notification.notification_type || 'info',
      isRead: notification.is_read || false,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      category: notification.category || 'general',
      priority: notification.priority || 'normal',
      actionUrl: notification.action_url || null,
      metadata: notification.metadata || {}
    };
  },

  getNotificationIcon: (type) => {
    const icons = {
      payment_received: 'CreditCard',
      payment_confirmed: 'CheckCircle',
      payment_rejected: 'XCircle',
      payment_completed: 'CheckCircle',
      payment_failed: 'AlertCircle',
      system_payment_received: 'Smartphone',
      system_payment_completed: 'CheckCircle',
      subscription_payment_completed: 'Crown',
      subscription_expired: 'AlertTriangle',
      subscription_cancelled: 'XCircle',
      subscription_renewed: 'RefreshCw',
      rent_overdue: 'AlertTriangle',
      next_rent_due: 'Calendar',
      next_payment_due: 'Clock',
      maintenance_request: 'Wrench',
      maintenance_response: 'MessageSquare',
      maintenance_update: 'Settings',
      tenant_assigned: 'UserPlus',
      tenant_vacated: 'UserX',
      admin_alert: 'AlertTriangle',
      system_update: 'Settings',
      welcome: 'Heart',
      payment: 'CreditCard',
      rent: 'DollarSign',
      tenant: 'Users',
      property: 'Building2',
      maintenance: 'Wrench',
      subscription: 'Crown',
      system: 'Settings',
      warning: 'AlertTriangle',
      success: 'CheckCircle',
      info: 'Info',
      error: 'XCircle'
    };
    
    return icons[type] || 'Bell';
  },

  getNotificationColor: (type, priority = 'normal') => {
    if (priority === 'high') return 'text-red-600 bg-red-50 border-red-200';
    if (priority === 'medium') return 'text-orange-600 bg-orange-50 border-orange-200';
    
    const colors = {
      payment_received: 'text-green-600 bg-green-50 border-green-200',
      payment_confirmed: 'text-green-600 bg-green-50 border-green-200',
      payment_rejected: 'text-red-600 bg-red-50 border-red-200',
      payment_completed: 'text-green-600 bg-green-50 border-green-200',
      payment_failed: 'text-red-600 bg-red-50 border-red-200',
      system_payment_received: 'text-blue-600 bg-blue-50 border-blue-200',
      system_payment_completed: 'text-green-600 bg-green-50 border-green-200',
      subscription_payment_completed: 'text-purple-600 bg-purple-50 border-purple-200',
      subscription_expired: 'text-red-600 bg-red-50 border-red-200',
      subscription_cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
      subscription_renewed: 'text-green-600 bg-green-50 border-green-200',
      rent_overdue: 'text-red-600 bg-red-50 border-red-200',
      next_rent_due: 'text-blue-600 bg-blue-50 border-blue-200',
      next_payment_due: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      maintenance_request: 'text-orange-600 bg-orange-50 border-orange-200',
      maintenance_response: 'text-blue-600 bg-blue-50 border-blue-200',
      maintenance_update: 'text-purple-600 bg-purple-50 border-purple-200',
      tenant_assigned: 'text-green-600 bg-green-50 border-green-200',
      tenant_vacated: 'text-orange-600 bg-orange-50 border-orange-200',
      admin_alert: 'text-red-600 bg-red-50 border-red-200',
      system_update: 'text-gray-600 bg-gray-50 border-gray-200',
      welcome: 'text-pink-600 bg-pink-50 border-pink-200',
      
      payment: 'text-green-600 bg-green-50 border-green-200',
      rent: 'text-blue-600 bg-blue-50 border-blue-200',
      tenant: 'text-purple-600 bg-purple-50 border-purple-200',
      property: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      maintenance: 'text-orange-600 bg-orange-50 border-orange-200',
      subscription: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      system: 'text-gray-600 bg-gray-50 border-gray-200',
      warning: 'text-red-600 bg-red-50 border-red-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      error: 'text-red-600 bg-red-50 border-red-200'
    };
    
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  },

  formatTimeAgo: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  },

  NOTIFICATION_TYPES
};

export default NotificationService;