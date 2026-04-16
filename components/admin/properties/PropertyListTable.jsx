'use client';

import { useState, useMemo } from 'react';
import { usePropertiesList, useDeleteProperty } from '@/hooks/admin/useAdminProperties';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuGroup, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Eye, Trash2, MoreHorizontal, ChevronUp, ChevronDown,
  ChevronsUpDown, Search, Building, MapPin, User, Calendar,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

// Occupancy badge — no hardcoded colors, uses semantic tokens via variant logic
function OccupancyBadge({ rate = 0 }) {
  const variant = rate >= 80 ? 'default' : rate >= 50 ? 'secondary' : 'destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${rate}%` }}
        />
      </div>
      <Badge variant={variant} className="tabular-nums">{rate}%</Badge>
    </div>
  );
}

// Sort icon helper
function SortIcon({ sorted }) {
  if (sorted === 'asc')  return <ChevronUp className="ml-1 size-3.5 shrink-0" />;
  if (sorted === 'desc') return <ChevronDown className="ml-1 size-3.5 shrink-0" />;
  return <ChevronsUpDown className="ml-1 size-3.5 shrink-0 text-muted-foreground/50" />;
}

export default function PropertyListTable() {
  const [globalFilter, setGlobalFilter]   = useState('');
  const [sorting, setSorting]             = useState([{ id: 'created_at', desc: true }]);
  const [selectedProperty, setSelected]   = useState(null);
  const [detailOpen, setDetailOpen]       = useState(false);
  const [idToDelete, setIdToDelete]       = useState(null);

  const { properties, loading, error, filters, updateFilters, updatePagination, limit } = usePropertiesList();
  const { remove } = useDeleteProperty();

  const proceedDelete = async () => {
    try {
      await remove(idToDelete);
      toast.success('Property deleted');
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      setIdToDelete(null);
    }
  };

  // Column definitions
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Property <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
          <span>{row.original.location}</span>
        </div>
      ),
    },
    {
      accessorKey: 'total_units',
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Units <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => {
        const { total_units, occupancy_rate } = row.original;
        const occupied = total_units ? Math.round((occupancy_rate / 100) * total_units) : 0;
        return (
          <div className="flex flex-col">
            <span className="font-medium tabular-nums">{total_units}</span>
            <span className="text-xs text-muted-foreground">{occupied} occupied</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'occupancy_rate',
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Occupancy <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => <OccupancyBadge rate={row.original.occupancy_rate || 0} />,
    },
    {
      accessorKey: 'owner_name',
      header: 'Owner',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span>{row.original.owner_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
          <span className="tabular-nums text-sm">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => { setSelected(row.original); setDetailOpen(true); }}
              >
                <Eye data-icon="inline-start" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIdToDelete(row.original.id)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: properties ?? [],
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

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-8 h-8 text-sm"
          />
        </div>
        {globalFilter && (
          <Button variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>
            Clear
          </Button>
        )}
      </div>

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
              // Skeleton rows
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
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
                  No properties found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
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
          <span className="px-2 text-sm">
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

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
            <DialogDescription>Read-only overview of this property</DialogDescription>
          </DialogHeader>
          {selectedProperty
            ? <PropertyDetailPanel property={selectedProperty} />
            : <Skeleton className="h-48 w-full" />
          }
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!idToDelete} onOpenChange={() => setIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The property will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedDelete}
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

// Detail panel — labeled key-value pairs, no custom colors
function PropertyDetailPanel({ property }) {
  if (!property) return null;

  const fields = [
    { label: 'Name',           value: property.name },
    { label: 'Category',       value: property.category },
    { label: 'Location',       value: property.location },
    { label: 'Total Floors',   value: property.total_floors },
    { label: 'Total Units',    value: property.total_units },
    { label: 'Occupancy Rate', value: `${property.occupancy_rate}%` },
    { label: 'Owner',          value: property.owner_name, span: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
      {fields.map(({ label, value, span }) => (
        <div key={label} className={span ? 'col-span-2' : ''}>
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-medium">{value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}