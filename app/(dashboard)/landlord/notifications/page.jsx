// app/(dashboard)/landlord/notifications/page.jsx
"use client";

import { useState, useMemo } from "react";
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
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const NotificationIcon = ({ type, className = "w-5 h-5" }) => {
  const icons = {
    payment: CreditCard,
    rent: DollarSign,
    tenant: Users,
    property: Building2,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    default: Bell
  };
  
  const IconComponent = icons[type] || icons.default;
  return <IconComponent className={className} />;
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
          {/* Selection Checkbox */}
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(notification.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          
          {/* Notification Icon */}
          <div className={`p-2 rounded-full flex-shrink-0 ${colorClass}`}>
            <NotificationIcon type={notification.type} className="w-4 h-4" />
          </div>
          
          {/* Content */}
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
              notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
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
  const [currentTab, setCurrentTab] = useState("all");

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Tab filtering
    if (currentTab === "unread") {
      filtered = filtered.filter(n => !n.isRead);
    } else if (currentTab === "read") {
      filtered = filtered.filter(n => n.isRead);
    }

    // Type filtering
    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Status filtering
    if (filterStatus !== "all") {
      if (filterStatus === "unread") {
        filtered = filtered.filter(n => !n.isRead);
      } else if (filterStatus === "read") {
        filtered = filtered.filter(n => n.isRead);
      }
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, currentTab, filterType, filterStatus, searchQuery]);

  // Handle bulk actions
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

  // Get notification types for filter
  const notificationTypes = useMemo(() => {
    const types = [...new Set(notifications.map(n => n.type))];
    return types.sort();
  }, [notifications]);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your notifications and stay updated with important alerts
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
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {notifications.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {unreadCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {readNotifications.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {notificationTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedNotifications.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedNotifications.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Select all
              </label>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({readNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab}>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Error loading notifications
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <Button onClick={refreshNotifications}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try again
                  </Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No notifications found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || filterType !== "all" || filterStatus !== "all"
                      ? "Try adjusting your filters or search query"
                      : "You're all caught up! No new notifications."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}