'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Calendar, Download, Eye, RefreshCw, CreditCard,
  Check, XCircle, AlertTriangle, Search,
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { useTransactionHistory } from '@/hooks/admin/useAdminPayment';
import TransactionDetailsContent from './TransactionDetailsContent';

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  if (!d) return '—';
  return format(new Date(d), 'PP p');
}

function StatusBadge({ status }) {
  const variant =
    status === 'completed' ? 'default' :
    status === 'failed'    ? 'destructive' : 'secondary';
  const Icon =
    status === 'completed' ? Check :
    status === 'failed'    ? XCircle : AlertTriangle;
  return (
    <Badge variant={variant} className="text-xs capitalize">
      <Icon data-icon="inline-start" />
      {status}
    </Badge>
  );
}

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

// Summary mini stat
function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-medium tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 tabular-nums">{sub}</p>}
    </div>
  );
}

export default function TransactionsList() {
  const [detailsOpen, setDetailsOpen]   = useState(false);
  const [selected, setSelected]         = useState(null);
  const [isClient, setIsClient]         = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([{ id: 'created_at', desc: true }]);
  const [dateRange, setDateRange]       = useState({
    from: new Date(new Date().setDate(1)),
    to:   new Date(),
  });

  const { transactions, loading, error, updateFilters, refreshTransactions } =
    useTransactionHistory({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date:   format(dateRange.to,   'yyyy-MM-dd'),
      limit: 100,
    });

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient) return;
    updateFilters({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date:   format(dateRange.to,   'yyyy-MM-dd'),
    });
  }, [dateRange, isClient, updateFilters]);

  // Summary counts
  const summary = useMemo(() => {
    const txns = Array.isArray(transactions) ? transactions : [];
    const completed = txns.filter(t => t.status === 'completed');
    return {
      total:        txns.length,
      completed:    completed.length,
      pending:      txns.filter(t => t.status === 'pending').length,
      failed:       txns.filter(t => t.status === 'failed').length,
      totalAmount:  completed.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
      subAmount:    completed.filter(t => t.payment_type === 'subscription').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
    };
  }, [transactions]);

  // CSV export
  const handleExport = useCallback(() => {
    const txns = Array.isArray(transactions) ? transactions : [];
    if (!txns.length) return;
    const rows = [
      ['ID','Date','Amount','Type','Status','Payer','Phone','Provider'].join(','),
      ...txns.map(t => [
        t.id,
        new Date(t.created_at).toISOString().split('T')[0],
        t.amount, t.payment_type, t.status,
        t.payer?.full_name ?? '',
        t.payer?.phone_number ?? '',
        t.azampay?.provider ?? '',
      ].join(',')),
    ];
    const url  = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transactions]);

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[80px] block">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <SortButton column={column} label="Date" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <SortButton column={column} label="Amount" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'payer',
      header: 'Payer',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.original.payer?.full_name ?? '—'}</span>
          {row.original.payer?.phone_number && (
            <span className="text-xs text-muted-foreground">{row.original.payer.phone_number}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'payment_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.payment_type;
        return (
          <Badge variant="outline" className="text-xs capitalize">
            {type === 'subscription'
              ? <><CreditCard data-icon="inline-start" />Subscription</>
              : <><Calendar data-icon="inline-start" />Rent</>}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {row.original.azampay?.provider ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost" size="icon" className="size-8"
          onClick={() => { setSelected(row.original); setDetailsOpen(true); }}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ], []);

  const tableData = useMemo(() =>
    Array.isArray(transactions) ? transactions : [], [transactions]);

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

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium">Transaction history</h2>
          <p className="text-sm text-muted-foreground">{summary.total} transactions</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {isClient && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar data-icon="inline-start" />
                  {format(dateRange.from, 'PP')} – {format(dateRange.to, 'PP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarUI
                  mode="range"
                  selected={dateRange}
                  onSelect={range => { if (range?.from && range?.to) setDateRange(range); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          <Button variant="outline" size="sm"
            onClick={handleExport} disabled={loading || !tableData.length}>
            <Download data-icon="inline-start" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={refreshTransactions} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <SummaryCard label="Total"     value={summary.total}                          sub={formatCurrency(summary.totalAmount)} />
        <SummaryCard label="Completed" value={summary.completed}                      sub={formatCurrency(summary.subAmount) + ' subscriptions'} />
        <SummaryCard label="Pending"   value={summary.pending} />
        <SummaryCard label="Failed"    value={summary.failed} />
      </div> */}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Failed to load transactions.</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search transactions..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-full pl-8 h-9 text-sm"
        />
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No transactions found
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Transaction details</DialogTitle></DialogHeader>
          {selected && (
            <TransactionDetailsContent
              transactionId={selected.id}
              onClose={() => setDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}