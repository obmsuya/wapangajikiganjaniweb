'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Home, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { CloudflareBreadcrumbs } from '@/components/cloudflare/Breadcrumbs';
import { useAdminStore } from '@/stores/admin/adminStore';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return 'Never';
  const date = new Date(d);
  return date.toLocaleDateString() + ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// User type → Badge variant mapping — no hardcoded colors
const TYPE_VARIANT = {
  landlord:    'default',
  tenant:      'secondary',
  manager:     'outline',
  partner:     'secondary',
  system_admin:'default',
};

const TYPE_LABEL = {
  landlord:    'Landlord',
  tenant:      'Tenant',
  manager:     'Manager',
  partner:     'Partner',
  system_admin:'Admin',
};

const STATUS_VARIANT = {
  active:    'default',
  suspended: 'secondary',
  blocked:   'destructive',
};

function SortButton({ column, label }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc'   ? <ChevronUp className="size-3" />
       : sorted === 'desc' ? <ChevronDown className="size-3" />
       : <ChevronsUpDown className="size-3 text-muted-foreground/40" />}
    </button>
  );
}

const breadcrumbItems = [
  { label: 'Admin', href: '/admin', icon: <Home className="h-4 w-4" /> },
  { label: 'Users',                 icon: <Users className="h-4 w-4" /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { users, loading, error, fetchUsers, deleteUser } = useAdminStore();

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const result = await deleteUser(userToDelete.id);
    if (result?.success) {
      toast.success(`${userToDelete.full_name} deleted`);
    }
    setDeleteOpen(false);
    setUserToDelete(null);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortButton column={column} label="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">
              {row.original.full_name?.charAt(0) ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate">{row.original.full_name}</span>
            <span className="text-xs text-muted-foreground">{row.original.phone_number}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user_type',
      header: 'Type',
      filterFn: (row, _, filterValue) =>
        !filterValue || row.original.user_type === filterValue,
      cell: ({ row }) => (
        <Badge
          variant={TYPE_VARIANT[row.original.user_type] ?? 'outline'}
          className="text-xs capitalize"
        >
          {TYPE_LABEL[row.original.user_type] ?? row.original.user_type ?? 'Unknown'}
        </Badge>
      ),
    },
    {
      id: 'status',
      accessorFn: row => row.status ?? (row.is_active ? 'active' : 'blocked'),
      header: 'Status',
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true;
        const s = row.original.status ?? (row.original.is_active ? 'active' : 'blocked');
        return s === filterValue;
      },
      cell: ({ row }) => {
        const status = row.original.status ?? (row.original.is_active ? 'active' : 'blocked');
        return (
          <Badge variant={STATUS_VARIANT[status] ?? 'secondary'} className="text-xs capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'date_joined',
      header: ({ column }) => <SortButton column={column} label="Joined" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{formatDate(row.original.date_joined)}</span>
      ),
    },
    {
      accessorKey: 'last_login',
      header: ({ column }) => <SortButton column={column} label="Last login" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.original.last_login)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
          onClick={() => { setUserToDelete(row.original); setDeleteOpen(true); }}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ], []);

  // Apply column filters from dropdowns
  const columnFilters = useMemo(() => {
    const f = [];
    if (typeFilter)   f.push({ id: 'user_type', value: typeFilter });
    if (statusFilter) f.push({ id: 'status',    value: statusFilter });
    return f;
  }, [typeFilter, statusFilter]);

  const tableData = useMemo(() =>
    Array.isArray(users) ? users : [], [users]);

  const table = useReactTable({
    data:    tableData,
    columns,
    state:   { sorting, globalFilter, columnFilters },
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div className="flex flex-col gap-4">

      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Admin / Users
        </p>
        <h1 className="text-xl font-medium">User Management</h1>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 flex flex-col gap-4">

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search users..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="w-full pl-8 h-9 text-sm"
              />
            </div>

            {/* Type filter */}
            <Select value={typeFilter || 'all'} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="system_admin">Admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Status filter */}
           <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(typeFilter || statusFilter || globalFilter) && (
              <Button variant="ghost" size="sm"
                onClick={() => { setTypeFilter(''); setStatusFilter(''); setGlobalFilter(''); }}>
                Clear filters
              </Button>
            )}

            {/* Result count */}
            <span className="text-xs text-muted-foreground ml-auto">
              {table.getFilteredRowModel().rows.length} user
              {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="bg-muted/30">
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="h-10 px-3">
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="h-14">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length}
                      className="h-24 text-center text-sm text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={v => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[10, 25, 50, 100].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 tabular-nums">
                {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
              </span>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userToDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteOpen(false); setUserToDelete(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}