// app/(dashboard)/tenant/maintenance/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wrench, Plus, Building2, AlertCircle, RefreshCw,
  Droplets, Zap, Wind, Home, Shield, Sparkles, MoreHorizontal,
  Clock, AlertTriangle, CheckCircle2, XCircle, Send,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Textarea }  from "@/components/ui/textarea";
import { Label }     from "@/components/ui/label";
import { Badge }     from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CloudflareBreadcrumbs,
  CloudflarePageHeader,
} from "@/components/cloudflare/Breadcrumbs";
import { useMaintenanceRequestStore } from "@/stores/maintenance/useMaintenanceRequestStore";
import TenantPaymentService from "@/services/tenant/payment";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "plumbing",    label: "Plumbing",    Icon: Droplets,      },
  { value: "electrical",  label: "Electrical",  Icon: Zap,           },
  { value: "appliances",  label: "Appliances",  Icon: Home,          },
  { value: "hvac",        label: "HVAC",        Icon: Wind,          },
  { value: "structural",  label: "Structural",  Icon: Home,          },
  { value: "security",    label: "Security",    Icon: Shield,        },
  { value: "cleaning",    label: "Cleaning",    Icon: Sparkles,      },
  { value: "other",       label: "Other",       Icon: MoreHorizontal },
];

const PRIORITIES = [
  { value: "low",    label: "Low",    variant: "outline"    },
  { value: "medium", label: "Medium", variant: "secondary"  },
  { value: "high",   label: "High",   variant: "destructive" },
  { value: "urgent", label: "Urgent", variant: "destructive" },
];

