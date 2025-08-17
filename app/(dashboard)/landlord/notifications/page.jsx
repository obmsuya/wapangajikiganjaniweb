// app/(dashboard)/landlord/notifications/page.jsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search,
  RefreshCw,
  MoreVertical,
  AlertTriangle,
  Info,
  CheckCircle,
  DollarSign,
  Users,
  Building2,
  CreditCard,
  Settings,
  MessageSquare,
  Smartphone,
  Crown,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/landlord/useNotifications";
import NotificationService from "@/services/landlord/notification";
import { customToast } from "@/components/ui/custom-toast";

const NotificationIcon = ({ type, className = "w-5 h-5" }) => {
  const icons = {
    payment_received: CreditCard,
    payment_confirmed: CheckCircle,
    payment_rejected: AlertTriangle,
    system_payment_received: Smartphone,
    subscription_payment_completed: Crown,
    subscription_expired: AlertTriangle,
    rent_overdue: AlertTriangle,
    next_rent_due: Bell,
    maintenance_request: Wrench,
    maintenance_response: MessageSquare,
    tenant_assigned: Users,
    tenant_vacated: Users,
    admin_alert: AlertTriangle,
    payment: CreditCard,
    rent: DollarSign,
    tenant: Users,
    property: Building2,
    maintenance: Wrench,
    subscription: Crown,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    default: Bell
  };
  
  const IconComponent = icons[type] || icons.default;
  return <IconComponent className={className} />;
};

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotificationPreferences();
      setPreferences(prev => ({
        ...prev,
        ...response
      }));
    } catch (error) {
      customToast.error("Failed to Load Preferences", {
        description: "Could not load your notification preferences"
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const updatePreference = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await NotificationService.updateNotificationPreferences(newPreferences);
      customToast.success("Preferences Updated", {
        description: "Your notification preferences have been saved"
      });
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      customToast.error("Update Failed", {
        description: "Could not update your preferences. Please try again."
      });
    }
  };

  const preferenceGroups = [
    {
      title: "Payment Notifications",
      icon: CreditCard,
      preferences: [
        {
          key: "payment_confirmation_sms",
          label: "Payment Confirmations",
          description: "Get SMS when tenants record payments for confirmation"
        },
        {
          key: "payment_received_sms", 
          label: "Payment Received",
          description: "Get SMS when system payments are received"
        },
        {
          key: "rent_reminder_sms",
          label: "Rent Reminders", 
          description: "Get SMS reminders for overdue rent payments"
        }
      ]
    },
    {
      title: "Subscription Notifications",
      icon: Crown,
      preferences: [
        {
          key: "subscription_payment_sms",
          label: "Subscription Payments",
          description: "Get SMS for subscription payment confirmations"
        },
        {
          key: "subscription_expiry_sms",
          label: "Subscription Expiry",
          description: "Get SMS when your subscription is expiring"
        }
      ]
    },
    {
      title: "Maintenance Notifications", 
      icon: Wrench,
      preferences: [
        {
          key: "maintenance_request_sms",
          label: "Maintenance Requests",
          description: "Get SMS when tenants submit maintenance requests"
        },
        {
          key: "maintenance_response_sms",
          label: "Maintenance Updates",
          description: "Get SMS for maintenance status updates"
        },
        {
          key: "urgent_maintenance_sms",
          label: "Urgent Maintenance",
          description: "Always get SMS for urgent maintenance issues"
        }
      ]
    },
    {
      title: "Tenant Management",
      icon: Users,
      preferences: [
        {
          key: "tenant_assignment_sms",
          label: "Tenant Changes",
          description: "Get SMS when tenants are assigned or vacate units"
        }
      ]
    },
    {
      title: "General Settings",
      icon: Settings,
      preferences: [
        {
          key: "email_notifications",
          label: "Email Notifications",
          description: "Receive notifications via email"
        },
        {
          key: "push_notifications",
          label: "Push Notifications", 
          description: "Receive push notifications in the app"
        }
      ]
    }
  ];

  if (initialLoad && loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose how you want to receive notifications
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferenceGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-4">
              <group.icon className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">{group.title}</h3>
            </div>
            
            <div className="space-y-4 ml-6">
              {group.preferences.map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={pref.key} className="text-sm font-medium">
                      {pref.label}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {pref.description}
                    </p>
                  </div>
                  <Switch
                    id={pref.key}
                    checked={preferences[pref.key] || false}
                    onCheckedChange={(checked) => updatePreference(pref.key, checked)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
            
            {groupIndex < preferenceGroups.length - 1 && (
              <Separator className="mt-6" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const NotificationCard = ({ notification, onMarkAsRead, onDelete, isSelected, onSelect }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(notification.id);
    setIsDeleting(false);
  };
  
  const colorClass = NotificationService.getNotificationColor(notification.type, notification.priority);
  const timeAgo = NotificationService.formatTimeAgo(notification.createdAt);
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${
      notification.isRead 
        ? 'bg-gray-50/50 dark:bg-gray-800/50' 
        : 'bg-white dark:bg-gray-900 shadow-sm'
    } ${colorClass.split(' ')[2]} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(notification.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className={`p-2 rounded-full flex-shrink-0 ${colorClass}`}>
            <NotificationIcon type={notification.type} className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-medium truncate ${
                  notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    High
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
            
            <p className={`text-sm mb-3 line-clamp-2 ${
              notification.isRead 
                ? 'text-gray-500 dark:text-gray-400' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {notification.category || notification.type}
              </Badge>
              
              <div className="flex items-center gap-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="h-7 px-2 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark read
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.isRead && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        <Check className="w-3 h-3 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [currentTab, setCurrentTab] = useState("notifications");

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterStatus !== "all") {
      if (filterStatus === "unread") {
        filtered = filtered.filter(n => !n.isRead);
      } else if (filterStatus === "read") {
        filtered = filtered.filter(n => n.isRead);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filterType, filterStatus, searchQuery]);

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleSelectNotification = (id) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleBulkMarkAsRead = async () => {
    const unreadSelected = Array.from(selectedNotifications).filter(id => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.isRead;
    });

    for (const id of unreadSelected) {
      await markAsRead(id);
    }
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await deleteNotification(id);
    }
    setSelectedNotifications(new Set());
  };

  const notificationTypes = useMemo(() => {
    const types = [...new Set(notifications.map(n => n.type))];
    return types.sort();
  }, [notifications]);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your notifications and preferences
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {notificationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedNotifications.size > 0 && (
                <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedNotifications.size} notification(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkMarkAsRead}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          {loading && filteredNotifications.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your filters to see more notifications.'
                    : 'You are all caught up! New notifications will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-600">
                  Select all ({filteredNotifications.length})
                </label>
              </div>

              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  isSelected={selectedNotifications.has(notification.id)}
                  onSelect={handleSelectNotification}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}