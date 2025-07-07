// components/sidebar/NotificationSidebarFooter.jsx
"use client";

import { useState } from "react";
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Check,
  X,
  Trash2,
  MoreVertical,
  CreditCard,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/hooks/landlord/useNotifications";
import { useRouter } from "next/navigation";
import AuthService from "@/services/auth";
import NotificationService from "@/services/landlord/notification";

const NotificationIcon = ({ type }) => {
  const iconMap = {
    payment: CreditCard,
    rent: DollarSign,
    tenant: Users,
    property: Building2,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    default: Bell
  };
  
  const IconComponent = iconMap[type] || iconMap.default;
  return <IconComponent className="w-4 h-4" />;
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
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
  
  return (
    <div className={`p-3 border-l-4 ${notification.isRead ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'} ${colorClass.split(' ')[2]} mb-2 rounded-r-md`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-1 rounded-full ${colorClass}`}>
            <NotificationIcon type={notification.type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {notification.title}
              </h4>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-1">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {NotificationService.formatTimeAgo(notification.createdAt)}
              </span>
              
              {notification.priority === 'high' && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  High
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {!notification.isRead && (
              <DropdownMenuItem onClick={handleMarkAsRead}>
                <Check className="w-3 h-3 mr-2" />
                Mark read
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
  );
};

export default function NotificationSidebarFooter({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      if (onLogout) onLogout();
      router.push('/login');
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    }
  };

  const handleNotificationAction = async (action, notificationId = null) => {
    switch (action) {
      case 'markAsRead':
        await markAsRead(notificationId);
        break;
      case 'markAllAsRead':
        await markAllAsRead();
        break;
      case 'delete':
        await deleteNotification(notificationId);
        break;
      case 'refresh':
        refreshNotifications();
        break;
    }
  };

  const recentNotifications = notifications.slice(0, 5);
  
  return (
    <div className="p-4 border-t border-sidebar-border bg-sidebar">
      {/* Notifications Bell */}
      <div className="flex items-center justify-between mb-3">
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 hover:bg-sidebar-hover"
            >
              <Bell className="w-5 h-5 text-sidebar-fg" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-80 p-0" 
            side="top" 
            align="start"
            sideOffset={8}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationAction('markAllAsRead')}
                    className="text-xs h-6 px-2"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationAction('refresh')}
                  className="p-1 h-6 w-6"
                >
                  <Bell className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="max-h-96">
              <div className="p-2">
                {loading ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : recentNotifications.length > 0 ? (
                  <>
                    {recentNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={(id) => handleNotificationAction('markAsRead', id)}
                        onDelete={(id) => handleNotificationAction('delete', id)}
                      />
                    ))}
                    
                    {notifications.length > 5 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsNotificationOpen(false);
                            router.push('/landlord/notifications');
                          }}
                          className="text-xs"
                        >
                          View all notifications
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
        {/* Theme Toggle */}
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-sidebar-hover text-sidebar-fg"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-sidebar-hover text-sidebar-fg text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-fg truncate">
              {user?.full_name || 'User Name'}
            </p>
            <p className="text-xs text-sidebar-fg/70 truncate">
              {user?.user_type === 'landlord' ? 'Landlord' : 'Administrator'}
            </p>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-sidebar-hover text-sidebar-fg"
            >
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56" side="top">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => router.push('/landlord/profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/landlord/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/landlord/notifications')}>
              <Bell className="w-4 h-4 mr-2" />
              All Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}