const STATUSES = {
  pending:     { label: "Pending",     Icon: Clock,         class: "bg-muted text-muted-foreground"   },
  in_progress: { label: "In Progress", Icon: AlertTriangle, class: "bg-primary/10 text-primary"       },
  completed:   { label: "Completed",   Icon: CheckCircle2,  class: "bg-primary/10 text-primary"       },
  rejected:    { label: "Rejected",    Icon: XCircle,       class: "bg-destructive/10 text-destructive" },
};

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }) {
  const s = STATUSES[status] ?? STATUSES.pending;
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${s.class}`}>
      <s.Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find(x => x.value === priority) ?? PRIORITIES[1];
  return (
    <Badge variant={p.variant} className="text-xs capitalize">
      {p.label}
    </Badge>
  );
}

function CategoryIcon({ category }) {
  const c = CATEGORIES.find(x => x.value === category);
  const Icon = c?.Icon ?? MoreHorizontal;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>{c?.label ?? category}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Submit dialog ─────────────────────────────────────────────────────────────

function SubmitDialog({ open, onOpenChange, occupancy, onSuccess }) {
  const { submitMaintenanceRequest, loading } = useMaintenanceRequestStore();
  const [form, setForm] = useState({
    title: "", description: "", category: "", priority: "medium",
  });

  // Reset on open
  useEffect(() => {
    if (open) setForm({ title: "", description: "", category: "", priority: "medium" });
  }, [open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canSubmit = form.title.trim() && form.description.trim() && form.category && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const result = await submitMaintenanceRequest({
      unit_id:     occupancy.unit_id,
      title:       form.title.trim(),
      description: form.description.trim(),
      category:    form.category,
      priority:    form.priority,
    });

    if (result.success) {
      toast.success("Request sent", {
        description: "Your landlord has been notified.",
      });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error("Could not submit", { description: result.error });
    }
  };

  if (!occupancy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            {occupancy.unit_name} · {occupancy.property_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">What's the problem? *</Label>
            <Input
              id="title"
              placeholder="e.g. Leaking tap in kitchen"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Category + Priority side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => set("category", v)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <c.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>How urgent?</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Details *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue — when it started, how often it happens, anything else useful."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Urgent warning */}
          {form.priority === "urgent" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Urgent requests are for safety issues. Your landlord will be notified by SMS immediately.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              {loading
                ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                : <><Send className="h-4 w-4 mr-2" />Send Request</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail dialog ─────────────────────────────────────────────────────────────

function DetailDialog({ request, open, onOpenChange }) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CategoryIcon category={request.category} />
            {request.title}
          </DialogTitle>
          <DialogDescription>
            {request.property_info?.unit_name} · {request.property_info?.property_name ?? ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm mt-1">
          {/* Status + priority row */}
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="leading-relaxed">{request.message || request.description}</p>
          </div>

          <Separator />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">{fmtDate(request.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{request.category}</p>
            </div>
            {request.updated_at && request.updated_at !== request.created_at && (
              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium">{fmtDate(request.updated_at)}</p>
              </div>
            )}
          </div>

          {/* Landlord response */}
          {request.response && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Response from landlord
                </p>
                <p className="leading-relaxed">{request.response}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Compact DataTable ────────────────────────────────────────────────────────

function RequestsTable({ data, onRowClick }) {
  const [sortField, setSortField] = useState("created_at");
  const [sortDir,   setSortDir]   = useState("desc");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 8;

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground inline" />;
    return sortDir === "asc"
      ? <ChevronUp   className="ml-1 h-3 w-3 inline" />
      : <ChevronDown className="ml-1 h-3 w-3 inline" />;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(r =>
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField];
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Search */}
      <Input
        placeholder="Search by title, category or status…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="max-w-xs"
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>
                <button className="flex items-center font-medium text-xs"
                  onClick={() => toggleSort("title")}>
                  Issue <SortIcon field="title" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button className="flex items-center font-medium text-xs"
                  onClick={() => toggleSort("priority")}>
                  Priority <SortIcon field="priority" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center font-medium text-xs"
                  onClick={() => toggleSort("status")}>
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <button className="flex items-center font-medium text-xs"
                  onClick={() => toggleSort("created_at")}>
                  Date <SortIcon field="created_at" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                  {data.length === 0
                    ? "No maintenance requests yet. Use the button above to report an issue."
                    : "Nothing matches your search."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map(row => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onRowClick(row)}
                >
                  <TableCell className="w-8 pr-0">
                    <CategoryIcon category={row.category} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm leading-tight">{row.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {row.message || row.description}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PriorityBadge priority={row.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {fmtDate(row.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–
            {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 1}
              onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TenantMaintenancePage() {
  const [occupancies,        setOccupancies]        = useState([]);
  const [selectedOccupancy,  setSelectedOccupancy]  = useState(null);
  const [pageLoading,        setPageLoading]        = useState(true);
  const [pageError,          setPageError]          = useState(null);
  const [showSubmit,         setShowSubmit]         = useState(false);
  const [detailRequest,      setDetailRequest]      = useState(null);
  const [showDetail,         setShowDetail]         = useState(false);

  const {
    requests,
    loading: requestsLoading,
    fetchMaintenanceRequests,
    refreshData,
  } = useMaintenanceRequestStore();

  // Load occupancies once
  useEffect(() => {
    (async () => {
      try {
        setPageLoading(true);
        const res = await TenantPaymentService.getCurrentOccupancy();
        if (res.success && res.occupancies?.length > 0) {
          setOccupancies(res.occupancies);
          setSelectedOccupancy(res.occupancies[0]);
        } else {
          setOccupancies([]);
        }
      } catch {
        setPageError("Could not load your property information.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // Load requests whenever occupancy changes
  useEffect(() => {
    if (selectedOccupancy) fetchMaintenanceRequests("all");
  }, [selectedOccupancy, fetchMaintenanceRequests]);

  const handleRequestSuccess = () => {
    refreshData("all");
  };

  const handleRowClick = (request) => {
    setDetailRequest(request);
    setShowDetail(true);
  };

  // ── stat counts ──
  const counts = useMemo(() => ({
    total:       requests.length,
    pending:     requests.filter(r => r.status === "pending").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed:   requests.filter(r => r.status === "completed").length,
  }), [requests]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/tenant" },
    { label: "Maintenance" },
  ];

  // ── loading ──
  if (pageLoading) {
    return (
      <div className="space-y-6">
        <CloudflareBreadcrumbs items={breadcrumbItems} />
        <CloudflarePageHeader title="Maintenance" description="Loading your unit…" />
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // ── no unit ──
  if (pageError || !selectedOccupancy) {
    return (
      <div className="space-y-6">
        <CloudflareBreadcrumbs items={breadcrumbItems} />
        <CloudflarePageHeader title="Maintenance" description="" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {pageError ?? "No active unit found. Please contact your landlord."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      {/* ── Page header — unit context inline, action in header ───── */}
      <CloudflarePageHeader
        title="Maintenance"
        description={`${selectedOccupancy.unit_name} · ${selectedOccupancy.property_name}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Multi-unit selector — only shown when needed */}
            {occupancies.length > 1 && (
              <Select
                value={String(selectedOccupancy.unit_id)}
                onValueChange={(v) => {
                  const occ = occupancies.find(o => o.unit_id === parseInt(v));
                  if (occ) setSelectedOccupancy(occ);
                }}
              >
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occupancies.map(o => (
                    <SelectItem key={o.unit_id} value={String(o.unit_id)}>
                      {o.unit_name} · {o.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button size="sm" onClick={() => setShowSubmit(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Report Issue
            </Button>

            <Button size="icon" variant="outline" className="h-9 w-9"
              onClick={() => refreshData("all")} disabled={requestsLoading}>
              <RefreshCw className={`h-4 w-4 ${requestsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Quick stats — 4 small tiles, no heavy cards ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: counts.total,       },
          { label: "Pending",     value: counts.pending,     },
          { label: "In progress", value: counts.in_progress, },
          { label: "Completed",   value: counts.completed,   },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Requests DataTable ────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Your Requests
          </h3>
          <span className="text-xs text-muted-foreground">
            Click any row to see details
          </span>
        </div>
        <div className="p-5">
          <RequestsTable data={requests} onRowClick={handleRowClick} />
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <SubmitDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        occupancy={selectedOccupancy}
        onSuccess={handleRequestSuccess}
      />

      <DetailDialog
        request={detailRequest}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}