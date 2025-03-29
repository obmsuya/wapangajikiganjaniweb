'use client';
import { useEffect } from 'react';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock, 
  LogIn, 
  LogOut,
  KeyRound,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { ActivityLog } from '@/services/auth';

// Custom styling for timeline
const timelineStyles = {
  line: "absolute h-full w-px bg-border left-6 top-8",
  item: "mb-6 ms-14 relative",
  itemActive: "mb-6 ms-14 relative",
  dot: "absolute rounded-full w-12 h-12 flex items-center justify-center -start-6 -mt-2",
  content: "p-4 rounded-md relative",
  date: "text-xs text-muted-foreground"
};

// Map action types to icons
const getActionIcon = (action: string) => {
  switch (action?.toLowerCase()) {
    case 'login':
      return <LogIn className="h-5 w-5" />;
    case 'logout':
      return <LogOut className="h-5 w-5" />;
    case 'register':
      return <UserPlus className="h-5 w-5" />;
    case 'password_reset':
      return <KeyRound className="h-5 w-5" />;
    case 'account_activation':
      return <UserCheck className="h-5 w-5" />;
    case 'account_deactivation':
      return <UserX className="h-5 w-5" />;
    case 'account_lock':
      return <Lock className="h-5 w-5" />;
    case 'account_unlock':
      return <Unlock className="h-5 w-5" />;
    case 'permission_change':
      return <Shield className="h-5 w-5" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

// Get color for action type
const getActionColor = (action: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (action?.toLowerCase()) {
    case 'login':
      return 'outline';
    case 'logout':
      return 'default';
    case 'register':
      return 'outline';
    case 'password_reset':
      return 'secondary';
    case 'account_activation':
      return 'outline';
    case 'account_deactivation':
      return 'destructive';
    case 'account_lock':
      return 'destructive';
    case 'account_unlock':
      return 'outline';
    case 'permission_change':
      return 'outline';
    default:
      return 'default';
  }
};

// Format timestamp
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

// Format details object to string
const formatDetails = (details: Record<string, unknown>) => {
  if (!details) return '';
  
  // Format details based on action type
  if ('ip_address' in details) {
    return `IP: ${details.ip_address}`;
  }
  
  if ('new_status' in details) {
    return `Status: ${details.new_status}`;
  }
  
  return Object.entries(details)
    .filter(([key]) => key !== 'id' && key !== 'user_id')
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
    .join(', ');
};

interface ActivityLogsTimelineProps {
  logs?: ActivityLog[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  maxHeight?: number;
}

export function ActivityLogsTimeline({
  logs = [],
  isLoading = false,
  title = "Activity Logs",
  description = "Recent user activity",
  maxHeight = 400
}: ActivityLogsTimelineProps) {
  const { mode } = useColorMode();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

    // Sync dark mode with document for Tailwind
    useEffect(() => {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [mode]);
    
  // Generate sample data if none provided
  const activityLogs = logs.length > 0 ? logs : [
    {
      action: 'login',
      details: { ip_address: '192.168.1.1', device: 'Chrome / Windows' },
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    },
    {
      action: 'password_reset',
      details: { requested_by: 'user', method: 'email' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
      action: 'account_activation',
      details: { activated_by: 'admin', reason: 'verification complete' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      action: 'register',
      details: { source: 'web', referral: 'direct' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    }
  ];

  // Toggle expanded log
  const toggleExpandLog = (timestamp: string) => {
    if (expandedLog === timestamp) {
      setExpandedLog(null);
    } else {
      setExpandedLog(timestamp);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="relative"
          style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
        >
          {/* Timeline line */}
          <div className={timelineStyles.line}></div>
          
          {isLoading ? (
            // Loading state
            Array(3).fill(0).map((_, i) => (
              <div key={`loading-${i}`} className={timelineStyles.item}>
                <div className={`${timelineStyles.dot} bg-muted animate-pulse`}></div>
                <div className="ms-4">
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : activityLogs.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8">
              <Activity className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          ) : (
            // Actual timeline items
            activityLogs.map((log, index) => {
              const { date, time } = formatTimestamp(log.timestamp);
              const isExpanded = expandedLog === log.timestamp;
              const actionColor = getActionColor(log.action);
              
              return (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={timelineStyles.item}
                  onClick={() => toggleExpandLog(log.timestamp)}
                >
                  <div 
                    className={`${timelineStyles.dot} bg-${actionColor}/10 text-${actionColor} border border-${actionColor}/20 cursor-pointer hover:bg-${actionColor}/20 transition-colors`}
                  >
                    {getActionIcon(log.action)}
                  </div>
                  <div 
                    className={`${timelineStyles.content} bg-background dark:bg-dark-background border border-border hover:border-${actionColor}/50 cursor-pointer transition-all ${isExpanded ? 'border-primary shadow-sm' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium leading-none mb-1">
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1).replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDetails(log.details)}
                        </p>
                      </div>
                      <Badge variant={actionColor} className="mt-0.5">
                        {log.action}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {date}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{time}</span>
                    </div>
                    
                    {/* Expanded details */}
                    {isExpanded && log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <h5 className="text-xs font-medium mb-2">Details</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-muted-foreground">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}