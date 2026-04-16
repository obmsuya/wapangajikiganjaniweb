"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Filter,
  Eye,
  UserX,
  UserCheck,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  usePartnersList,
  usePartnerActions,
} from "@/hooks/admin/useAdminPartner";
import { toast } from "sonner";

function formatCurrency(amount) {
  if (!amount) return "TZS 0";
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function SortButton({ column, label }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ChevronUp className="size-3" />
      ) : sorted === "desc" ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 text-muted-foreground/40" />
      )}
    </button>
  );
}

export default function PartnersListTable() {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const { partners, loading, filters, updateFilters, refreshPartners } =
    usePartnersList();
  const { suspendPartner, activatePartner, suspending, activating } =
    usePartnerActions();

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }
    try {
      await suspendPartner(selected.id, suspendReason);
      setSuspendOpen(false);
      setSuspendReason("");
      refreshPartners();
    } catch {
      /* handled by hook */
    }
  };

  const handleActivate = async () => {
    try {
      await activatePartner(selected.id);
      setActivateOpen(false);
      refreshPartners();
    } catch {
      /* handled by hook */
    }
  };

  const openSuspend = useCallback((row) => {
    setSelected(row);
    setSuspendOpen(true);
  }, []);
  const openActivate = useCallback((row) => {
    setSelected(row);
    setActivateOpen(true);
  }, []);

  const applyFilters = () => {
    updateFilters(statusFilter ? { status: statusFilter } : {});
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setStatusFilter("");
    updateFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.values(filters ?? {}).filter(Boolean).length;

  const tableData = useMemo(
    () => (Array.isArray(partners) ? partners : []),
    [partners],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortButton column={column} label="Partner" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">
                {row.original.name?.charAt(0) ?? "P"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">
                {row.original.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.original.phone_number}
              </span>
              {row.original.email && (
                <span className="text-xs text-muted-foreground truncate">
                  {row.original.email}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "referral_code",
        header: "Code",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.referral_code}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="default" className="text-xs">
              <UserCheck data-icon="inline-start" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <UserX data-icon="inline-start" />
              Suspended
            </Badge>
          ),
      },
      {
        accessorKey: "total_referrals",
        header: ({ column }) => (
          <SortButton column={column} label="Referrals" />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.total_referrals ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "total_earned",
        header: ({ column }) => <SortButton column={column} label="Earned" />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums font-medium">
            {formatCurrency(row.original.total_earned)}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => <SortButton column={column} label="Joined" />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <span className="text-base leading-none">···</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => toast.info("Details view coming soon")}
                >
                  <Eye data-icon="inline-start" />
                  View details
                </DropdownMenuItem>
                {row.original.is_active ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => openSuspend(row.original)}
                  >
                    <UserX data-icon="inline-start" />
                    Suspend
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => openActivate(row.original)}>
                    <UserCheck data-icon="inline-start" />
                    Activate
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openSuspend, openActivate],
  );

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
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium">Partners</h2>
          <p className="text-sm text-muted-foreground">
            {tableData.length} {tableData.length === 1 ? "partner" : "partners"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-none">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter data-icon="inline-start" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 size-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" align="end">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium">Filter partners</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Reset
                  </Button>
                  <Button size="sm" className="flex-1" onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search partners..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full pl-8 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30">
                {hg.headers.map((h) => (
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
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-14">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No partners found
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
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {table.getState().pagination.pageIndex + 1} /{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Suspend dialog */}
      <Dialog
        open={suspendOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendOpen(false);
            setSuspendReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Suspend {selected?.name}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            This prevents them from receiving new referral commissions.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Reason
            </label>
            <Select value={suspendReason} onValueChange={setSuspendReason}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="violation">Terms violation</SelectItem>
                  <SelectItem value="fraud">Fraudulent activity</SelectItem>
                  <SelectItem value="inactive">Inactivity</SelectItem>
                  <SelectItem value="admin">Administrative action</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendOpen(false);
                setSuspendReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspending || !suspendReason}
            >
              {suspending ? "Suspending…" : "Suspend partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate confirm */}
      <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {selected?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores their ability to receive referral commissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={activating}>
              {activating ? "Activating…" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
