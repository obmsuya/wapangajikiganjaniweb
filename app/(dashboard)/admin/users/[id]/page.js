// app/(dashboard)/admin/users/[id]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  Edit2, 
  ArrowLeft, 
  UserX, 
  UserCheck,
  AlertTriangle,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudflarePageHeader } from '@/components/cloudflare/PageHeader';
import { useUserDetails, useUserOperations } from '@/hooks/useAdminData';
import { UpdateUserStatusDialog } from '@/components/admin/UpdateUserStatusDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog';
import { LandlordDetails } from '@/components/admin/LandlordDetails';
import { TenantDetails } from '@/components/admin/TenantDetails';

// Mocked data for demo purposes - replace with API calls
const mockProperties = [
  {
    id: 1,
    name: 'Sunset Apartments',
    address: '123 Main St, City',
    units_count: 8,
    occupied_units: 7,
    monthly_income: 5600,
    status: 'active',
    created_at: '2023-01-15T12:00:00Z'
  },
  {
    id: 2,
    name: 'Pine View Residences',
    address: '456 Oak Ave, Town',
    units_count: 12,
    occupied_units: 10,
    monthly_income: 8400,
    status: 'active',
    created_at: '2023-03-22T10:30:00Z'
  }
];

const mockTenants = [
  {
    id: 1,
    name: 'John Smith',
    property_name: 'Sunset Apartments',
    unit_number: 'A103',
    rent_amount: 700,
    status: 'current',
    move_in_date: '2023-02-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Mary Johnson',
    property_name: 'Sunset Apartments',
    unit_number: 'B205',
    rent_amount: 800,
    status: 'current',
    move_in_date: '2023-04-15T00:00:00Z'
  }
];

const mockPayments = [
  {
    id: 'PAY-001',
    payment_date: '2023-05-01T10:15:00Z',
    amount: 700,
    payment_method: 'mpesa',
    status: 'paid',
    reference: 'MPESA123456',
    is_late: false
  },
  {
    id: 'PAY-002',
    payment_date: '2023-06-03T14:30:00Z',
    amount: 700,
    payment_method: 'card',
    status: 'paid',
    reference: 'CARD789012',
    is_late: true
  },
  {
    id: 'PAY-003',
    payment_date: '2023-07-01T09:45:00Z',
    amount: 700,
    payment_method: 'bank',
    status: 'paid',
    reference: 'BANK345678',
    is_late: false
  }
];

