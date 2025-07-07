// services/landlord/notification.js
import api from '@/lib/api/api-client';

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
      
      const response = await api.put(`/api/v1/notifications/${notificationId}/mark-read/`, {});
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
      return response;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return {
        rent_reminder_sms: false,
        payment_confirmation_sms: true,
        overdue_notifications_sms: true,
        wallet_notifications_sms: false
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
  }
};

export default NotificationService;