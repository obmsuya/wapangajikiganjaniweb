"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  Save,
  Check,
  AlertCircle,
  Building2,
  Layers,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFloorPlan } from "@/hooks/properties/useProperties";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function FloorPlanDesigner({
  onValidationChange,
  propertyData,
  floorData,
  updateFloorData,
  updatePropertyData,
  existingProperty = null,
  saveRef, // ← add this
}) {
  const [inlineFloorCount, setInlineFloorCount] = useState(
    propertyData?.total_floors || 1,
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingFloor, setIsLoadingFloor] = useState(false);
  const [floorPanelOpen, setFloorPanelOpen] = useState(false);

  const {
    selectedUnits,
    currentFloor,
    setCurrentFloor,
    toggleUnit,
    saveFloorPlan,
    generateSVGString,
    generateLayoutPreview,
    loadFloorData,
    getAllFloorsData,
    validateUnitDeletion,
    floorMemory,
    clearSelection,
  } = useFloorPlan(updateFloorData, floorData, existingProperty, propertyData);

  const floors = useMemo(
    () => Array.from({ length: inlineFloorCount }, (_, i) => i + 1),
    [inlineFloorCount],
  );

  const totals = useMemo(() => {
    const allFloorsData = getAllFloorsData();
    const totalUnits = Object.values(allFloorsData).reduce(
      (total, floor) => total + (floor?.units_total || 0),
      0,
    );
    const configuredFloorsCount = Object.keys(allFloorsData).filter(
      (floorNum) => allFloorsData[floorNum]?.units_total > 0,
    ).length;
    return {
      totalUnits,
      configuredFloorsCount,
      completionRate:
        floors.length > 0
          ? Math.round((configuredFloorsCount / floors.length) * 100)
          : 0,
    };
  }, [floorMemory, floors.length, getAllFloorsData]);

  const isFloorPlanValid = useMemo(() => {
    const newErrors = {};
    let hasValidFloor = false;
    if (floors.length > 0) {
      floors.forEach((floorNum) => {
        const floor = floorMemory[floorNum];
        if (floor && floor.units_total > 0) hasValidFloor = true;
      });
      if (!hasValidFloor)
        newErrors.floors = "Please add at least one unit to any floor";
    } else {
      newErrors.floors = "Property must have at least one floor";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && hasValidFloor;
  }, [floors, floorMemory]);

  useEffect(() => {
    onValidationChange?.(isFloorPlanValid);
  }, [isFloorPlanValid, onValidationChange]);

  // ← add this: expose handleSaveCurrentFloor to parent via ref
  useEffect(() => {
    if (saveRef) saveRef.current = handleSaveCurrentFloor;
  }, [saveRef, handleSaveCurrentFloor]);

  const handleFloorCountChange = (newCount) => {
    const count = Math.max(1, Math.min(20, newCount));
    setInlineFloorCount(count);
    if (updatePropertyData) {
      updatePropertyData({
        total_floors: count,
        floors:
          count < inlineFloorCount
            ? Object.fromEntries(
                Object.entries(propertyData.floors || {}).filter(
                  ([key]) => parseInt(key) <= count,
                ),
              )
            : propertyData.floors || {},
      });
    }
  };

  const handleFloorChange = useCallback(
    async (floorNumber) => {
      if (floorNumber === currentFloor) return;
      setIsLoadingFloor(true);
      try {
        if (selectedUnits.length > 0) await handleSaveCurrentFloor();
        await loadFloorData(floorNumber);
      } catch {
        setErrors((prev) => ({
          ...prev,
          floorChange: "Failed to load floor data. Please try again.",
        }));
      } finally {
        setIsLoadingFloor(false);
        setFloorPanelOpen(false);
      }
    },
    [currentFloor, selectedUnits, loadFloorData],
  );

  const handleSaveCurrentFloor = useCallback(async () => {
    if (!selectedUnits || selectedUnits.length === 0) {
      setErrors((prev) => ({
        ...prev,
        currentFloor: "Please select at least one unit",
      }));
      return;
    }
    try {
      const svgString = generateSVGString(selectedUnits);
      const layoutPreviewData = generateLayoutPreview(selectedUnits);
      const floorPlanData = {
        floor_number: currentFloor,
        units_ids: [...selectedUnits],
        units_total: selectedUnits.length,
        layout_data: svgString,
        layout_preview: layoutPreviewData,
        area: selectedUnits.length * 150,
        layout_type: "manual_grid",
        creation_method: "manual",
        grid_configuration: {
          grid_size: GRID_SIZE,
          cell_size: CELL_SIZE,
          selected_cells: selectedUnits,
          layout_type: "manual_grid",
        },
      };
      await saveFloorPlan(currentFloor, floorPlanData);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.currentFloor;
        return next;
      });
    } catch {
      setErrors((prev) => ({
        ...prev,
        currentFloor: "Failed to save floor plan. Please try again.",
      }));
    }
  }, [
    selectedUnits,
    currentFloor,
    generateSVGString,
    generateLayoutPreview,
    saveFloorPlan,
  ]);

  const handleUnitToggle = useCallback(
    async (cellIndex) => {
      if (previewMode) return;
      if (selectedUnits.includes(cellIndex) && existingProperty) {
        try {
          const tenantInfo = await validateUnitDeletion(
            currentFloor,
            cellIndex,
          );
          if (tenantInfo?.has_tenant) {
            setErrors((prev) => ({
              ...prev,
              tenant: `Cannot remove unit: ${tenantInfo.message}`,
            }));
            return;
          }
        } catch {
          /* non-blocking */
        }
      }
      toggleUnit(cellIndex);
    },
    [
      previewMode,
      selectedUnits,
      existingProperty,
      validateUnitDeletion,
      currentFloor,
      toggleUnit,
    ],
  );

  const copyFloorLayout = useCallback(
    (sourceFloor, targetFloor) => {
      const source = floorMemory[sourceFloor];
      if (!source?.units_ids) return;
      saveFloorPlan(targetFloor, { ...source, floor_number: targetFloor });
      if (currentFloor === targetFloor) loadFloorData(targetFloor);
    },
    [floorMemory, saveFloorPlan, currentFloor, loadFloorData],
  );

  const gridCells = useMemo(() => {
    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
      const isSelected = selectedUnits.includes(i);
      const x = (i % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;
      return (
        <motion.button
          key={i}
          onClick={() => handleUnitToggle(i)}
          aria-label={`Cell ${i + 1}${isSelected ? " (selected)" : ""}`}
          disabled={previewMode || isLoadingFloor}
          whileHover={!previewMode && !isLoadingFloor ? { scale: 1.08 } : {}}
          whileTap={!previewMode && !isLoadingFloor ? { scale: 0.92 } : {}}
          className={[
            "absolute rounded transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            isSelected
              ? "bg-primary border-2 border-primary/80 shadow-md"
              : previewMode
                ? "bg-muted/40 border border-border/50"
                : "bg-background border-2 border-border hover:border-primary/50 hover:bg-primary/5",
            previewMode || isLoadingFloor ? "cursor-default" : "cursor-pointer",
            isLoadingFloor ? "opacity-40" : "",
          ].join(" ")}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
          }}
        >
          {isSelected && (
            <span className="flex items-center justify-center w-full h-full text-primary-foreground text-xs font-bold leading-none select-none">
              {selectedUnits.indexOf(i) + 1}
            </span>
          )}
          {isSelected && !previewMode && (
            <span className="absolute -top-1 -right-1 size-2.5 bg-green-400 rounded-full border border-background" />
          )}
        </motion.button>
      );
    });
  }, [selectedUnits, previewMode, handleUnitToggle, isLoadingFloor]);

  if (!floors.length) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Floor Plan Design"
          description="Design the layout for each floor by selecting units on the grid"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Please configure your property details first to set the number of
              floors.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Floor Plan Design"
        description="Design layouts for your property by selecting units on the grid"
      />

      <Card className="border-primary/20 bg-primary/5 p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-primary max-sm:flex-col max-sm:items-start">
            <Building2 className="size-4" />
            Property Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label
              htmlFor="floorCount"
              className="text-sm font-medium shrink-0"
            >
              Number of Floors
            </Label>
            <div className="flex items-center gap-2 max-sm:justify-between max-sm:w-full">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => handleFloorCountChange(inlineFloorCount - 1)}
                disabled={inlineFloorCount <= 1}
                aria-label="Decrease floors"
              >
                <Minus className="size-3.5" />
              </Button>
              <Input
                id="floorCount"
                type="number"
                min="1"
                max="20"
                value={inlineFloorCount}
                disabled={propertyData.category === "Single Floor"}
                onChange={(e) =>
                  handleFloorCountChange(parseInt(e.target.value) || 1)
                }
                className="w-16 text-center h-8 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => handleFloorCountChange(inlineFloorCount + 1)}
                disabled={
                  propertyData.category === "Single Floor"
                    ? true
                    : inlineFloorCount >= 20
                }
                aria-label="Increase floors"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <StatPill
              value={totals.configuredFloorsCount}
              label={`of ${floors.length} floors`}
              color="text-primary"
            />
            <StatPill
              value={totals.totalUnits}
              label="total units"
              color="text-green-600 dark:text-green-400"
            />
            <StatPill
              value={`${totals.completionRate}%`}
              label="complete"
              color="text-amber-600 dark:text-amber-400"
            />
          </div>

          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${totals.completionRate}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>

      {(errors.floors || errors.tenant) && (
        <div className="space-y-2">
          {errors.floors && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{errors.floors}</AlertDescription>
            </Alert>
          )}
          {errors.tenant && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{errors.tenant}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="lg:hidden">
            <button
              onClick={() => setFloorPanelOpen((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-card text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Layers className="size-4" />
                Floor {currentFloor} of {floors.length}
              </span>
              {floorPanelOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {floorPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <FloorList
                      floors={floors}
                      currentFloor={currentFloor}
                      floorMemory={floorMemory}
                      isLoadingFloor={isLoadingFloor}
                      onFloorChange={handleFloorChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden lg:block">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="size-4" />
                  Floors
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {floors.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FloorList
                  floors={floors}
                  currentFloor={currentFloor}
                  floorMemory={floorMemory}
                  isLoadingFloor={isLoadingFloor}
                  onFloorChange={handleFloorChange}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Floor {currentFloor} Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Selected</span>
                <Badge variant="outline" className="font-mono">
                  {selectedUnits.length} units
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => setPreviewMode((p) => !p)}
                  variant={previewMode ? "default" : "outline"}
                  className="w-full justify-start gap-2"
                >
                  {previewMode ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  {previewMode ? "Exit Preview" : "Preview Mode"}
                </Button>
                <Button
                  onClick={handleSaveCurrentFloor}
                  disabled={selectedUnits.length === 0}
                  className="w-full justify-start gap-2"
                >
                  <Save className="size-3.5" />
                  Save Floor
                </Button>
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <RotateCcw className="size-3.5" />
                  Clear All
                </Button>
              </div>
              {floors.length > 1 && selectedUnits.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Copy layout to:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {floors
                      .filter((f) => f !== currentFloor)
                      .map((floorNum) => (
                        <Button
                          key={floorNum}
                          onClick={() =>
                            copyFloorLayout(currentFloor, floorNum)
                          }
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Copy className="size-3" />F{floorNum}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              {errors.currentFloor && (
                <p className="text-destructive text-xs">
                  {errors.currentFloor}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Grid3X3 className="size-4" />
                  Floor {currentFloor} Layout
                  {isLoadingFloor && (
                    <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {GRID_SIZE}×{GRID_SIZE}
                  </Badge>
                  {previewMode && (
                    <Badge
                      variant="outline"
                      className="bg-green-500 hover:bg-green-500 text-xs"
                    >
                      Preview
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={[
                  "rounded-lg px-3 py-2 text-xs",
                  previewMode
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-primary/8 text-primary",
                ].join(" ")}
              >
                <strong>{previewMode ? "Preview mode:" : "Edit mode:"}</strong>{" "}
                {previewMode
                  ? "This is how your floor layout will look. Click Exit Preview to make changes."
                  : "Click grid cells to select units. Each selected cell becomes a unit in your floor plan."}
              </div>
              <div className="flex justify-center overflow-x-auto py-2">
                <div
                  className={[
                    "relative rounded-lg transition-colors duration-300",
                    previewMode
                      ? "border-green-400/40"
                      : "border-border bg-muted/30",
                  ].join(" ")}
                  style={{
                    width: GRID_SIZE * CELL_SIZE + 4,
                    height: GRID_SIZE * CELL_SIZE + 4,
                    padding: 2,
                  }}
                >
                  {gridCells}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <LegendItem color="bg-primary" label="Selected unit" />
                <LegendItem
                  color="bg-background border-2 border-border"
                  label="Available space"
                />
                {previewMode && (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <Check className="size-3.5" />
                    Preview active
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function StatPill({ value, label, color }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/50 px-3 py-2 text-center">
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function FloorList({
  floors,
  currentFloor,
  floorMemory,
  isLoadingFloor,
  onFloorChange,
}) {
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {floors.map((floorNum) => {
        const data = floorMemory[floorNum];
        const isConfigured = data?.units_total > 0;
        const isActive = currentFloor === floorNum;
        return (
          <motion.button
            key={floorNum}
            onClick={() => onFloorChange(floorNum)}
            disabled={isLoadingFloor}
            whileHover={!isLoadingFloor ? { x: 2 } : {}}
            whileTap={!isLoadingFloor ? { scale: 0.98 } : {}}
            className={[
              "w-full flex items-center justify-between px-4 py-2 rounded-3xl border text-sm transition-all text-left",
              isActive
                ? "border-primary/60 bg-primary/10 text-primary font-medium"
                : isConfigured
                  ? "border-green-500/40 bg-green-500/5 text-green-700 dark:text-green-400 hover:bg-green-500/10"
                  : "border-border bg-card text-foreground hover:bg-muted/50",
              isLoadingFloor
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
          >
            <div>
              <div className="font-medium leading-tight">Floor {floorNum}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isConfigured ? `${data.units_total} units` : "Not configured"}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isConfigured && <Check className="size-3.5 text-green-500" />}
              {isActive && <span className="size-2 rounded-full bg-primary" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block size-3.5 rounded ${color}`} />
      {label}
    </span>
  );
}
