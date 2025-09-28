"use client";

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/admin/adminStore';
import { customToast } from '@/components/ui/custom-toast';
import { CloudflarePageHeader } from '@/components/cloudflare/PageHeader';
import { CloudflareTable } from '@/components/cloudflare/Table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminUsersPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { users, loading, error, fetchUsers, deleteUser } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteUser = async (userId) => {
    const result = await deleteUser(userId);
    if (result.success) {
      customToast.success("User Deleted", {
        description: "The user has been successfully deleted."
      });
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Fixed: Define missing variables
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Users' }
  ];

  // Fixed: Define pageActions (empty array if no actions needed)
  const pageActions = [];

  // Fixed: Define rowsPerPage
  const rowsPerPage = 25;

  const columns = [
    {
      header: 'Name',
      accessor: 'full_name',
      sortable: true,
      filterable: true
    },
    {
      header: 'Phone',
      accessor: 'phone_number',
      sortable: true
    },
    {
      header: 'Type',
      accessor: 'user_type',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Landlord', value: 'landlord' },
        { label: 'Tenant', value: 'tenant' },
        { label: 'Manager', value: 'manager' },
        { label: 'Partner', value: 'partner' },
        { label: 'System Admin', value: 'system_admin' }
      ],
      cell: (row) => {
        const typeLabels = {
          landlord: "Landlord",
          tenant: "Tenant",
          manager: "Manager",
          partner: "Partner",
          system_admin: "Admin"
        };
        const typeColors = {
          landlord: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          tenant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          manager: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
          partner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          system_admin: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
        };
        return (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[row.user_type] || 'bg-gray-100 text-gray-800'}`}>
            {typeLabels[row.user_type] || row.user_type || 'Unknown'}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Blocked', value: 'blocked' }
      ],
      cell: (row) => {
        const status = row.status || (row.is_active ? 'active' : 'blocked');
        const statusColors = {
          active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        };
        return (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      }
    },
    {
      header: 'Joined',
      accessor: 'date_joined',
      sortable: true,
      type: 'date',
      cell: (row) => formatDate(row.date_joined)
    },
    {
      header: 'Last Login',
      accessor: 'last_login',
      sortable: true,
      type: 'date',
      cell: (row) => formatDate(row.last_login)
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log('Delete button clicked for user:', row.full_name); // Debug log
              setUserToDelete(row);
              setDeleteDialogOpen(true); 
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    }
  ];

  // Debug logs
  console.log('Dialog state:', { deleteDialogOpen, userToDelete: userToDelete?.full_name });

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <CloudflarePageHeader
        title="User Management"
        description="View and manage all users in the system"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      />

      <CloudflareTable
        data={users || []}
        columns={columns}
        loading={loading}
        pagination={true}
        rowsPerPageOptions={[10, 25, 50, 100]}
        initialRowsPerPage={rowsPerPage}
        searchable={true}
        selectable={false}
        emptyMessage="No users found."
      />

      {/* Main AlertDialog - exists outside the table rows */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user {userToDelete?.full_name || 'this user'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (userToDelete) {
                  await handleDeleteUser(userToDelete.id);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}