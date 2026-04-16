'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Eye, AlertTriangle, RefreshCw, Clock, CheckCircle2,
  XCircle, Download, MoreHorizontal, Filter, Search,
  Users, CreditCard, AlertCircle, X,
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
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { useLandlordSubscriptions, useSubscriptionPlans } from '@/hooks/admin/useAdminPayment';
import SubscriptionDetailContent from './SubscriptionDetailContent';

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

function StatusBadge({ status, endDate }) {
  if (!status) return <Badge variant="secondary">No subscription</Badge>;
  if (status !== 'active') {
    return (
      <Badge variant="secondary">
        <XCircle data-icon="inline-start" />
        {status === 'cancelled' ? 'Cancelled' : 'Expired'}
      </Badge>
    );
  }
  const days = daysUntil(endDate);
  if (days <= 0)  return <Badge variant="destructive"><XCircle data-icon="inline-start" />Expired</Badge>;
  if (days <= 7)  return <Badge variant="outline" className="text-warning border-warning"><AlertTriangle data-icon="inline-start" />Expiring in {days}d</Badge>;
  return <Badge variant="default"><CheckCircle2 data-icon="inline-start" />Active</Badge>;
}

// Summary mini-card — same muted pattern as rest of app
function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-xl font-medium tabular-nums">{value}</p>
    </div>
  );
}

export default function LandlordSubscriptionsList() {
  const [detailsOpen, setDetailsOpen]         = useState(false);
  const [selectedLandlord, setSelected]       = useState(null);
  const [globalFilter, setGlobalFilter]       = useState('');
  const [sorting, setSorting]                 = useState([]);
  const [filterPopoverOpen, setFilterPopover] = useState(false);
  const [localFilters, setLocalFilters]       = useState({ status: '', plan_type: '' });

  const {
    subscriptions, loading, error, filters,
    updateFilters, refreshSubscriptions, updateSubscription,
  } = useLandlordSubscriptions();

  const { plans: rawPlans } = useSubscriptionPlans();
  const plans = Array.isArray(rawPlans) ? rawPlans
    : Array.isArray(rawPlans?.plans) ? rawPlans.plans
    : [];

  // Normalise rows — guarantees shape regardless of API variance
  const tableData = useMemo(() => {
    if (!Array.isArray(subscriptions)) return [];
    return subscriptions.map(l => ({
      id:             l.id,
      full_name:      l.full_name,
      phone_number:   l.phone_number,
      property_count: l.property_count,
      date_joined:    l.date_joined,
      subscription:   l.subscription,
    }));
  }, [subscriptions]);

  // Summary counts
  const summary = useMemo(() => {
    const active   = tableData.filter(r => r.subscription?.status === 'active' && daysUntil(r.subscription?.end_date) > 0).length;
    const expiring = tableData.filter(r => {
      const d = daysUntil(r.subscription?.end_date);
      return r.subscription?.status === 'active' && d !== null && d > 0 && d <= 7;
    }).length;
    const expired  = tableData.filter(r => !r.subscription || daysUntil(r.subscription?.end_date) <= 0 || r.subscription?.status !== 'active').length;
    return { total: tableData.length, active, expiring, expired };
  }, [tableData]);

  const handleView = useCallback((landlord) => {
    setSelected(landlord);
    setDetailsOpen(true);
  }, []);

  const applyFilters = () => {
    const next = Object.fromEntries(
      Object.entries(localFilters).filter(([, v]) => v !== '')
    );
    updateFilters(next);
    setFilterPopover(false);
  };

  const clearFilters = () => {
    setLocalFilters({ status: '', plan_type: '' });
    updateFilters({});
    setFilterPopover(false);
  };

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: 'Landlord',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.original.full_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.phone_number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'subscription',
      header: 'Plan',
      cell: ({ row }) => {
        const sub = row.original.subscription;
        if (!sub) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{sub.plan_name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(sub.price)} · {sub.plan_type}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
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
      header: 'Properties',
      cell: ({ row }) => {
        const { property_count, subscription } = row.original;
        return (
          <span className="text-sm tabular-nums">
            {property_count}
            {subscription && (
              <span className="text-muted-foreground"> / {subscription.property_limit}</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'date_joined',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{formatDate(row.original.date_joined)}</span>
      ),
    },
    {
      id: 'expiry',
      header: 'Expires',
      cell: ({ row }) => {
        const endDate = row.original.subscription?.end_date;
        if (!endDate) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-sm tabular-nums">{formatDate(endDate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expires {new Date(endDate).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleView(row.original)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ], [handleView]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-medium">Landlord subscriptions</h2>
          <p className="text-sm text-muted-foreground">{summary.total} landlords</p>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter data-icon="inline-start" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 size-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium">Filter subscriptions</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={localFilters.status} onValueChange={v => setLocalFilters(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
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
                  <Select value={localFilters.plan_type} onValueChange={v => setLocalFilters(p => ({ ...p, plan_type: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All plans" /></SelectTrigger>
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>Reset</Button>
                  <Button size="sm" className="flex-1" onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal data-icon="inline-start" />
                Actions
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
        <SummaryCard label="Total"          value={summary.total}    icon={Users} />
        <SummaryCard label="Active"         value={summary.active}   icon={CheckCircle2} />
        <SummaryCard label="Expiring soon"  value={summary.expiring} icon={AlertCircle} />
        <SummaryCard label="Expired"        value={summary.expired}  icon={XCircle} />
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

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="text-xs h-10">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No landlords found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            ‹
          </Button>
          <span className="px-2 text-sm">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            ›
          </Button>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription details</DialogTitle>
          </DialogHeader>
          {selectedLandlord && (
            <SubscriptionDetailContent
              landlord={selectedLandlord}
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