export default function UserDetailsPage({ params }) {
  const userId = params.id;
  const router = useRouter();
  const [statusDialog, setStatusDialog] = useState({ open: false, action: null });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  
  // Fetch user details
  const { user, loading, error, refetchUser, updateUser, resetPassword } = useUserDetails(userId);
  
  // User operations hook
  const { activateUsers, deactivateUsers } = useUserOperations();

  // Additional data for user type-specific views (in real app, fetch from API)
  const [typeSpecificData, setTypeSpecificData] = useState({
    properties: [],
    tenants: [],
    payments: []
  });

  // Load type-specific data
  useEffect(() => {
    if (user) {
      // In a real app, you would fetch this data from API based on user type
      if (user.user_type === 'landlord') {
        setTypeSpecificData({
          properties: mockProperties,
          tenants: mockTenants,
          payments: []
        });
      } else if (user.user_type === 'tenant') {
        setTypeSpecificData({
          properties: [],
          tenants: [],
          payments: mockPayments
        });
      }
    }
  }, [user]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle status update
  const confirmStatusUpdate = async () => {
    try {
      if (statusDialog.action === 'activate') {
        await activateUsers([userId]);
      } else {
        await deactivateUsers([userId]);
      }
      refetchUser();
      setStatusDialog({ open: false, action: null });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle user deletion
  const confirmDelete = async () => {
    try {
      // Here you would call your API to delete the user
      console.log('Deleting user:', userId);
      setDeleteDialog(false);
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle user edit
  const handleEditUser = async (userData) => {
    try {
      await updateUser(userData);
      setEditDialog(false);
      refetchUser();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Handle password reset
  const handleResetPassword = async (newPassword) => {
    try {
      await resetPassword(newPassword);
      setResetPasswordDialog(false);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  // Breadcrumb items for this page
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: user?.full_name || 'User Details' }
  ];

  // Action buttons for the page header
  const pageActions = (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => router.push('/admin/users')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => router.push(`/admin/users/${userId}/edit`)}
      >
        <Edit2 className="h-4 w-4" />
        Edit User
      </Button>
      {user?.is_active ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 text-yellow-600"
          onClick={() => setStatusDialog({ open: true, action: 'deactivate' })}
        >
          <UserX className="h-4 w-4" />
          Suspend User
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 text-green-600"
          onClick={() => setStatusDialog({ open: true, action: 'activate' })}
        >
          <UserCheck className="h-4 w-4" />
          Activate User
        </Button>
      )}
      <Button 
        variant="destructive" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => setDeleteDialog(true)}
      >
        <AlertTriangle className="h-4 w-4" />
        Delete User
      </Button>
    </>
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="User Details"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="User Details"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
              <h3 className="text-lg font-medium">Error loading user details</h3>
              <p>{error.message || 'Something went wrong'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No user found
  if (!user) {
    return (
      <div className="max-w-screen-2xl mx-auto pb-16">
        <CloudflarePageHeader
          title="User Details"
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
              <h3 className="text-lg font-medium">User not found</h3>
              <p>The user you are looking for does not exist or you do not have permission to view it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status badge color
  const getStatusBadge = () => {
    const status = user.status || (user.is_active ? 'active' : 'blocked');
    const statusColors = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get user type badge
  const getUserTypeBadge = () => {
    const userType = user.user_type || 'unknown';
    const typeColors = {
      landlord: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      tenant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      manager: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      system_admin: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    const typeLabels = {
      landlord: "Landlord",
      tenant: "Tenant",
      manager: "Manager",
      system_admin: "System Admin"
    };
    return (
      <Badge className={typeColors[userType] || 'bg-gray-100 text-gray-800'}>
        {typeLabels[userType] || userType}
      </Badge>
    );
  };

  // Determine additional tabs based on user type
  const getUserTypeTabs = () => {
    if (user.user_type === 'landlord') {
      return (
        <TabsTrigger value="landlord">Landlord Details</TabsTrigger>
      );
    } else if (user.user_type === 'tenant') {
      return (
        <TabsTrigger value="tenant">Tenant Details</TabsTrigger>
      );
    }
    return null;
  };

  // Determine additional tab content based on user type
  const getUserTypeContent = () => {
    if (user.user_type === 'landlord') {
      return (
        <TabsContent value="landlord">
          <LandlordDetails 
            landlord={user} 
            properties={typeSpecificData.properties} 
            tenants={typeSpecificData.tenants} 
          />
        </TabsContent>
      );
    } else if (user.user_type === 'tenant') {
      return (
        <TabsContent value="tenant">
          <TenantDetails 
            tenant={{
              ...user,
              property_name: 'Sunset Apartments',
              unit_number: 'A103',
              rent_amount: 700,
              move_in_date: '2023-02-01T00:00:00Z',
              lease_end_date: '2024-01-31T00:00:00Z',
              next_payment_date: '2023-08-01T00:00:00Z'
            }} 
            payments={typeSpecificData.payments} 
          />
        </TabsContent>
      );
    }
    return null;
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      {/* Page header with breadcrumbs */}
      <CloudflarePageHeader
        title={user.full_name}
        description={`User ID: ${userId}`}
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      />
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {getUserTypeTabs()}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</div>
                      <div className="mt-1">{user.full_name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</div>
                      <div className="mt-1">{user.phone_number}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</div>
                      <div className="mt-1">{user.email || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</div>
                      <div className="mt-1">{getUserTypeBadge()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
                      <div className="mt-1">{getStatusBadge()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Joined</div>
                      <div className="mt-1">{formatDate(user.date_joined)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</div>
                      <div className="mt-1">{formatDate(user.last_login)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Recent actions performed by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {user.activity_logs && user.activity_logs.length > 0 ? (
                <div className="space-y-4">
                  {user.activity_logs.map((log, index) => (
                    <div key={index} className="flex items-start pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(log.timestamp)}</p>
                        {log.details && (
                          <p className="text-sm mt-1">{JSON.stringify(log.details)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No recent activity found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Security Settings</CardTitle>
              <CardDescription>Manage user security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Password Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reset the user's password</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setResetPasswordDialog(true)}
                    className="flex items-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Account Status</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Current status: {getStatusBadge()}
                      </p>
                    </div>
                    {user.is_active ? (
                      <Button 
                        variant="outline" 
                        className="text-yellow-600 flex items-center"
                        onClick={() => setStatusDialog({ open: true, action: 'deactivate' })}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend Account
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="text-green-600 flex items-center"
                        onClick={() => setStatusDialog({ open: true, action: 'activate' })}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate Account
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Delete this user account
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="flex items-center"
                      onClick={() => setDeleteDialog(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dynamic user type specific content */}
        {getUserTypeContent()}
      </Tabs>
      
      {/* Status Update Dialog */}
      <UpdateUserStatusDialog
        isOpen={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, action: null })}
        onConfirm={confirmStatusUpdate}
        userName={user.full_name}
        action={statusDialog.action}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={confirmDelete}
        userName={user.full_name}
      />
      
      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        isOpen={resetPasswordDialog}
        onClose={() => setResetPasswordDialog(false)}
        onConfirm={handleResetPassword}
        userName={user.full_name}
      />
    </div>
  );
}