// components/landlord/properties/FloorLayoutEditor.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Grid3X3,
  Save,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRID_SIZE = 8;

// Responsive cell sizes based on screen width
const getCellSize = (isMobile, isTablet) => {
  if (isMobile) return 28;
  if (isTablet) return 32;
  return 40;
};

export default function FloorLayoutEditor({
  propertyId,
  floorNumber,
  existingLayout,
  onSave,
  onCancel,
}) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutData, setLayoutData] = useState({
    layout_type: "rectangular",
    creation_method: "manual",
    units_total: 0,
    layout_data: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Responsive design hooks
  const isMobile = useIsMobile("(max-width: 640px)");
  const isTablet = useIsMobile("(max-width: 1024px)");
  const CELL_SIZE = getCellSize(isMobile, isTablet);

const extractGridDataFromLayout = useCallback((layout) => {
  if (!layout) return [];

  let gridCells = [];

  // Source 1 — grid_configuration selected_cells (web, only trust if non-empty)
  if (layout.grid_configuration?.selected_cells?.length > 0) {
    gridCells = layout.grid_configuration.selected_cells;
  }

  // Source 2 — units_ids array (web fallback)
  else if (layout.units_ids?.length > 0) {
    gridCells = layout.units_ids;
  }

  // Source 3 — units[].svg_id (works for BOTH web and mobile)
  // Mobile saves svg_id directly, web also has svg_id on units
  else if (layout.units?.length > 0) {
    gridCells = layout.units
      .map((unit) => {
        // Trust svg_id if present and valid
        if (unit.svg_id !== undefined && unit.svg_id !== null && !isNaN(unit.svg_id)) {
          return unit.svg_id;
        }
        // Mobile fallback — derive svg_id from svg_geom "x, y" string
        // svg_geom is "col*CELL_SIZE, row*CELL_SIZE"
        // svg_id = row * GRID_SIZE + col
        if (unit.svg_geom && typeof unit.svg_geom === 'string') {
          const parts = unit.svg_geom.split(',').map(p => parseInt(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const col = Math.round(parts[0] / 40); // CELL_SIZE = 40
            const row = Math.round(parts[1] / 40);
            return row * GRID_SIZE + col;
          }
        }
        return null;
      })
      .filter((id) => id !== null && id !== undefined && !isNaN(id))
      .sort((a, b) => a - b);
  }

  // Source 4 — parse SVG layout_data (web only, mobile SVG has no id="unit_X")
  else if (layout.layout_data && typeof layout.layout_data === 'string') {
    // Web SVG has id="unit_X", mobile SVG has no ids — parse rect positions instead
    const unitIdMatches = layout.layout_data.match(/id="unit_(\d+)"/g);
    if (unitIdMatches?.length > 0) {
      // Web path — extract unit_X ids
      gridCells = unitIdMatches
        .map((match) => parseInt(match.match(/\d+/)[0]))
        .filter((id) => !isNaN(id))
        .sort((a, b) => a - b);
    } else {
      // Mobile path — parse rect x/y attributes to derive svg_id
      const rectMatches = layout.layout_data.match(/<rect[^>]*>/g);
      if (rectMatches) {
        gridCells = rectMatches
          .map((rect) => {
            const xMatch = rect.match(/x="(\d+)"/);
            const yMatch = rect.match(/y="(\d+)"/);
            if (xMatch && yMatch) {
              const col = Math.round(parseInt(xMatch[1]) / 40);
              const row = Math.round(parseInt(yMatch[1]) / 40);
              return row * GRID_SIZE + col;
            }
            return null;
          })
          .filter((id) => id !== null && !isNaN(id))
          .sort((a, b) => a - b);
      }
    }
  }

  console.log('Extracted grid cells:', gridCells);
  return gridCells;
}, []);

  // Initialize with existing layout data
  useEffect(() => {
    if (existingLayout) {
      console.log("Loading existing layout:", existingLayout);

      setLayoutData({
        layout_type: existingLayout.layout_type || "rectangular",
        creation_method: existingLayout.creation_method || "manual",
        units_total: existingLayout.units_total || 0,
        layout_data: existingLayout.layout_data || "",
        notes: existingLayout.notes || "",
      });

      // Extract and set selected units
      const extractedUnits = extractGridDataFromLayout(existingLayout);
      setSelectedUnits(extractedUnits);

      console.log("Loaded selected units:", extractedUnits);
    }
  }, [existingLayout, extractGridDataFromLayout]);

  const handleCellClick = useCallback(
    (cellIndex) => {
      if (previewMode) return;

      setSelectedUnits((prev) => {
        const newSelected = prev.includes(cellIndex)
          ? prev.filter((id) => id !== cellIndex)
          : [...prev, cellIndex];

        setLayoutData((prevData) => ({
          ...prevData,
          units_total: newSelected.length,
        }));

        return newSelected;
      });
    },
    [previewMode],
  );

  const handleClearSelection = () => {
    setSelectedUnits([]);
    setLayoutData((prev) => ({ ...prev, units_total: 0 }));
  };

  const generateSVGString = useCallback((units) => {
    if (!units || units.length === 0) return "";

    const svgElements = units
      .map((cellIndex, idx) => {
        const x = (cellIndex % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(cellIndex / GRID_SIZE) * CELL_SIZE;

        return `<rect width="${CELL_SIZE}" height="${CELL_SIZE}" x="${x}" y="${y}" id="unit_${cellIndex}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
              <text x="${x + CELL_SIZE / 2}" y="${y + CELL_SIZE / 2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${idx + 1}</text>`;
      })
      .join("\n");

    return `<svg width="${GRID_SIZE * CELL_SIZE}" height="${GRID_SIZE * CELL_SIZE}" xmlns="http://www.w3.org/2000/svg">
              ${svgElements}
            </svg>`;
  }, []);

  const generateLayoutPreview = useCallback(
    (units) => {
      if (!units || units.length === 0) return null;

      const positions = units.map((cellIndex) => ({
        x: cellIndex % GRID_SIZE,
        y: Math.floor(cellIndex / GRID_SIZE),
        cellIndex,
      }));

      const sortedUnits = [...units].sort((a, b) => a - b);
      const minX = Math.min(...positions.map((p) => p.x));
      const maxX = Math.max(...positions.map((p) => p.x));
      const minY = Math.min(...positions.map((p) => p.y));
      const maxY = Math.max(...positions.map((p) => p.y));

      const width = maxX - minX + 1;
      const height = maxY - minY + 1;

      let layoutType = "custom";
      if (width === 1) layoutType = "vertical_line";
      else if (height === 1) layoutType = "horizontal_line";
      else if (width === height) layoutType = "square";
      else if (width > height * 1.5) layoutType = "wide_rectangle";
      else if (height > width * 1.5) layoutType = "tall_rectangle";
      else layoutType = "rectangle";

      return {
        svg: generateSVGString(units),
        units_count: units.length,
        layout_type: layoutType,
        dimensions: { width, height },
        coverage_area: width * height,
        density: (units.length / (width * height)) * 100,
        unit_positions: positions,
        sorted_units: sortedUnits,
        metadata: {
          min_coordinates: { x: minX, y: minY },
          max_coordinates: { x: maxX, y: maxY },
          total_cells_used: units.length,
          layout_efficiency: (
            (units.length / (GRID_SIZE * GRID_SIZE)) *
            100
          ).toFixed(1),
        },
      };
    },
    [generateSVGString],
  );

  const handleSaveLayout = async () => {
    if (selectedUnits.length === 0) {
      setError("Please select at least one unit before saving");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const svgString = generateSVGString(selectedUnits);
      const layoutPreview = generateLayoutPreview(selectedUnits);

      const floorData = {
        floor_number: floorNumber,
        units_total: selectedUnits.length,
        layout_type: layoutData.layout_type,
        creation_method: layoutData.creation_method,
        layout_data: svgString,

        // Add grid configuration for future editing
        grid_configuration: {
          grid_size: GRID_SIZE,
          cell_size: CELL_SIZE,
          selected_cells: selectedUnits,
          layout_type: "manual_grid",
          created_at: new Date().toISOString(),
        },

        // Add layout preview for summary
        layout_preview: layoutPreview,

        // Generate units details
        units_details: selectedUnits.map((cellIndex, idx) => {
          const x = cellIndex % GRID_SIZE;
          const y = Math.floor(cellIndex / GRID_SIZE);
          return {
            svg_id: cellIndex,
            unit_number: idx + 1,
            grid_position: { x, y },
            coordinates: { x: x * CELL_SIZE, y: y * CELL_SIZE },
            area_sqm: 150,
            status: "available",
            floor_number: floorNumber, // Backend expects 0-based
            unit_name: `${String.fromCharCode(65 + Math.floor(idx / 26))}${(idx % 26) + 1}`,
            rent_amount: 0,
            rooms: 1,
            utilities: {
              electricity: false,
              water: false,
              wifi: false,
            },
            svg_geom: `M${x * CELL_SIZE},${y * CELL_SIZE} L${(x + 1) * CELL_SIZE},${y * CELL_SIZE} L${(x + 1) * CELL_SIZE},${(y + 1) * CELL_SIZE} L${x * CELL_SIZE},${(y + 1) * CELL_SIZE} Z`,
          };
        }),
      };

      console.log("Saving floor data:", floorData);

      // Pass the data to the parent component
      await onSave(floorData);
    } catch (err) {
      console.error("Error saving floor layout:", err);
      setError(err.message || "Failed to save floor layout");
    } finally {
      setIsLoading(false);
    }
  };

  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const isSelected = selectedUnits.includes(i);
      const x = (i % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;

      cells.push(
        <div
          key={i}
          onClick={() => handleCellClick(i)}
          className={`
            border-2 rounded cursor-pointer transition-all duration-200 relative flex-shrink-0
            ${
              isSelected
                ? "bg-blue-500 border-blue-600 shadow-lg transform scale-105"
                : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }
            ${previewMode ? "cursor-default" : "hover:shadow-md"}
          `}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <span 
                className="text-white font-bold"
                style={{ fontSize: Math.max(10, CELL_SIZE * 0.4) }}
              >
                {selectedUnits.indexOf(i) + 1}
              </span>
            </div>
          )}
          {isSelected && !previewMode && (
            <div 
              className="absolute bg-green-400 rounded-full"
              style={{
                top: -CELL_SIZE * 0.15,
                right: -CELL_SIZE * 0.15,
                width: CELL_SIZE * 0.3,
                height: CELL_SIZE * 0.3,
              }}
            ></div>
          )}
        </div>,
      );
    }
    return cells;
  }, [selectedUnits, previewMode, handleCellClick, CELL_SIZE]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-2 sm:px-0">
        <h3 className="text-lg sm:text-xl font-semibold">
          Floor {floorNumber} Layout Editor
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {existingLayout && existingLayout.configured
            ? "Edit the existing floor layout"
            : "Create a new floor layout by selecting units on the grid"}
        </p>
        {existingLayout && existingLayout.configured && (
          <div className="mt-2 text-xs sm:text-sm text-green-600">
            ✓ Loaded existing layout with {selectedUnits.length} units
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-2 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
        {/* Configuration Panel */}
        <div className="space-y-4">
          {/* Layout Configuration */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full">
                <Label htmlFor="layout_type" className="mb-2">
                  Layout Type
                </Label>
                <Select
                  value={layoutData.layout_type}
                  onValueChange={(value) =>
                    setLayoutData((prev) => ({ ...prev, layout_type: value }))
                  }
                  className="w-full"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select layout type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangular">Rectangular</SelectItem>
                    <SelectItem value="l_shaped">L-Shaped</SelectItem>
                    <SelectItem value="u_shaped">U-Shaped</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2" htmlFor="creation_method">
                  Creation Method
                </Label>
                <Select
                  value={layoutData.creation_method}
                  onValueChange={(value) =>
                    setLayoutData((prev) => ({
                      ...prev,
                      creation_method: value,
                    }))
                  }
                  className="w-full"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select creation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                    <SelectItem value="auto">Auto-Generated</SelectItem>
                    <SelectItem value="template">From Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-2">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this floor layout..."
                  value={layoutData.notes}
                  onChange={(e) =>
                    setLayoutData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card> */}

          {/* Units Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Units Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Units:
                </span>
                <Badge variant="outline">{selectedUnits.length}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Grid Utilization:
                </span>
                <Badge variant="outline">
                  {(
                    (selectedUnits.length / (GRID_SIZE * GRID_SIZE)) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedUnits.length === 0}
                  className="w-fit"
                >
                  <Trash2 />
                  Clear All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-fit"
                >
                  <Eye />
                  {previewMode ? "Edit Mode" : "Preview Mode"}
                </Button>
              </div>

              {selectedUnits.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click on grid cells to select units for this floor.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grid Designer */}
        <div className="lg:col-span-2">
          <Card className="px-0">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-base sm:text-lg">Floor Layout Grid</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <span className="text-gray-500">
                    {GRID_SIZE}x{GRID_SIZE} Grid
                  </span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-4 sm:space-y-8">
                {/* Grid Instructions */}
                <div
                  className={`p-3 sm:p-4 border rounded-lg sm:rounded-3xl text-xs sm:text-sm ${previewMode ? "bg-green-50 border-green-700" : "bg-blue-50 border-blue-700"}`}
                >
                  <p
                    className={`${previewMode ? "text-green-800" : "text-blue-800"}`}
                  >
                    {previewMode ? (
                      <>
                        <strong>Preview Mode:</strong> This is how your floor
                        layout will look. Switch to Edit Mode to make changes.
                      </>
                    ) : (
                      <>
                        <strong>Edit Mode:</strong> Click on grid cells to
                        select/deselect units. Selected cells will become units
                        in your floor plan.
                      </>
                    )}
                  </p>
                </div>

                {/* Grid Container */}
                <div className="flex justify-center overflow-x-auto">
                  <div
                    className={`relative flex-shrink-0 ${previewMode ? "border-green-300 bg-green-50" : " "}`}
                    style={{
                      width: GRID_SIZE * CELL_SIZE,
                      height: GRID_SIZE * CELL_SIZE,
                    }}
                  >
                    {gridCells}
                  </div>
                </div>

                {/* Grid Legend */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 text-xs sm:text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                    <span>Selected Unit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-background border rounded"></div>
                    <span>Available Space</span>
                  </div>
                  {previewMode && (
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span>Preview Mode Active</span>
                    </div>
                  )}
                </div>

                {/* Layout Preview SVG */}
                {selectedUnits.length > 0 && (
                  <div className="mt-4 sm:mt-6">
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                      Layout Preview (SVG Export)
                    </h4>
                    <div className="border rounded-lg p-3 sm:p-4 overflow-x-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateSVGString(selectedUnits),
                        }}
                        className="flex justify-center flex-shrink-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 px-2 sm:px-0">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-fit px-4 sm:px-6">
          Cancel
        </Button>
        <Button
          onClick={handleSaveLayout}
          disabled={isLoading || selectedUnits.length === 0}
          className="w-full sm:w-fit px-4 sm:px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Layout"}
        </Button>
      </div>
    </div>
  );
}
