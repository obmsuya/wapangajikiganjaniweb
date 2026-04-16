'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle, RefreshCw, Eye, Phone,
  Download, ArrowRightCircle, Search,
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { useFailedPayments } from '@/hooks/admin/useAdminPayment';
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

function SortButton({ column, label }) {
  const sorted = column.getIsSorted();
  return (
    <button className="flex items-center gap-1 text-xs font-medium"
      onClick={() => column.toggleSorting(sorted === 'asc')}>
      {label}
      {sorted === 'asc'   ? <ChevronUp className="size-3" />
       : sorted === 'desc' ? <ChevronDown className="size-3" />
       : <ChevronsUpDown className="size-3 text-muted-foreground/40" />}
    </button>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-medium tabular-nums leading-none">{value}</p>
    </div>
  );
}

// Categorise error text into a readable label
function categoriseError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('insufficient') || m.includes('balance')) return 'Insufficient funds';
  if (m.includes('timeout') || m.includes('timed out'))    return 'Timeout';
  if (m.includes('invalid') || m.includes('wrong'))        return 'Invalid details';
  if (m.includes('cancelled') || m.includes('canceled'))   return 'Cancelled';
  if (m.includes('network') || m.includes('connection'))   return 'Network issue';
  return 'Other';
}

export default function FailedPaymentsList() {
  const [detailsOpen, setDetailsOpen]       = useState(false);
  const [contactOpen, setContactOpen]       = useState(false);
  const [selected, setSelected]             = useState(null);
  const [contactMsg, setContactMsg]         = useState('');
  const [globalFilter, setGlobalFilter]     = useState('');
  const [sorting, setSorting]               = useState([{ id: 'created_at', desc: true }]);
  const [limit, setLimit]                   = useState(50);

  const { payments, loading, error, refreshPayments } = useFailedPayments(limit);

  // Normalise + enrich rows
  const tableData = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return payments.map(p => ({
      ...p,
      error_message: p.azampay?.error_message ?? 'Payment processing failed',
      error_category: categoriseError(p.azampay?.error_message ?? ''),
    }));
  }, [payments]);

  // Error category breakdown for summary cards
  const errorStats = useMemo(() => {
    return tableData.reduce((acc, p) => {
      acc[p.error_category] = (acc[p.error_category] ?? 0) + 1;
      return acc;
    }, {});
  }, [tableData]);

  const openDetails = useCallback((row) => { setSelected(row); setDetailsOpen(true); }, []);

  const openContact = useCallback((row) => {
    setSelected(row);
    setContactMsg(
      `Dear ${row.payer?.full_name ?? 'customer'},\n\nWe noticed your payment of ${formatCurrency(row.amount)} for ${row.payment_type} failed on ${formatDate(row.created_at)}.\n\nPlease try again or contact our support team.\n\nRegards,\nWapangaji Team`
    );
    setContactOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    if (!tableData.length) return;
    const rows = [
      ['ID','Date','Amount','Type','Payer','Phone','Error'].join(','),
      ...tableData.map(t => [
        t.id,
        new Date(t.created_at).toISOString().split('T')[0],
        t.amount, t.payment_type,
        t.payer?.full_name   ?? '',
        t.payer?.phone_number ?? '',
        (t.error_message ?? '').replace(/,/g, ';'),
      ].join(',')),
    ];
    const url  = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `failed-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tableData]);

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
      accessorKey: 'payment_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.payment_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'payer',
      header: 'Payer',
      cell: ({ row }) => {
        const payer = row.original.payer;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">
                {payer?.full_name?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">{payer?.full_name ?? '—'}</span>
              {payer?.phone_number && (
                <span className="text-xs text-muted-foreground">{payer.phone_number}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'error_category',
      header: 'Error',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 max-w-[200px]">
          <Badge variant="destructive" className="text-xs w-fit">
            {row.original.error_category}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {row.original.error_message}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => openDetails(row.original)}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => openContact(row.original)}>
            <Phone className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [openDetails, openContact]);

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
          <h2 className="text-base font-medium">Failed payments</h2>
          <p className="text-sm text-muted-foreground">{tableData.length} failed transactions</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="25">Last 25</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="250">Last 250</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"
            onClick={handleExport} disabled={loading || !tableData.length}>
            <Download data-icon="inline-start" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={refreshPayments} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error category summary */}
      {Object.keys(errorStats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {Object.entries(errorStats).map(([cat, count]) => (
            <SummaryCard key={cat} label={cat} value={count} />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Failed to load payment data.</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or error..."
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
              Array(5).fill(0).map((_, i) => (
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
                  No failed payments found
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

      {/* Detail dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Failed transaction details</DialogTitle></DialogHeader>
          {selected && (
            <TransactionDetailsContent
              transactionId={selected.id}
              onClose={() => setDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Contact dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Contact user</DialogTitle></DialogHeader>

          {selected?.payer && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Avatar className="size-9">
                  <AvatarFallback className="text-sm">
                    {selected.payer.full_name?.charAt(0) ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-medium">{selected.payer.full_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    {selected.payer.phone_number}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea
                  value={contactMsg}
                  onChange={e => setContactMsg(e.target.value)}
                  className="min-h-[160px] resize-none text-sm"
                />
              </div>

              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-xs">
                  This will send an SMS notification to the user.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button onClick={() => { console.log('send:', contactMsg); setContactOpen(false); }}>
              <ArrowRightCircle data-icon="inline-start" />
              Send notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}