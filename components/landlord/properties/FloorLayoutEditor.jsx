// components/landlord/properties/FloorLayoutEditor.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Grid3X3, 
  Save, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertCircle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function FloorLayoutEditor({ 
  propertyId, 
  floorNumber, 
  existingLayout,
  onSave,
  onCancel 
}) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutData, setLayoutData] = useState({
    layout_type: 'rectangular',
    creation_method: 'manual',
    units_total: 0,
    layout_data: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract grid data from existing layout
  const extractGridDataFromLayout = useCallback((layout) => {
    if (!layout) return [];

    // Try different sources for grid data
    let gridCells = [];

    // 1. Check for grid_configuration (from useFloorPlan hook)
    if (layout.grid_configuration?.selected_cells) {
      gridCells = layout.grid_configuration.selected_cells;
    }
    // 2. Check for units_ids (from floorMemory)
    else if (layout.units_ids?.length > 0) {
      gridCells = layout.units_ids;
    }
    // 3. Extract from units data (svg_id)
    else if (layout.units?.length > 0) {
      gridCells = layout.units
        .map(unit => unit.svg_id)
        .filter(id => id !== undefined && id !== null)
        .sort((a, b) => a - b);
    }
    // 4. Try to parse from layout_data SVG
    else if (layout.layout_data && typeof layout.layout_data === 'string') {
      try {
        // Extract unit_X ids from SVG
        const unitMatches = layout.layout_data.match(/id="unit_(\d+)"/g);
        if (unitMatches) {
          gridCells = unitMatches
            .map(match => parseInt(match.match(/\d+/)[0]))
            .filter(id => !isNaN(id))
            .sort((a, b) => a - b);
        }
      } catch (err) {
        console.warn('Failed to parse grid data from SVG:', err);
      }
    }

    console.log('Extracted grid cells:', gridCells);
    return gridCells;
  }, []);

  // Initialize with existing layout data
  useEffect(() => {
    if (existingLayout) {
      console.log('Loading existing layout:', existingLayout);
      
      setLayoutData({
        layout_type: existingLayout.layout_type || 'rectangular',
        creation_method: existingLayout.creation_method || 'manual',
        units_total: existingLayout.units_total || 0,
        layout_data: existingLayout.layout_data || '',
        notes: existingLayout.notes || ''
      });
      
      // Extract and set selected units
      const extractedUnits = extractGridDataFromLayout(existingLayout);
      setSelectedUnits(extractedUnits);
      
      console.log('Loaded selected units:', extractedUnits);
    }
  }, [existingLayout, extractGridDataFromLayout]);

  const handleCellClick = useCallback((cellIndex) => {
    if (previewMode) return;
    
    setSelectedUnits(prev => {
      const newSelected = prev.includes(cellIndex)
        ? prev.filter(id => id !== cellIndex)
        : [...prev, cellIndex];
      
      setLayoutData(prevData => ({
        ...prevData,
        units_total: newSelected.length
      }));
      
      return newSelected;
    });
  }, [previewMode]);

  const handleClearSelection = () => {
    setSelectedUnits([]);
    setLayoutData(prev => ({ ...prev, units_total: 0 }));
  };

  const generateSVGString = useCallback((units) => {
    if (!units || units.length === 0) return '';
    
    const svgElements = units.map((cellIndex, idx) => {
      const x = (cellIndex % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(cellIndex / GRID_SIZE) * CELL_SIZE;
      
      return `<rect width="${CELL_SIZE}" height="${CELL_SIZE}" x="${x}" y="${y}" id="unit_${cellIndex}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
              <text x="${x + CELL_SIZE/2}" y="${y + CELL_SIZE/2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${idx + 1}</text>`;
    }).join('\n');
    
    return `<svg width="${GRID_SIZE * CELL_SIZE}" height="${GRID_SIZE * CELL_SIZE}" xmlns="http://www.w3.org/2000/svg">
              ${svgElements}
            </svg>`;
  }, []);

  const generateLayoutPreview = useCallback((units) => {
    if (!units || units.length === 0) return null;
    
    const positions = units.map(cellIndex => ({
      x: cellIndex % GRID_SIZE,
      y: Math.floor(cellIndex / GRID_SIZE),
      cellIndex
    }));
    
    const sortedUnits = [...units].sort((a, b) => a - b);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    let layoutType = 'custom';
    if (width === 1) layoutType = 'vertical_line';
    else if (height === 1) layoutType = 'horizontal_line';
    else if (width === height) layoutType = 'square';
    else if (width > height * 1.5) layoutType = 'wide_rectangle';
    else if (height > width * 1.5) layoutType = 'tall_rectangle';
    else layoutType = 'rectangle';
    
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
        layout_efficiency: ((units.length / (GRID_SIZE * GRID_SIZE)) * 100).toFixed(1)
      }
    };
  }, [generateSVGString]);

  const handleSaveLayout = async () => {
    if (selectedUnits.length === 0) {
      setError('Please select at least one unit before saving');
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
          layout_type: 'manual_grid',
          created_at: new Date().toISOString()
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
            status: 'available',
            floor_number: floorNumber - 1, // Backend expects 0-based
            unit_name: `${String.fromCharCode(65 + Math.floor(idx / 26))}${(idx % 26) + 1}`,
            rent_amount: 0,
            rooms: 1,
            utilities: {
              electricity: false,
              water: false,
              wifi: false
            },
            svg_geom: `M${x * CELL_SIZE},${y * CELL_SIZE} L${(x + 1) * CELL_SIZE},${y * CELL_SIZE} L${(x + 1) * CELL_SIZE},${(y + 1) * CELL_SIZE} L${x * CELL_SIZE},${(y + 1) * CELL_SIZE} Z`
          };
        })
      };

      console.log('Saving floor data:', floorData);
      
      // Pass the data to the parent component
      await onSave(floorData);
      
    } catch (err) {
      console.error('Error saving floor layout:', err);
      setError(err.message || 'Failed to save floor layout');
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
            w-10 h-10 border-2 cursor-pointer transition-all duration-200 relative
            ${isSelected 
              ? 'bg-blue-500 border-blue-600 shadow-lg transform scale-105' 
              : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }
            ${previewMode ? 'cursor-default' : 'hover:shadow-md'}
          `}
          style={{
            position: 'absolute',
            left: x,
            top: y,
          }}
        >
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {selectedUnits.indexOf(i) + 1}
              </span>
            </div>
          )}
          {isSelected && !previewMode && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
          )}
        </div>
      );
    }
    return cells;
  }, [selectedUnits, previewMode, handleCellClick]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold">
          Floor {floorNumber} Layout Editor
        </h3>
        <p className="text-muted-foreground">
          {existingLayout && existingLayout.configured 
            ? 'Edit the existing floor layout'
            : 'Create a new floor layout by selecting units on the grid'
          }
        </p>
        {existingLayout && existingLayout.configured && (
          <div className="mt-2 text-sm text-green-600">
            ✓ Loaded existing layout with {selectedUnits.length} units
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Layout Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="layout_type">Layout Type</Label>
                <Select
                  value={layoutData.layout_type}
                  onValueChange={(value) => setLayoutData(prev => ({ ...prev, layout_type: value }))}
                >
                  <SelectTrigger>
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
                <Label htmlFor="creation_method">Creation Method</Label>
                <Select
                  value={layoutData.creation_method}
                  onValueChange={(value) => setLayoutData(prev => ({ ...prev, creation_method: value }))}
                >
                  <SelectTrigger>
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this floor layout..."
                  value={layoutData.notes}
                  onChange={(e) => setLayoutData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Units Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Units Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Units:</span>
                <Badge variant="outline">{selectedUnits.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grid Utilization:</span>
                <Badge variant="outline">
                  {((selectedUnits.length / (GRID_SIZE * GRID_SIZE)) * 100).toFixed(1)}%
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedUnits.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Edit Mode' : 'Preview Mode'}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Floor Layout Grid
                </div>
                <Badge variant="outline">
                  {GRID_SIZE}x{GRID_SIZE} Grid
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grid Instructions */}
                <div className={`p-4 rounded-lg ${previewMode ? 'bg-green-50' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${previewMode ? 'text-green-800' : 'text-blue-800'}`}>
                    {previewMode ? (
                      <>
                        <strong>Preview Mode:</strong> This is how your floor layout will look. 
                        Switch to Edit Mode to make changes.
                      </>
                    ) : (
                      <>
                        <strong>Edit Mode:</strong> Click on grid cells to select/deselect units. 
                        Selected cells will become units in your floor plan.
                      </>
                    )}
                  </p>
                </div>

                {/* Grid Container */}
                <div className="flex justify-center">
                  <div 
                    className={`relative border-2 ${previewMode ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
                    style={{
                      width: GRID_SIZE * CELL_SIZE,
                      height: GRID_SIZE * CELL_SIZE,
                    }}
                  >
                    {gridCells}
                  </div>
                </div>

                {/* Grid Legend */}
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Selected Unit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                    <span>Available Space</span>
                  </div>
                  {previewMode && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Preview Mode Active</span>
                    </div>
                  )}
                </div>

                {/* Layout Preview SVG */}
                {selectedUnits.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Layout Preview (SVG Export)
                    </h4>
                    <div className="border rounded-lg p-4 bg-white">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: generateSVGString(selectedUnits) 
                        }}
                        className="flex justify-center"
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
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveLayout}
          disabled={selectedUnits.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {existingLayout && existingLayout.configured ? 'Update Layout' : 'Save Layout'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}