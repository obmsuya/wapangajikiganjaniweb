'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useColorMode } from '@/app/components/theme/ThemeProvider';
import { toast } from 'sonner'; 
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  BarChart3,
  ChevronRight,
  Search,
  RefreshCw
} from 'lucide-react';
import {
  AdminUserService,
  UserListResponse,
  UserData,
  UserDetailResponse
} from '@/services/auth';
import { UserDataTable } from '@/app/components/users/user-data-table';
import { UserRegistrationChart } from '@/app/components/users/user-registration-chart';
import { UserStatusChart } from '@/app/components/users/user-status-distribution-chart';
import { ActivityLogsTimeline } from '@/app/components/users/activity-logs-timeline';
import { UserProfileCard } from '@/app/components/users/user-profile-card';
import { Input } from '@/components/ui/input';
import { Box, Container } from '@mui/material';


// Breadcrumb component for navigation
const Breadcrumb = ({ items }: { items: { label: string; href: string; active?: boolean }[] }) => {
  return (
    <nav className="mb-4 flex items-center text-sm">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
          {item.active ? (
            <span className="font-medium text-primary dark:text-dark-primary">{item.label}</span>
          ) : (
            <a
              href={item.href}
              className="text-text-secondary hover:text-primary dark:text-dark-text-secondary dark:hover:text-dark-primary transition-colors"
            >
              {item.label}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};

// Main User Dashboard Component
export default function UserDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mode } = useColorMode();

  // State variables
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [registrationPeriod, setRegistrationPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Initialize from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    const userId = searchParams.get('userId');
    const page = searchParams.get('page');

    if (tab && ['overview', 'list', 'details'].includes(tab)) {
      setActiveTab(tab);
    }

    if (page && !isNaN(Number(page))) {
      setCurrentPage(Number(page));
    }

    if (userId) {
      fetchUserDetails(userId);
    }
  }, [searchParams]);

  // Sync dark mode with document for Tailwind
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await AdminUserService.getUsers(currentPage, pageSize);
      setUserList(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users. Please try again later.'); // UPDATED TO TOASTER
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, setIsLoading, setUserList, setIsRefreshing]);
  
  // Fetch users on component mount or when page changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, fetchUsers]);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await AdminUserService.getUserDetails(userId);
      setSelectedUser(response);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to fetch user details. Please try again later.'); // UPDATED TO TOASTER
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Update URL without full navigation
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);

    if (value !== 'details') {
      params.delete('userId');
      setSelectedUser(null);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (activeTab === 'details' && selectedUser) {
      fetchUserDetails(selectedUser.id);
    } else {
      fetchUsers();
    }
  };

  // Handle user selection for details view
  const handleSelectUser = (user: UserData) => {
    fetchUserDetails(user.id);

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'details');
    params.set('userId', user.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle user status change
  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await AdminUserService.updateUserStatus(userId, { status: isActive ? 'active' : 'inactive' });

      // Update local state
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          is_active: isActive,
        });
      }

      // Update user list if needed
      if (userList) {
        const updatedUsers = userList.results.map(user =>
          user.id === userId ? { ...user, is_active: isActive } : user
        );
        setUserList({
          ...userList,
          results: updatedUsers,
        });
      }

      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully.`); // UPDATED TO TOASTER
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status. Please try again later.'); // UPDATED TO TOASTER
    }
  };

  // Handle password reset
  const handlePasswordReset = async (userId: string, newPassword: string) => {
    try {
      await AdminUserService.resetUserPassword(userId, { new_password: newPassword });

      toast.success('Password reset successfully.'); // UPDATED TO TOASTER

      return true;
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password. Please try again later.'); // UPDATED TO TOASTER
      return false;
    }
  };

  // Get current breadcrumb items based on active tab
  const getBreadcrumbItems = () => {
    const baseItems = [
      { label: 'Home', href: '/dashboard' },
      { label: 'User Management', href: '/dashboard/users' }
    ];

    if (activeTab === 'overview') {
      return [...baseItems, { label: 'Overview', href: '/dashboard/users?tab=overview', active: true }];
    } else if (activeTab === 'list') {
      return [...baseItems, { label: 'User List', href: '/dashboard/users?tab=list', active: true }];
    } else if (activeTab === 'details') {
      return [
        ...baseItems,
        { label: 'User List', href: '/dashboard/users?tab=list' },
        { label: selectedUser?.full_name || 'User Details', href: `/dashboard/users?tab=details&userId=${selectedUser?.id}`, active: true }
      ];
    }

    return baseItems;
  };

  // Calculate stats for overview cards
  const calculateStats = () => {
    if (!userList) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        admin: 0,
        staff: 0,
        regular: 0
      };
    }

    return {
      total: userList.total,
      active: userList.results.filter(user => user.is_active).length,
      inactive: userList.results.filter(user => !user.is_active).length,
      admin: userList.results.filter(user => user.is_superuser).length,
      staff: userList.results.filter(user => !user.is_superuser && user.is_staff).length,
      regular: userList.results.filter(user => !user.is_superuser && !user.is_staff).length
    };
  };

  const stats = calculateStats();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div className="container mx-auto p-4 max-w-7xl">
      <Breadcrumb items={getBreadcrumbItems()} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text dark:text-dark-text">User Management</h1>
          <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
            Monitor and manage all user accounts in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary-dark text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="mr-2 h-4 w-4" />
            User List
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white" disabled={!selectedUser}>
            <UserCheck className="mr-2 h-4 w-4" />
            User Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          {/* User Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Total Users</p>
                    <h3 className="text-2xl font-heading font-bold mt-1">{stats.total}</h3>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10 dark:bg-dark-primary/10">
                    <Users className="h-6 w-6 text-primary dark:text-dark-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Active Users</p>
                    <h3 className="text-2xl font-heading font-bold mt-1">{stats.active}</h3>
                  </div>
                  <div className="p-3 rounded-full bg-success/10">
                    <UserCheck className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Inactive Users</p>
                    <h3 className="text-2xl font-heading font-bold mt-1">{stats.inactive}</h3>
                  </div>
                  <div className="p-3 rounded-full bg-destructive/10">
                    <UserX className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Registration Chart */}
            <UserRegistrationChart
              isLoading={isLoading}
              period={registrationPeriod}
              onPeriodChange={setRegistrationPeriod}
            />

            {/* User Status Distribution */}
            <div className="grid gap-6">
              <UserStatusChart
                isLoading={isLoading}
                data={{
                  active: stats.active,
                  inactive: stats.inactive
                }}
              />

              <UserStatusChart
                isLoading={isLoading}
                title="User Role Distribution"
                description="Admin, Staff and Regular users"
                showRoleDistribution={true}
                data={{
                  active: stats.active,
                  inactive: stats.inactive,
                  admin: stats.admin,
                  staff: stats.staff,
                  regular: stats.regular
                }}
              />
            </div>
          </div>

          {/* Recently Registered Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Registered Users</CardTitle>
              <CardDescription>Last 5 users who joined the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-text-secondary dark:text-dark-text-secondary">Loading user data...</p>
                </div>
              ) : userList && userList.results.length > 0 ? (
                <div className="grid gap-4">
                  {userList.results
                    .sort((a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime())
                    .slice(0, 5)
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between border-b pb-3 border-border last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary dark:text-dark-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.phone_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-text-secondary dark:text-dark-text-secondary">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User List Tab Content */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>User List</CardTitle>
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 w-full md:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userList ? (
                <UserDataTable
                  data={userList.results}
                  pageCount={userList.total_pages}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  isLoading={isLoading}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-text-secondary dark:text-dark-text-secondary">Loading user data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Details Tab Content */}
        <TabsContent value="details">
          {selectedUser ? (
            <div className="grid gap-6 md:grid-cols-3">
              {/* User Profile Card */}
              <div className="md:col-span-1">
                <UserProfileCard
                  user={selectedUser}
                  isLoading={isLoading}
                  onStatusChange={handleUserStatusChange}
                  onPasswordReset={handlePasswordReset}
                />
              </div>

              {/* Activity Logs */}
              <div className="md:col-span-2">
                <ActivityLogsTimeline
                  logs={selectedUser.activity_logs}
                  isLoading={isLoading}
                  title="User Activity History"
                  description="Recent actions performed by or related to this user"
                  maxHeight={600}
                />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-medium mb-2">No User Selected</p>
                <p className="text-text-secondary dark:text-dark-text-secondary text-center max-w-md mb-6">
                  Please select a user from the User List to view their details and activity history
                </p>
                <Button variant="outline" onClick={() => handleTabChange('list')}>
                  View User List
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </Box>
    </Container>
  );
}