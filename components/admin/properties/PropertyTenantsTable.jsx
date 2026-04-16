'use client';

import { useState, useMemo } from 'react';
import { useTenantsList, useDeleteTenant } from '@/hooks/admin/useAdminProperties';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Trash2, Search, User, Phone, Home, Building,
  DollarSign, Calendar as CalendarIcon, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Filter, X,
} from 'lucide-react';

// Status badge — maps to shadcn Badge variants only
function StatusBadge({ status }) {
  const variant =
    status === 'active'   ? 'default'     :
    status === 'inactive' ? 'destructive' : 'secondary';
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

function SortIcon({ sorted }) {
  if (sorted === 'asc')  return <ChevronUp className="ml-1 size-3.5 shrink-0" />;
  if (sorted === 'desc') return <ChevronDown className="ml-1 size-3.5 shrink-0" />;
  return <ChevronsUpDown className="ml-1 size-3.5 shrink-0 text-muted-foreground/50" />;
}

export default function PropertyTenantsTable() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([{ id: 'created_at', desc: true }]);

  const { tenants, limit, loading, filters, updateFilters } = useTenantsList();
  const { remove } = useDeleteTenant();

  const handleDelete = async (id, name) => {
    try {
      await remove(id);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <button className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Tenant <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.full_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone_number',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 text-muted-foreground shrink-0" />
          <span className="tabular-nums text-sm">{row.original.phone_number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'current_property',
      header: 'Property',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm">{row.original.current_property || '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'current_unit',
      header: 'Unit',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Home className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm">{row.original.current_unit || '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'rent_amount',
      header: ({ column }) => (
        <button className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Rent <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="size-3.5 text-muted-foreground shrink-0" />
          <span className="tabular-nums text-sm">
            {row.original.rent_amount
              ? Number(row.original.rent_amount).toLocaleString()
              : '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Registered <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {row.original.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the tenant and all related records — payments,
                schedules, occupancies, and their user account. Their phone number
                becomes available immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(row.original.id, row.original.full_name)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ], []);

  const table = useReactTable({
    data: tenants ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: limit ?? 10 } },
  });

  // Active filter chips
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== '' && v !== null);

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {globalFilter && (
          <Button variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>Clear</Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1.5 pr-1.5">
              {key}: {value}
              <button
                onClick={() => {
                  const next = { ...filters };
                  delete next[key];
                  updateFilters(next);
                }}
                className="rounded-sm hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => updateFilters({})}>
            Clear all
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} className="text-xs h-10">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="h-12">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                  No tenants found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} tenant{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
  );
}

// ─── PropertyFilters ────────────────────────────────────────────────────────

export function PropertyFilters({ filters, updateFilters, loading, propertyCategories, owners, locations }) {
  const [local, setLocal] = useState({
    owner_id:       filters.owner_id       || '',
    category:       filters.category       || '',
    location:       filters.location       || '',
    occupancy_min:  filters.occupancy_min  ?? 0,
    occupancy_max:  filters.occupancy_max  ?? 100,
    created_after:  filters.created_after  || null,
    created_before: filters.created_before || null,
  });

  const [dateRange, setDateRange] = useState({
    from: filters.created_after  ? new Date(filters.created_after)  : null,
    to:   filters.created_before ? new Date(filters.created_before) : null,
  });

  const formatDate = (d) => d?.toISOString().split('T')[0] ?? null;

  const apply = () => {
    // Strip empty values before sending
    const next = Object.fromEntries(
      Object.entries({
        ...local,
        created_after:  formatDate(dateRange.from),
        created_before: formatDate(dateRange.to),
      }).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    updateFilters(next);
  };

  const reset = () => {
    setLocal({ owner_id: '', category: '', location: '', occupancy_min: 0, occupancy_max: 100, created_after: null, created_before: null });
    setDateRange({ from: null, to: null });
    updateFilters({});
  };

  const set = (key, value) => setLocal(prev => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="size-3.5" /> Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">

        {/* Selects row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Owner</label>
            {loading ? <Skeleton className="h-9 w-full" /> : (
              <Select value={local.owner_id} onValueChange={(v) => set('owner_id', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All owners" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">All owners</SelectItem>
                    {owners?.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            {loading ? <Skeleton className="h-9 w-full" /> : (
              <Select value={local.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">All categories</SelectItem>
                    {propertyCategories?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            {loading ? <Skeleton className="h-9 w-full" /> : (
              <Select value={local.location} onValueChange={(v) => set('location', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All locations" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">All locations</SelectItem>
                    {locations?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

        </div>

        <Separator />

        {/* Occupancy slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Occupancy range</label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {local.occupancy_min}% – {local.occupancy_max}%
            </span>
          </div>
          {loading ? <Skeleton className="h-4 w-full" /> : (
            <Slider
              value={[local.occupancy_min, local.occupancy_max]}
              min={0} max={100} step={1}
              onValueChange={([min, max]) => setLocal(p => ({ ...p, occupancy_min: min, occupancy_max: max }))}
            />
          )}
        </div>

        <Separator />

        {/* Date range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Created between</label>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-sm font-normal">
                  <CalendarIcon data-icon="inline-start" />
                  {dateRange.from
                    ? dateRange.to
                      ? `${formatDate(dateRange.from)} → ${formatDate(dateRange.to)}`
                      : formatDate(dateRange.from)
                    : 'Pick a date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: null, to: null })}>
                <X data-icon="inline-start" /> Clear dates
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          <Button size="sm" onClick={apply}>Apply filters</Button>
        </div>

      </CardContent>
    </Card>
  );
}