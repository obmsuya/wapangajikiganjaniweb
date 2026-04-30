// components/landlord/properties/tabs/PropertyOverviewTab.jsx
"use client";

import { useMemo, useEffect, useState } from "react";
import {
  AlertCircle,
  User,
  Home,
  Calendar,
  DollarSign,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/api/api-client";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

// ── Colour config per payment status ─────────────────────────────────────────
const STATUS_CONFIG = {
  paid: {
    bg: "#10b981",
    border: "#047857",
    text: "#ffffff",
    label: "Rent Paid",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    Icon: CheckCircle2,
    iconClass: "text-green-600",
  },
  overdue: {
    bg: "#ef4444",
    border: "#dc2626",
    text: "#ffffff",
    label: "Rent Overdue",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    Icon: AlertTriangle,
    iconClass: "text-red-600",
  },
  due: {
    bg: "#eab308",
    border: "#d97706",
    text: "#ffffff",
    label: "Rent Due",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    Icon: Clock,
    iconClass: "text-orange-600",
  },
  vacant: {
    bg: "#6b7280",
    border: "#4b5563",
    text: "#ffffff",
    label: "Vacant",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    Icon: Home,
    iconClass: "text-gray-500",
  },
  partial: {
    bg: "#5eead4",
    border: "#0d9488",
    text: "#134e4a",
    label: "Partial",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    Icon: Coins,
    iconClass: "text-teal-600",
  },
};

// ── Tooltip card shown when hovering a unit cell ──────────────────────────────
function UnitTooltipCard({ unit, formatCurrency }) {
  const config = STATUS_CONFIG[unit.paymentStatus] ?? STATUS_CONFIG.vacant;
  const { Icon } = config;

  const lastPayment = unit.paymentDetails?.last_payment;
  const amountPaid = lastPayment ? parseFloat(lastPayment.amount) : 0;
  const amountDue = parseFloat(unit.rentAmount || 0);
  const remaining = Math.max(0, amountDue - amountPaid);

  return (
    <div className="w-56 space-y-3 text-sm">
      {/* Unit header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">{unit.unitName}</span>
        <Badge variant="outline" className={config.badgeClass}>
          <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} />
          {config.label}
        </Badge>
      </div>

      {unit.paymentStatus === "vacant" ? (
        <p className="text-muted-foreground text-xs">No tenant assigned.</p>
      ) : (
        <>
          {/* Tenant */}
          {unit.tenant && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {unit.tenant.full_name ?? unit.tenant?.tenant?.full_name}
              </span>
            </div>
          )}

          <Separator />

          {/* Amount paid vs due */}
          <div className="space-y-1.5">
            {/* Amount due this cycle */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent due</span>
              <span className="font-medium">{formatCurrency(amountDue)}</span>
            </div>

            {/* Amount paid — only show when we have a last payment */}
            {lastPayment && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-medium text-green-700">
                  {formatCurrency(amountPaid)}
                </span>
              </div>
            )}

            {/* Remaining — only relevant when not vacant and not fully paid */}
            {unit.paymentStatus !== "paid" && remaining > 0 && (
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Still owed</span>
                <span className="text-destructive">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>

          {/* Last payment period */}
          {lastPayment && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Last payment covered
                </p>
                <p className="text-xs">
                  {new Date(lastPayment.period_start).toLocaleDateString()} –{" "}
                  {new Date(lastPayment.period_end).toLocaleDateString()}
                </p>
              </div>
            </>
          )}

          {/* Next payment date */}
          {unit.nextPaymentDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              Next due:{" "}
              {new Date(unit.nextPaymentDate).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PropertyOverviewTab({ property, floorData }) {
  const [tenantsData, setTenantsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "TZS 0";
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!property?.id) return;
      try {
        setLoading(true);
        const tenantsResponse = await api.get(
          `/api/v1/tenants/property/${property.id}/tenants/`
        );
        if (tenantsResponse.tenants) {
          setTenantsData(tenantsResponse.tenants);
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyData();
  }, [property?.id]);

  // Build a map keyed by unit_id for O(1) lookups
  const tenantsByUnitId = useMemo(() => {
    const map = new Map();
    tenantsData.forEach((t) => map.set(t.unit_id, t));
    return map;
  }, [tenantsData]);

  const processedFloors = useMemo(() => {
    if (!floorData) return [];

    return Object.entries(floorData)
      .map(([floorNum, floor]) => {
        if (!floor?.units?.length) return null;

        const gridCells = floor.units
          .map((unit) => {
            const tenantRecord = tenantsByUnitId.get(unit.id);
            const rawStatus =
              tenantRecord?.payment_status ??
              tenantRecord?.full_unit_info?.payment_status ??
              (unit.current_tenant ? "due" : "vacant");

            const paymentStatus = rawStatus === "early" ? "paid" : rawStatus;

            return {
              cellIndex: unit.svg_id,
              unitName: unit.unit_name,
              // Prefer tenant API data; fall back to unit's own current_tenant
              tenant: tenantRecord?.tenant ?? unit.current_tenant,
              status: unit.status,
              rentAmount: tenantRecord?.rent_amount ?? unit.rent_amount,
              paymentStatus,
              isOccupied: !!tenantRecord?.tenant || !!unit.current_tenant,
              // NEW — rich fields for tooltip
              paymentDetails: tenantRecord?.payment_details ?? null,
              nextPaymentDate: tenantRecord?.next_payment_date ?? null,
              paymentFrequency: tenantRecord?.payment_frequency ?? null,
              floorNumber: parseInt(floorNum, 10),
              floorName: tenantRecord?.floor_name ?? null,   // ← pull floor_name from tenant record
            };
          })
          .filter((u) => u.cellIndex !== undefined && u.cellIndex !== null)
          .sort((a, b) => a.cellIndex - b.cellIndex);

        const occupiedCount = gridCells.filter((u) => u.isOccupied).length;

        return {
          floorNumber: parseInt(floorNum),
          floorNo: floor.floor_no,
          floorName: gridCells.find((c) => c.floorName)?.floorName ?? parseInt(floorNum) === 0 ? 'Ground Floor' : `Floor ${parseInt(floorNum)}`,  // ← use floor_name from data
          units: gridCells,
          totalUnits: floor.units_total || gridCells.length,
          occupiedUnits: occupiedCount,
          occupancyRate:
            gridCells.length > 0
              ? Math.round((occupiedCount / gridCells.length) * 100)
              : 0,
          configured: gridCells.length > 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [floorData, tenantsByUnitId]);

  // ── Grid renderer — wraps each cell in a Tooltip ─────────────────────────
  const generateFloorGrid = (floor) => {
    if (!floor.units.length) return [];

    const positions = floor.units.map((u) => ({
      ...u,
      x: u.cellIndex % GRID_SIZE,
      y: Math.floor(u.cellIndex / GRID_SIZE),
    }));

    const minX = Math.min(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxX = Math.max(...positions.map((p) => p.x));
    const maxY = Math.max(...positions.map((p) => p.y));

    floor.layoutWidth = (maxX - minX + 1) * CELL_SIZE;
    floor.layoutHeight = (maxY - minY + 1) * CELL_SIZE;

    return floor.units.map((unit, index) => {
      const x = ((unit.cellIndex % GRID_SIZE) - minX) * CELL_SIZE;
      const y = (Math.floor(unit.cellIndex / GRID_SIZE) - minY) * CELL_SIZE;
      const config = STATUS_CONFIG[unit.paymentStatus] ?? STATUS_CONFIG.vacant;

      return (
        <TooltipProvider key={unit.cellIndex} delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 rounded-sm shadow-sm hover:scale-110 hover:z-10 cursor-pointer"
                style={{
                  left: x,
                  top: y,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: config.bg,
                  borderColor: config.border,
                  color: config.text,
                }}
                onClick={() => {
                  setSelectedUnit(unit);
                  setDialogOpen(true);
                }}
              >
                {index + 1}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="start"
              className="p-3 shadow-lg"
              sideOffset={8}
            >
              <UnitTooltipCard unit={unit} formatCurrency={formatCurrency} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });
  };

  if (!property) return <div>Loading…</div>;

  if (!processedFloors.length) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No floor plans configured for this property. Use the "Floors &amp;
            Units" tab to create floor layouts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Dialog on unit click ──────────────────────────────────────────────────
  const dialogConfig =
    selectedUnit
      ? STATUS_CONFIG[selectedUnit.paymentStatus] ?? STATUS_CONFIG.vacant
      : null;

  const lastPayment = selectedUnit?.paymentDetails?.last_payment;
  const amountPaid = lastPayment ? parseFloat(lastPayment.amount) : 0;
  const amountDue = parseFloat(selectedUnit?.rentAmount || 0);
  const remaining = Math.max(0, amountDue - amountPaid);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card className="px-5">
        <CardHeader className="text-xl font-semibold">
          Payment Status Legend
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border-2 rounded-xl"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                />
                <span className="text-sm">{cfg.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Floor grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {processedFloors.map((floor) => (
          <Card key={floor.floorNumber}>
            <CardHeader>
              <div>
                <p className="text-base font-semibold">{floor.floorName}</p>
                <p className="text-sm text-muted-foreground">{floor.totalUnits} units • {floor.occupancyRate}% occupied</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    className="relative rounded-lg p-4"
                    style={{
                      width: (floor.layoutWidth || GRID_SIZE * CELL_SIZE) + 20,
                      height: (floor.layoutHeight || GRID_SIZE * CELL_SIZE) + 20,
                    }}
                  >
                    {generateFloorGrid(floor)}
                    {!floor.units.length && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No units configured
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-floor stats */}
                <div className="grid grid-cols-5 gap-2 text-center pt-2 border-t">
                  {[
                    { status: "paid", label: "Paid", color: "text-green-600" },
                    { status: "due", label: "Due", color: "text-orange-600" },
                    { status: "overdue", label: "Overdue", color: "text-red-600" },
                    { status: "vacant", label: "Vacant", color: "text-gray-600" },
                    { status: "partial", label: "Partial", color: "text-teal-600" },
                  ].map(({ status, label, color }) => (
                    <div key={status}>
                      <div className={`font-semibold ${color}`}>
                        {floor.units.filter((u) => u.paymentStatus === status).length}
                      </div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Loading payment data…</p>
        </div>
      )}

      {/* Unit detail dialog (click) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {selectedUnit?.unitName} — Floor {selectedUnit?.floorNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedUnit && (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Payment status
                </span>
                {dialogConfig && (
                  <Badge variant="outline" className={dialogConfig.badgeClass}>
                    <dialogConfig.Icon
                      className={`h-3.5 w-3.5 mr-1.5 ${dialogConfig.iconClass}`}
                    />
                    {dialogConfig.label}
                  </Badge>
                )}
              </div>

              {selectedUnit.paymentStatus === "vacant" ? (
                <div className="text-center py-6">
                  <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No tenant assigned</p>
                  <p className="text-sm text-gray-400">This unit is vacant</p>
                </div>
              ) : (
                <>
                  {/* Tenant info */}
                  {selectedUnit.tenant && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {selectedUnit.tenant.full_name ??
                              selectedUnit.tenant?.tenant?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Tenant</p>
                        </div>
                      </div>

                      {(selectedUnit.tenant.phone_number ??
                        selectedUnit.tenant?.tenant?.phone_number) && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">
                              {selectedUnit.tenant.phone_number ??
                                selectedUnit.tenant?.tenant?.phone_number}
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  <Separator />

                  {/* Financial summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent due this cycle</span>
                      <span className="font-medium">{formatCurrency(amountDue)}</span>
                    </div>

                    {lastPayment && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount paid</span>
                        <span className="font-medium text-green-700">
                          {formatCurrency(amountPaid)}
                        </span>
                      </div>
                    )}

                    {selectedUnit.paymentStatus !== "paid" && remaining > 0 && (
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Still owed</span>
                        <span className="text-destructive">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Period and next due */}
                  {lastPayment && (
                    <>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Last payment covered
                        </p>
                        <p>
                          {new Date(lastPayment.period_start).toLocaleDateString()} –{" "}
                          {new Date(lastPayment.period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedUnit.nextPaymentDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      Next due:{" "}
                      {new Date(selectedUnit.nextPaymentDate).toLocaleDateString(
                        undefined,
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}