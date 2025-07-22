// components/sidebar/NotificationSidebarFooter.jsx
"use client";

import { useState, useRef } from "react";
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
  const [isMarking, setIsMarking] = useState(false);
  
  const handleMarkAsRead = async () => {
    if (!notification.isRead && !isMarking) {
      setIsMarking(true);
      await onMarkAsRead(notification.id);
      setIsMarking(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      await onDelete(notification.id);
      setIsDeleting(false);
    }
  };
  
  const colorClass = NotificationService.getNotificationColor(notification.type, notification.priority);
  
  return (
    <div className={`p-3 border-l-4 ${notification.isRead ? 
      'bg-gray-50/50 dark:bg-gray-800/50' : 
      'bg-white dark:bg-gray-900'
    } ${colorClass.split(' ')[2]} hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-full ${colorClass}`}>
            <NotificationIcon type={notification.type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium ${
              notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {notification.title}
            </h4>
            <p className={`text-xs mt-1 ${
              notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.message}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">
              {NotificationService.formatTimeAgo(notification.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={isMarking}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NotificationSidebarFooter() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Use ref to prevent re-fetching when popover opens/closes
  const hasInitialized = useRef(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  // Only refresh when popover is opened, not every render
  const handleNotificationOpen = () => {
    if (!hasInitialized.current) {
      refreshNotifications();
      hasInitialized.current = true;
    }
    setNotificationOpen(true);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await AuthService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get only recent notifications for sidebar (limit to 5)
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Notifications */}
      <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 h-9"
            onClick={handleNotificationOpen}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <span className="text-sm">Notifications</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-0" 
          side="right" 
          align="end"
          sideOffset={8}
        >
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/landlord/notifications')}
                className="text-xs"
              >
                View all
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-80">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="w-full justify-start gap-3 h-9"
      >
        {theme === "light" ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
        <span className="text-sm">
          {theme === "light" ? "Dark mode" : "Light mode"}
        </span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-9">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
            <span className="text-sm">Account</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56" side="right" align="end">
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
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}