'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Home, Users, Building2, ChevronDown as AccordionChevron,
  Phone, Mail, Shield, UserCheck, UserX, MapPin, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { CloudflareBreadcrumbs } from '@/components/cloudflare/Breadcrumbs';
import { useAdminStore } from '@/stores/admin/adminStore';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

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
      {sorted === 'asc'    ? <ChevronUp className="size-3" />
       : sorted === 'desc' ? <ChevronDown className="size-3" />
       : <ChevronsUpDown className="size-3 text-muted-foreground/40" />}
    </button>
  );
}

const breadcrumbItems = [
  { label: 'Admin', href: '/admin', icon: <Home className="h-4 w-4" /> },
  { label: 'Users',                 icon: <Users className="h-4 w-4" /> },
];

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function TableSkeletonRows({ cols, rows = 8 }) {
  return Array(rows).fill(0).map((_, i) => (
    <TableRow key={i}>
      {Array(cols).fill(0).map((_, j) => (
        <TableCell key={j} className="px-3 py-2">
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Stat pill used inside accordion panels ───────────────────────────────────

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 px-4 py-2 min-w-[72px]">
      <span className="text-lg font-semibold tabular-nums leading-none">{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ─── Landlord Overview Tab ────────────────────────────────────────────────────

function LandlordOverviewTab() {
  const { landlordOverview, overviewLoading, fetchLandlordOverview } = useAdminStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLandlordOverview(); }, [fetchLandlordOverview]);

  const filtered = useMemo(() => {
    if (!search.trim()) return landlordOverview;
    const q = search.toLowerCase();
    return landlordOverview.filter(l =>
      l.full_name?.toLowerCase().includes(q) ||
      l.phone_number?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q)
    );
  }, [landlordOverview, search]);

  if (overviewLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search landlords..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} landlord{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-lg">
          No landlords found
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map(landlord => (
            <AccordionItem
              key={landlord.id}
              value={String(landlord.id)}
              className="border rounded-lg px-0 overflow-hidden"
            >
              {/* ── Accordion trigger — landlord summary row ── */}
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden">
                <div className="flex items-center gap-3 w-full">

                  {/* Avatar */}
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(landlord.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + phone */}
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium truncate leading-tight">
                      {landlord.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {landlord.phone_number}
                    </span>
                  </div>

                  {/* Counts */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Building2 className="size-3" />
                      {landlord.total_properties} prop
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Shield className="size-3" />
                      {landlord.total_managers} mgr
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Users className="size-3" />
                      {landlord.total_tenants} ten
                    </Badge>
                  </div>

                  {/* Status */}
                  <Badge
                    variant={STATUS_VARIANT[landlord.status] ?? 'secondary'}
                    className="text-xs shrink-0 ml-2"
                  >
                    {landlord.status}
                  </Badge>

                  {/* Chevron */}
                  <AccordionChevron className="size-4 text-muted-foreground shrink-0 transition-transform duration-200 ml-1 accordion-chevron" />
                </div>
              </AccordionTrigger>

              {/* ── Accordion content ── */}
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="border-t pt-4 space-y-5">

                  {/* Stat pills
                  <div className="flex flex-wrap gap-2">
                    <StatPill label="Properties" value={landlord.total_properties} />
                    <StatPill label="Managers"   value={landlord.total_managers} />
                    <StatPill label="Tenants"    value={landlord.total_tenants} />
                    <StatPill label="Joined"     value={formatDate(landlord.date_joined)} />
                  </div> */}

                  {/* Landlord contact info */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {landlord.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />{landlord.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />{landlord.phone_number}
                    </span>
                  </div>

                  {/* ── Properties table ── */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Properties
                    </p>
                    {landlord.properties?.length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Location</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Category</TableHead>
                              <TableHead className="h-8 px-3 text-xs text-right">Units</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {landlord.properties.map(p => (
                              <TableRow key={p.id} className="h-10">
                                <TableCell className="px-3 text-sm font-medium">{p.name}</TableCell>
                                <TableCell className="px-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="size-3 shrink-0" />{p.location ?? '—'}
                                  </span>
                                </TableCell>
                                <TableCell className="px-3">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {p.category ?? '—'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-3 text-sm text-right tabular-nums">
                                  {p.total_units ?? 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-1">No properties yet</p>
                    )}
                  </div>

                  {/* ── Managers table ── */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Managers
                    </p>
                    {landlord.managers?.length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Phone</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Manages</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Permissions</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Status</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Added</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {landlord.managers.map(m => (
                              <TableRow key={m.id} className="h-10">
                                <TableCell className="px-3 text-sm font-medium">{m.full_name}</TableCell>
                                <TableCell className="px-3 text-sm text-muted-foreground tabular-nums">
                                  {m.phone_number}
                                </TableCell>
                                <TableCell className="px-3">
                                  {m.managed_properties?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {m.managed_properties.map(mp => (
                                        <Badge key={mp.id} variant="secondary" className="text-xs">
                                          {mp.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">None assigned</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-3">
                                  <div className="flex flex-wrap gap-1">
                                    {m.can_create_tenants    && <Badge variant="outline" className="text-xs">Tenants</Badge>}
                                    {m.can_collect_payments  && <Badge variant="outline" className="text-xs">Payments</Badge>}
                                    {m.can_manage_maintenance && <Badge variant="outline" className="text-xs">Maintenance</Badge>}
                                    {!m.can_create_tenants && !m.can_collect_payments && !m.can_manage_maintenance && (
                                      <span className="text-xs text-muted-foreground italic">None</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-3">
                                  {m.is_active ? (
                                    <Badge variant="default" className="text-xs gap-1">
                                      <UserCheck className="size-3" />Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <UserX className="size-3" />Inactive
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-3 text-xs text-muted-foreground tabular-nums">
                                  {formatDate(m.date_added)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-1">No managers assigned</p>
                    )}
                  </div>

                  {/* ── Tenants table ── */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tenants
                    </p>
                    {landlord.tenants?.length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Phone</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Unit</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Property</TableHead>
                              <TableHead className="h-8 px-3 text-xs text-right">Rent (TZS)</TableHead>
                              <TableHead className="h-8 px-3 text-xs">Move-in</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {landlord.tenants.map(t => (
                              <TableRow key={t.id} className="h-10">
                                <TableCell className="px-3 text-sm font-medium">{t.full_name}</TableCell>
                                <TableCell className="px-3 text-sm text-muted-foreground tabular-nums">
                                  {t.phone_number}
                                </TableCell>
                                <TableCell className="px-3">
                                  <Badge variant="outline" className="text-xs">{t.unit_name}</Badge>
                                </TableCell>
                                <TableCell className="px-3 text-sm text-muted-foreground">
                                  {t.property_name}
                                </TableCell>
                                <TableCell className="px-3 text-sm text-right tabular-nums">
                                  {t.rent_amount?.toLocaleString()}
                                </TableCell>
                                <TableCell className="px-3 text-xs text-muted-foreground tabular-nums">
                                  {t.move_in_date ? formatDate(t.move_in_date) : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-1">No active tenants</p>
                    )}
                  </div>

                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// ─── All Users Tab ────────────────────────────────────────────────────────────

function AllUsersTab() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { users, loading, fetchUsers, deleteUser } = useAdminStore();

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
      // Hidden column — exists only so globalFilter can match phone numbers
      id: 'phone_number',
      accessorKey: 'phone_number',
      header: '',
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortButton column={column} label="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(row.original.full_name)}
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
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
          {row.original.email ?? '—'}
        </span>
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
        const s = row.original.status ?? (row.original.is_active ? 'active' : 'blocked');
        return (
          <Badge variant={STATUS_VARIANT[s] ?? 'secondary'} className="text-xs capitalize">
            {s}
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
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => { setUserToDelete(row.original); setDeleteOpen(true); }}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ], []);

  const columnFilters = useMemo(() => {
    const f = [];
    if (typeFilter)   f.push({ id: 'user_type', value: typeFilter });
    if (statusFilter) f.push({ id: 'status',    value: statusFilter });
    return f;
  }, [typeFilter, statusFilter]);

  const tableData = useMemo(() => Array.isArray(users) ? users : [], [users]);

  const table = useReactTable({
    data:    tableData,
    columns,
    state:   { sorting, globalFilter, columnFilters, columnVisibility: { phone_number: false } },
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div className="space-y-4 mt-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, phone, email..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full pl-8 h-9 text-sm"
          />
        </div>

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

        {(typeFilter || statusFilter || globalFilter) && (
          <Button variant="ghost" size="sm"
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setGlobalFilter(''); }}>
            Clear filters
          </Button>
        )}

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
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows cols={columns.length} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { users, landlordOverview } = useAdminStore();

  return (
    <div className="flex flex-col gap-4">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Admin / Users
        </p>
        <h1 className="text-xl font-medium">User Management</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="users" className="text-sm gap-2">
            <Users className="size-3.5" />
            All users
            {users.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1 h-4 px-1.5">
                {users.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-sm gap-2">
            <Building2 className="size-3.5" />
            Landlord overview
            {landlordOverview.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1 h-4 px-1.5">
                {landlordOverview.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AllUsersTab />
        </TabsContent>

        <TabsContent value="overview">
          <LandlordOverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}