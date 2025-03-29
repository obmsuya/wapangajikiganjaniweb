'use client';

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { 
  ChevronDown, 
  MoreHorizontal, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  UserCog,
  Key,
  ShieldAlert,
  Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserData } from '@/services/auth';

// Format date utility function
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Define table columns
export const columns: ColumnDef<UserData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('full_name')}</div>
    ),
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone Number',
    cell: ({ row }) => <div>{row.getValue('phone_number')}</div>,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active');
      
      return (
        <Badge variant={isActive ? 'default' : 'destructive'} className="font-medium">
          {isActive ? (
            <><Check className="h-3.5 w-3.5 mr-1" /> Active</>
          ) : (
            <><X className="h-3.5 w-3.5 mr-1" /> Inactive</>
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'is_staff',
    header: 'Role',
    cell: ({ row }) => {
      const isStaff = row.getValue('is_staff');
      const isSuperuser = row.original.is_superuser;
      
      if (isSuperuser) {
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary font-medium">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Admin
          </Badge>
        );
      } else if (isStaff) {
        return (
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary font-medium">
            <UserCog className="h-3.5 w-3.5 mr-1" /> Staff
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="font-medium">
            User
          </Badge>
        );
      }
    },
  },
  {
    accessorKey: 'date_joined',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joined Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{formatDate(row.getValue('date_joined'))}</div>,
  },
  {
    accessorKey: 'last_login',
    header: 'Last Login',
    cell: ({ row }) => (
      <div className="flex items-center">
        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        {formatDate(row.getValue('last_login'))}
      </div>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => console.log('View details', user)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit user', user)}>
              Edit user
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log('Reset password', user)}>
              <Key className="h-4 w-4 mr-2" />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => console.log(user.is_active ? 'Deactivate' : 'Activate', user)}
              className={user.is_active ? 'text-destructive focus:text-destructive' : 'text-success focus:text-success'}
            >
              {user.is_active ? 'Deactivate user' : 'Activate user'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface DataTableProps {
  data: UserData[];
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

export function UserDataTable({
  data,
  pageCount,
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isLoading = false,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1, // 0-based index for the table
        pageSize: pageSize,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Handle search and filtering
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.getColumn('full_name')?.setFilterValue(event.target.value);
  };

  // Handle pagination manually since we're using server-side pagination
  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-2 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <Input
            placeholder="Search by name..."
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setRowSelection({})}>
            Clear selection
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                View <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'is_staff' ? 'Role' : column.id.replace(/_/g, ' ')}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state with empty rows as placeholders
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: table.getAllColumns().length }).map((_, colIndex) => (
                    <TableCell key={`loading-cell-${colIndex}`} className="h-12">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} of{" "}
            {data.length} row(s) selected.
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}