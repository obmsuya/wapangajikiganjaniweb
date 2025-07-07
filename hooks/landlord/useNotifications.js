// hooks/landlord/ation/useNotifications.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import NotificationService from '@/services/landlord/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (unreadOnly = false, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await NotificationService.getNotifications(unreadOnly, limit);
      const formattedNotifications = Array.isArray(response) 
        ? response.map(NotificationService.formatNotificationForDisplay)
        : [];
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
      
      return response.marked_count || 0;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return 0;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.isRead);
  }, [notifications]);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadNotifications,
    getNotificationsByType,
    refreshNotifications
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    rent_reminder_sms: false,
    payment_confirmation_sms: true,
    overdue_notifications_sms: true,
    wallet_notifications_sms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await NotificationService.getNotificationPreferences();
      setPreferences(response);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setError(err.message || 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await NotificationService.updateNotificationPreferences(newPreferences);
      setPreferences(response);
      
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(err.message || 'Failed to update preferences');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    fetchPreferences
  };
}