"use client";

import { useState, useRef } from "react";
import { 
  Bell, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Check,
  Trash2,
  CreditCard,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Info,
  MoreVertical
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const ThemeToggleSwitch = ({ theme, onToggle }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Sun className={`w-4 h-4 transition-all ${theme === 'light' ? 'text-amber-500 scale-100' : 'text-gray-400 scale-75'}`} />
          <Moon className={`w-4 h-4 absolute top-0 left-0 transition-all ${theme === 'dark' ? 'text-blue-400 scale-100' : 'text-gray-400 scale-75'}`} />
        </div>
        <span className="text-sm font-medium">Dark Mode</span>
      </div>
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
};

export default function NotificationSidebarFooter({ user, isCollapsed = false }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  const hasInitialized = useRef(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotifications();

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

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const recentNotifications = notifications.slice(0, 5);

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="p-2 space-y-3 flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 rounded-full hover:bg-sidebar-hover relative"
                      onClick={handleNotificationOpen}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" 
                    side="right" 
                    align="end"
                    sideOffset={8}
                  >
                    <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
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
                        <div className="p-4 text-center text-sm text-gray-500 bg-white dark:bg-gray-900">
                          Loading notifications...
                        </div>
                      ) : recentNotifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500 bg-white dark:bg-gray-900">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
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
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeToggle}
                className="h-10 w-10 p-0 rounded-full hover:bg-sidebar-hover"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{theme === "light" ? "Dark mode" : "Light mode"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-sidebar-hover">
                    <Avatar className="h-8 w-8">
                      {user?.profile_picture ? (
                        <AvatarImage src={user.profile_picture} alt={user.full_name} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" 
                  side="right" 
                  align="end"
                >
                  <DropdownMenuLabel className="bg-white dark:bg-gray-900">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => router.push('/profile')}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Account menu</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gradient-to-t from-sidebar-bg to-transparent">
      <div className="space-y-2">
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-sidebar-hover transition-all duration-200 group"
              onClick={handleNotificationOpen}
            >
              <div className="relative">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-sm font-medium">Notifications</span>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-80 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl" 
            side="right" 
            align="end"
            sideOffset={8}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/landlord/notifications')}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View all
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-80">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500 bg-white dark:bg-gray-900">
                  Loading notifications...
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 bg-white dark:bg-gray-900">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
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

        <div className="px-3 py-2 rounded-xl bg-sidebar-hover/50">
          <ThemeToggleSwitch theme={theme} onToggle={handleThemeToggle} />
        </div>
      </div>

      <div className="pt-2 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-sidebar-hover transition-all duration-200 group"
            >
              <Avatar className="h-8 w-8 avatar-ring">
                {user?.profile_picture ? (
                  <AvatarImage src={user.profile_picture} alt={user.full_name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <MoreVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl" 
            side="right" 
            align="end"
          >
            <DropdownMenuLabel className="bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {user?.profile_picture ? (
                    <AvatarImage src={user.profile_picture} alt={user.full_name} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => router.push('/profile')}
              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}