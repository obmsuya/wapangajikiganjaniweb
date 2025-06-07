// app/(dashboard)/admin/users/page.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersList, useUserOperations } from '@/hooks/admin/useAdminData';
import { CloudflarePageHeader } from '@/components/cloudflare/PageHeader';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { UserFormDialog } from '@/components/admin/users/UserFormDialog';
import { UserFilters } from '@/components/admin/users/UserFilters';

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({});
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Calculate params for API call
  const apiPage = page;
  const apiPageSize = rowsPerPage;
  
  // Fetch users with current filters and pagination
  const { users, loading, error, totalUsers, refetchUsers } = useUsersList(apiPage, apiPageSize);
  
  // User operations hook
  const { activateUsers, deactivateUsers, loading: operationLoading } = useUserOperations();

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle row click to navigate to user detail
  const handleRowClick = (user) => {
    router.push(`/admin/users/${user.id}`);
  };

  // Handle creating a new user
  const handleAddUser = async (userData) => {
    // Here you would call your API to create a user
    console.log('Creating user:', userData);
    // After successful creation, refresh the user list
    refetchUsers();
  };

  // Handle user status change
  const handleActivateUser = async (user) => {
    await activateUsers([user.id]);
    refetchUsers();
  };

  const handleDeactivateUser = async (user) => {
    await deactivateUsers([user.id]);
    refetchUsers();
  };

  // Handle deleting a user
  const handleDeleteUser = async (user) => {
    // Here you would call your API to delete a user
    console.log('Deleting user:', user);
    // After successful deletion, refresh the user list
    refetchUsers();
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Breadcrumb items for this page
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Users' }
  ];

  // Action buttons for the page header
  const pageActions = (
    <>
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => setIsAddUserOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </Button>
    </>
  );

  // Table columns configuration
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
        { label: 'System Admin', value: 'system_admin' }
      ],
      cell: (row) => {
        const typeLabels = {
          landlord: "Landlord",
          tenant: "Tenant",
          manager: "Manager",
          system_admin: "Admin"
        };
        const typeColors = {
          landlord: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          tenant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          manager: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
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
      type: 'actions',
      actions: [
        {
          label: 'Edit',
          icon: <span className="h-4 w-4 text-blue-600">✏️</span>,
          onClick: (user) => router.push(`/admin/users/${user.id}/edit`)
        },
        {
          label: 'Delete',
          icon: <span className="h-4 w-4 text-red-600">🗑️</span>,
          onClick: handleDeleteUser
        },
        {
          label: 'Suspend/Activate',
          icon: <span className="h-4 w-4 text-yellow-600">⚠️</span>,
          onClick: (user) => user.is_active ? handleDeactivateUser(user) : handleActivateUser(user)
        }
      ]
    }
  ];

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      {/* Page header with breadcrumbs */}
      <CloudflarePageHeader
        title="User Management"
        description="View and manage all users in the system"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      />
      
      {/* Filters */}
      <UserFilters onFilterChange={handleFilterChange} />
      
      {/* Users table */}
      <CloudflareTable
        data={users || []}
        columns={columns}
        loading={loading}
        pagination={true}
        rowsPerPageOptions={[10, 25, 50, 100]}
        initialRowsPerPage={rowsPerPage}
        searchable={true}
        selectable={true}
        onRowClick={handleRowClick}
        emptyMessage="No users found. Try adjusting your filters."
      />
      
      {/* Add User Dialog */}
      <UserFormDialog
        isOpen={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleAddUser}
        title="Add New User"
        description="Create a new user account in the system."
        submitLabel="Create User"
      />
    </div>
  );
}