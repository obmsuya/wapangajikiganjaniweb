'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Eye, AlertTriangle, RefreshCw, Clock, CheckCircle2, XCircle,
  Download, MoreHorizontal, Filter, Search, Users,
  CreditCard, AlertCircle, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useLandlordSubscriptions, useSubscriptionPlans } from '@/hooks/admin/useAdminPayment';
import SubscriptionDetailContent from './SubscriptionDetailContent';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function daysUntil(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function extractPlans(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.plans)) return raw.plans;
  return [];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status, endDate }) {
  if (!status) return <Badge variant="secondary">No plan</Badge>;
  if (status !== 'active') {
    return (
      <Badge variant="secondary">
        <XCircle data-icon="inline-start" />
        {status === 'cancelled' ? 'Cancelled' : 'Expired'}
      </Badge>
    );
  }
  const days = daysUntil(endDate);
  if (days === null || days <= 0) {
    return <Badge variant="destructive"><XCircle data-icon="inline-start" />Expired</Badge>;
  }
  if (days <= 7) {
    return (
      <Badge variant="outline" className="border-orange-400 text-orange-600">
        <AlertTriangle data-icon="inline-start" />
        {days}d left
      </Badge>
    );
  }
  return <Badge variant="default"><CheckCircle2 data-icon="inline-start" />Active</Badge>;
}

function SortButton({ column, label }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc'  ? <ChevronUp className="size-3" />
       : sorted === 'desc' ? <ChevronDown className="size-3" />
       : <ChevronsUpDown className="size-3 text-muted-foreground/40" />}
    </button>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-xl font-medium tabular-nums leading-none">{value}</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LandlordSubscriptionsList() {
  const [detailsOpen, setDetailsOpen]   = useState(false);
  const [selected, setSelected]         = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([]);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [localFilters, setLocalFilters] = useState({ status: '', plan_type: '' });

  const {
    subscriptions, loading, error,
    updateFilters, refreshSubscriptions, updateSubscription,
  } = useLandlordSubscriptions();

  const rawPlans = useSubscriptionPlans();
  const plans    = extractPlans(rawPlans?.plans ?? rawPlans);

  // Guarantee array before building table data
  const tableData = useMemo(() => {
    if (!Array.isArray(subscriptions)) return [];
    return subscriptions.map(l => ({
      id:             l.id,
      full_name:      l.full_name       ?? '—',
      phone_number:   l.phone_number    ?? '—',
      property_count: l.property_count  ?? 0,
      date_joined:    l.date_joined,
      subscription:   l.subscription    ?? null,
    }));
  }, [subscriptions]);

  // Summary counts derived from table data
  const summary = useMemo(() => {
    const active = tableData.filter(r => {
      const d = daysUntil(r.subscription?.end_date);
      return r.subscription?.status === 'active' && d !== null && d > 0;
    }).length;
    const expiring = tableData.filter(r => {
      const d = daysUntil(r.subscription?.end_date);
      return r.subscription?.status === 'active' && d !== null && d > 0 && d <= 7;
    }).length;
    const expired = tableData.filter(r => {
      if (!r.subscription) return true;
      const d = daysUntil(r.subscription.end_date);
      return r.subscription.status !== 'active' || d === null || d <= 0;
    }).length;
    return { total: tableData.length, active, expiring, expired };
  }, [tableData]);

  const handleView = useCallback((row) => {
    setSelected(row);
    setDetailsOpen(true);
  }, []);

  const applyFilters = () => {
    const next = Object.fromEntries(
      Object.entries(localFilters).filter(([, v]) => v !== '')
    );
    updateFilters(next);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters({ status: '', plan_type: '' });
    updateFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  // ─── Column definitions ───────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortButton column={column} label="Landlord" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium truncate">{row.original.full_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.phone_number}</span>
        </div>
      ),
    },
    {
      id: 'plan',
      accessorFn: row => row.subscription?.plan_name ?? '',
      header: ({ column }) => <SortButton column={column} label="Plan" />,
      cell: ({ row }) => {
        const sub = row.original.subscription;
        if (!sub) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{sub.plan_name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(sub.price)} · <span className="capitalize">{sub.plan_type}</span>
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorFn: row => row.subscription?.status ?? '',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.subscription?.status}
          endDate={row.original.subscription?.end_date}
        />
      ),
    },
    {
      accessorKey: 'property_count',
      header: ({ column }) => <SortButton column={column} label="Properties" />,
      cell: ({ row }) => {
        const { property_count, subscription } = row.original;
        return (
          <span className="text-sm tabular-nums">
            {property_count}
            {subscription?.property_limit && (
              <span className="text-muted-foreground"> / {subscription.property_limit}</span>
            )}
          </span>
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
      id: 'expiry',
      accessorFn: row => row.subscription?.end_date ?? '',
      header: ({ column }) => <SortButton column={column} label="Expires" />,
      cell: ({ row }) => {
        const endDate = row.original.subscription?.end_date;
        if (!endDate) return <span className="text-sm text-muted-foreground">—</span>;
        const days = daysUntil(endDate);
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default w-fit">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm tabular-nums">{formatDate(endDate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{days !== null && days > 0 ? `${days} days remaining` : 'Expired'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => handleView(row.original)}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ], [handleView]);

  // ─── Table instance ───────────────────────────────────────────────────────
  const table = useReactTable({
    data:    tableData,
    columns,
    state:   { sorting, globalFilter },
    onSortingChange:      setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-medium">Landlord subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            {summary.total} {summary.total === 1 ? 'landlord' : 'landlords'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filter popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter data-icon="inline-start" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 size-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium">Filter subscriptions</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select
                    value={localFilters.status}
                    onValueChange={v => setLocalFilters(p => ({ ...p, status: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Plan type</label>
                  <Select
                    value={localFilters.plan_type}
                    onValueChange={v => setLocalFilters(p => ({ ...p, plan_type: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">All plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button size="sm" className="flex-1" onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={refreshSubscriptions}>
                  <RefreshCw data-icon="inline-start" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert('Export coming soon')}>
                  <Download data-icon="inline-start" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <SummaryCard label="Total"         value={summary.total}    icon={Users} />
        <SummaryCard label="Active"        value={summary.active}   icon={CheckCircle2} />
        <SummaryCard label="Expiring soon" value={summary.expiring} icon={AlertCircle} />
        <SummaryCard label="Expired"       value={summary.expired}  icon={XCircle} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Failed to load subscriptions. Please refresh.</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search landlords..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-full pl-8 h-9 text-sm"
        />
      </div>

      {/* Data table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="bg-muted/30">
                {hg.headers.map(header => (
                  <TableHead key={header.id} className="h-10 px-3">
                    {header.isPlaceholder ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={j} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="h-14 hover:bg-muted/20 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No landlords found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} result
          {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="ghost" size="icon" className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription details</DialogTitle>
          </DialogHeader>
          {selected && (
            <SubscriptionDetailContent
              landlord={selected}
              plans={plans}
              onUpdateSubscription={updateSubscription}
              onSubscriptionUpdated={() => {
                setDetailsOpen(false);
                refreshSubscriptions();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}