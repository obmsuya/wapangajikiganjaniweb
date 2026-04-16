"use client";

import { useState, useMemo } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Edit,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  useReactTable,
} from "@tanstack/react-table";
import { useCommissionRates } from "@/hooks/admin/useAdminPartner";
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

// Reusable table — no CloudflareTable, no legacy filters
function RatesTable({ data, loading, columns, emptyMessage }) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/30">
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="h-9 px-3">
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
            Array(3)
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
              <TableRow key={row.id} className="h-12">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-16 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function CommissionRatesManager() {
  const [editOpen, setEditOpen] = useState(false);
  const [bulkRates, setBulkRates] = useState({});

  const { rates, loading, updating, updateRates, refreshRates } =
    useCommissionRates();

  const allPlans = useMemo(
    () => [
      ...(rates?.plans_with_rates ?? []),
      ...(rates?.plans_without_rates ?? []),
    ],
    [rates],
  );

  const handleBulkEdit = () => {
    const initial = {};
    allPlans.forEach((p) => {
      initial[p.plan_id] = p.commission_percentage ?? 0;
    });
    setBulkRates(initial);
    setEditOpen(true);
  };

  const handleRateChange = (planId, value) => {
    const num = parseFloat(value) || 0;
    if (num < 0 || num > 100) {
      toast.error("Rate must be between 0% and 100%");
      return;
    }
    setBulkRates((prev) => ({ ...prev, [planId]: num }));
  };

  const handleSave = async () => {
    try {
      await updateRates(
        Object.entries(bulkRates).map(([id, rate]) => ({
          plan_id: parseInt(id),
          commission_percentage: parseFloat(rate),
        })),
      );
      setEditOpen(false);
      setBulkRates({});
    } catch {
      /* handled by hook */
    }
  };

  const handleClose = () => {
    setEditOpen(false);
    setBulkRates({});
  };

  const configuredCols = useMemo(
    () => [
      {
        accessorKey: "plan_name",
        header: ({ column }) => <SortButton column={column} label="Plan" />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.plan_name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {row.original.plan_type}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "plan_price",
        header: ({ column }) => <SortButton column={column} label="Price" />,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.plan_price)}
          </span>
        ),
      },
      {
        accessorKey: "commission_percentage",
        header: ({ column }) => <SortButton column={column} label="Rate" />,
        cell: ({ row }) => (
          <Badge variant="default" className="tabular-nums">
            {row.original.commission_percentage}%
          </Badge>
        ),
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => <SortButton column={column} label="Updated" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.updated_at
              ? new Date(row.original.updated_at).toLocaleDateString()
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_by",
        header: "Updated by",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.created_by ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const unconfiguredCols = useMemo(
    () => [
      {
        accessorKey: "plan_name",
        header: "Plan",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.plan_name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {row.original.plan_type}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "plan_price",
        header: "Price",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.plan_price)}
          </span>
        ),
      },
      {
        id: "rate",
        header: "Rate",
        cell: () => (
          <Badge variant="outline" className="text-xs">
            Not configured
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium">Commission rates</h2>
          <p className="text-sm text-muted-foreground truncate">
            Configure commission percentages for subscription plans
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-none">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRates}
            disabled={loading}
          >
            <RefreshCw
              className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={handleBulkEdit} disabled={updating}>
            <Edit className="size-3.5 mr-1.5" />
            Edit rates
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          {
            label: "Configured",
            value: rates?.configured_plans ?? 0,
            icon: CheckCircle2,
          },
          {
            label: "Unconfigured",
            value: rates?.unconfigured_plans ?? 0,
            icon: AlertTriangle,
          },
          {
            label: "Total plans",
            value: rates?.total_plans ?? 0,
            icon: Settings,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-muted/40 rounded-lg px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-xl font-medium tabular-nums leading-none">
                {value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Configured */}
      {(loading || (rates?.plans_with_rates?.length ?? 0) > 0) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Configured rates
            </p>
          </div>
          <RatesTable
            data={rates?.plans_with_rates}
            loading={loading}
            columns={configuredCols}
            emptyMessage="No configured rates"
          />
        </div>
      )}

      {/* Unconfigured */}
      {(loading || (rates?.plans_without_rates?.length ?? 0) > 0) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Not yet configured
            </p>
          </div>
          <RatesTable
            data={rates?.plans_without_rates}
            loading={loading}
            columns={unconfiguredCols}
            emptyMessage="All plans are configured"
          />
        </div>
      )}

      {/* Edit dialog — structure matches your DialogContent exactly */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="max-w-xl flex flex-col gap-0 p-0 overflow-hidden">
          {/* Fixed header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>Edit commission rates</DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable plan list */}
          <div
            className="flex flex-col gap-2 overflow-y-auto px-6 py-4"
            style={{ maxHeight: "400px" }}
          >
            {allPlans.map((plan) => (
              <div
                key={plan.plan_id}
                className="flex items-center justify-between rounded-lg border px-4 py-3.5 gap-4"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {plan.plan_name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(plan.plan_price)} ·{" "}
                    <span className="capitalize">{plan.plan_type}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    value={bulkRates[plan.plan_id] ?? ""}
                    onChange={(e) =>
                      handleRateChange(plan.plan_id, e.target.value)
                    }
                    className="w-20 h-8 text-center text-sm tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground w-3">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed footer — sits outside scroll, no flex-col-reverse issues */}
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updating}>
              {updating ? (
                <>
                  <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  Save rates
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
