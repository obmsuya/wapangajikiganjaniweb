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
  { value: "low",    label: "Low",    dot: "bg-green-500",  variant: "outline"     },
  { value: "medium", label: "Medium", dot: "bg-yellow-500", variant: "secondary"   },
  { value: "high",   label: "High",   dot: "bg-orange-500", variant: "destructive" },
  { value: "urgent", label: "Urgent", dot: "bg-red-600",    variant: "destructive" },
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
    <Badge variant={p.variant} className="text-xs gap-1.5 capitalize">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.dot}`} />
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
// occupancies = all units the tenant has across all properties
// The tenant picks which unit this request is for INSIDE the dialog.

function SubmitDialog({ open, onOpenChange, occupancies, defaultUnitId, onSuccess }) {
  const { submitMaintenanceRequest, loading } = useMaintenanceRequestStore();

  const [form, setForm] = useState({
    unit_id:     String(defaultUnitId ?? occupancies[0]?.unit_id ?? ""),
    title:       "",
    description: "",
    category:    "",
    priority:    "medium",
  });

  // Reset on open — seed unit from whichever unit tab was active
  useEffect(() => {
    if (open) {
      setForm({
        unit_id:     String(defaultUnitId ?? occupancies[0]?.unit_id ?? ""),
        title:       "",
        description: "",
        category:    "",
        priority:    "medium",
      });
    }
  }, [open, occupancies, defaultUnitId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedOcc = occupancies.find(o => String(o.unit_id) === form.unit_id);
  const canSubmit   = form.unit_id && form.title.trim() && form.description.trim() && form.category && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const result = await submitMaintenanceRequest({
      unit_id:     parseInt(form.unit_id),
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

  if (!occupancies.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        max-h keeps the dialog from overflowing even with long text.
        The form body scrolls; header and footer are pinned.
      */}
      <DialogContent className="max-w-lg flex flex-col max-h-[90dvh] overflow-hidden p-0">
        {/* Pinned header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Report an Issue
            </DialogTitle>
            <DialogDescription>
              Your landlord will be notified once you submit.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable form body */}
        <form id="submit-maintenance" onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">

          {/* Unit selector — the reason the dropdown exists */}
          {occupancies.length > 1 ? (
            <div className="space-y-1.5">
              <Label>Which unit is this for? *</Label>
              <Select value={form.unit_id} onValueChange={v => set("unit_id", v)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occupancies.map(o => (
                    <SelectItem key={o.unit_id} value={String(o.unit_id)}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{o.unit_name}</span>
                        <span className="text-muted-foreground text-xs">· {o.property_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* Single unit — show as read-only context, no selector needed */
            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md bg-muted/40 border px-3 py-2">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium text-foreground">{selectedOcc?.unit_name}</span>
              <span>·</span>
              <span>{selectedOcc?.property_name}</span>
            </div>
          )}

          {/* Problem title */}
          <div className="space-y-1.5">
            <Label htmlFor="m-title">What's the problem? *</Label>
            <Input
              id="m-title"
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
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label htmlFor="m-desc">Details *</Label>
            <Textarea
              id="m-desc"
              placeholder="Describe the issue — when it started, how often it happens, anything else useful."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Urgent warning — inline, not blocking */}
          {form.priority === "urgent" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Urgent requests are for safety issues. Your landlord will be notified by SMS immediately.
              </AlertDescription>
            </Alert>
          )}
        </form>

        {/* Pinned footer — always visible even with long text */}
        <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0">
          <Button type="button" variant="outline" className="flex-1"
            onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="submit-maintenance" className="flex-1" disabled={!canSubmit}>
            {loading
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending…</>
              : <><Send className="h-4 w-4 mr-2" />Send Request</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail dialog ─────────────────────────────────────────────────────────────
// Fetches full request detail (including all landlord responses) when opened.

function DetailDialog({ request, open, onOpenChange }) {
  const { fetchMaintenanceRequestDetail } = useMaintenanceRequestStore();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch full detail including responses when dialog opens
  useEffect(() => {
    if (open && request?.id) {
      setLoading(true);
      fetchMaintenanceRequestDetail(request.id)
        .then(d => setDetail(d ?? request))
        .catch(() => setDetail(request))
        .finally(() => setLoading(false));
    }
    if (!open) setDetail(null);
  }, [open, request?.id]);

  // Use fetched detail, fall back to the row data while loading
  const r = detail ?? request;
  if (!r) return null;

  // responses is an array from the detail endpoint
  const responses = Array.isArray(r.responses) ? r.responses : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col overflow-hidden p-0">

        {/* Pinned header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base leading-snug">
              <CategoryIcon category={r.category} />
              {r.title}
            </DialogTitle>
            <DialogDescription>
              {r.property_info?.unit_name} · {r.property_info?.property_name ?? ""}
            </DialogDescription>
          </DialogHeader>
          {/* Status + priority always visible */}
          <div className="flex items-center gap-2 mt-3">
            <StatusBadge status={r.status} />
            <PriorityBadge priority={r.priority} />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">Loading details…</span>
            </div>
          )}

          {/* Original description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Your report
            </p>
            <p className="leading-relaxed text-foreground">{r.message || r.description}</p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 text-xs rounded-lg bg-muted/40 border p-3">
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">{fmtDate(r.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{r.category}</p>
            </div>
            {r.updated_at && r.updated_at !== r.created_at && (
              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium">{fmtDate(r.updated_at)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Unit</p>
              <p className="font-medium">{r.property_info?.unit_name ?? "—"}</p>
            </div>
          </div>

          {/* Responses thread — each landlord reply shown as a card */}
          {responses.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Landlord {responses.length === 1 ? "reply" : `replies (${responses.length})`}
              </p>
              {responses.map((resp, i) => (
                <div key={resp.id ?? i}
                  className="rounded-lg border-l-2 border-primary bg-primary/5 pl-3 pr-3 py-2.5 space-y-1">
                  <p className="text-xs text-muted-foreground">{fmtDate(resp.created_at)}</p>
                  <p className="leading-relaxed">{resp.message}</p>
                  {resp.status && resp.status !== r.status && (
                    <div className="pt-1">
                      <StatusBadge status={resp.status} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No response yet */}
          {!loading && responses.length === 0 && (
            <div className="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground text-center">
              No reply from your landlord yet. You'll be notified when they respond.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Compact DataTable ────────────────────────────────────────────────────────

function RequestsTable({ data, onRowClick, showUnitColumn = false }) {
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
              {showUnitColumn && (
                <TableHead className="hidden sm:table-cell text-xs font-medium">Unit</TableHead>
              )}
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
                <TableCell colSpan={showUnitColumn ? 6 : 5}
                  className="h-28 text-center text-muted-foreground text-sm">
                  {data.length === 0
                    ? "No requests yet. Use the button above to report an issue."
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
                    {/* Show response indicator when there's a landlord reply */}
                    {(row.has_responses || row.responses_count > 0) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Landlord replied
                      </span>
                    )}
                  </TableCell>
                  {showUnitColumn && (
                    <TableCell className="hidden sm:table-cell">
                      <p className="text-xs font-medium">{row.property_info?.unit_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.property_info?.property_name ?? ""}</p>
                    </TableCell>
                  )}
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
  const [occupancies,     setOccupancies]     = useState([]);
  // selectedUnitId = null means "all units"; a string means filter to that unit
  const [selectedUnitId,  setSelectedUnitId]  = useState(null);
  const [pageLoading,     setPageLoading]     = useState(true);
  const [pageError,       setPageError]       = useState(null);
  const [showSubmit,      setShowSubmit]      = useState(false);
  const [detailRequest,   setDetailRequest]   = useState(null);
  const [showDetail,      setShowDetail]      = useState(false);

  const {
    requests,
    loading: requestsLoading,
    fetchMaintenanceRequests,
    refreshData,
  } = useMaintenanceRequestStore();

  // Load all occupancies for this tenant once
  useEffect(() => {
    (async () => {
      try {
        setPageLoading(true);
        const res = await TenantPaymentService.getCurrentOccupancy();
        if (res.success && res.occupancies?.length > 0) {
          setOccupancies(res.occupancies);
          // Default: show all units
          setSelectedUnitId(null);
        }
      } catch {
        setPageError("Could not load your property information.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // Reload requests whenever unit filter changes
  useEffect(() => {
    fetchMaintenanceRequests("all");
  }, [fetchMaintenanceRequests]);

  const handleRequestSuccess = () => refreshData("all");

  const handleRowClick = (request) => {
    setDetailRequest(request);
    setShowDetail(true);
  };

  // Filter requests by selected unit (client-side — requests for all units are loaded once)
  const visibleRequests = useMemo(() => {
    if (!selectedUnitId) return requests;
    return requests.filter(r => {
      // The API returns property_info with unit_id in metadata
      const uid = r.property_info?.unit_id ?? r.metadata?.unit_id;
      return uid != null && String(uid) === String(selectedUnitId);
    });
  }, [requests, selectedUnitId]);

  const counts = useMemo(() => ({
    total:       visibleRequests.length,
    pending:     visibleRequests.filter(r => r.status === "pending").length,
    in_progress: visibleRequests.filter(r => r.status === "in_progress").length,
    completed:   visibleRequests.filter(r => r.status === "completed").length,
  }), [visibleRequests]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/tenant" },
    { label: "Maintenance" },
  ];

  // ── loading ──
  if (pageLoading) {
    return (
      <div className="space-y-6">
        <CloudflareBreadcrumbs items={breadcrumbItems} />
        <CloudflarePageHeader title="Maintenance" description="Loading…" />
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // ── no unit ──
  if (pageError || !occupancies.length) {
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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <CloudflarePageHeader
        title="Maintenance"
        description="Report issues and track repairs for your units"
        actions={
          <div className="flex items-center gap-2">
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

      {/* ── Unit tabs — only shown when tenant has multiple units ──── */}
      {/* This is the core navigation: tenant switches between units to
          see requests per unit, and can see "All" across all units.   */}
      {occupancies.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelectedUnitId(null)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border
              ${!selectedUnitId
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
          >
            All units
          </button>
          {occupancies.map(o => (
            <button
              key={o.unit_id}
              onClick={() => setSelectedUnitId(String(o.unit_id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                transition-colors border
                ${String(selectedUnitId) === String(o.unit_id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              {o.unit_name}
              <span className="text-xs opacity-70">· {o.property_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Single unit — show as a simple context line, no tabs needed */}
      {occupancies.length === 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="font-medium text-foreground">{occupancies[0].unit_name}</span>
          <span>·</span>
          <span>{occupancies[0].property_name}</span>
        </div>
      )}

      {/* ── Stats — scoped to selected unit view ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: counts.total       },
          { label: "Pending",     value: counts.pending     },
          { label: "In progress", value: counts.in_progress },
          { label: "Completed",   value: counts.completed   },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Requests DataTable ─────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            {selectedUnitId
              ? `Requests — ${occupancies.find(o => String(o.unit_id) === selectedUnitId)?.unit_name ?? "Unit"}`
              : "All Requests"}
          </h3>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click any row to see details
          </span>
        </div>
        <div className="p-5">
          <RequestsTable
            data={visibleRequests}
            onRowClick={handleRowClick}
            showUnitColumn={!selectedUnitId && occupancies.length > 1}
          />
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────── */}
      <SubmitDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        occupancies={occupancies}
        defaultUnitId={selectedUnitId}
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