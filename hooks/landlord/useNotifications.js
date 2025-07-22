// hooks/landlord/useNotifications.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import NotificationService from '@/services/landlord/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple fetch functions without dependencies causing re-renders
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
  }, []); // No dependencies - function is stable

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []); // No dependencies - function is stable

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

  // Simple refresh function with no dependencies
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []); // No dependencies - prevents infinite loops

  // Auto-refresh every 30 seconds - ONLY the count, not full notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount(); // Only fetch count, not full list
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - interval won't restart

  // Initial load ONLY runs once
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []); // Empty dependency array - runs only on mount

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