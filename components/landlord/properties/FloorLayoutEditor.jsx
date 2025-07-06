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
import PropertyService from "@/services/landlord/property";

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

  // Initialize with existing layout data
  useEffect(() => {
    if (existingLayout && existingLayout.configured) {
      setLayoutData({
        layout_type: existingLayout.layout_type || 'rectangular',
        creation_method: existingLayout.creation_method || 'manual',
        units_total: existingLayout.units_total || 0,
        layout_data: existingLayout.layout_data || '',
        notes: existingLayout.notes || ''
      });
      
      // Extract selected units from existing layout if available
      if (existingLayout.grid_configuration && existingLayout.grid_configuration.selected_cells) {
        setSelectedUnits(existingLayout.grid_configuration.selected_cells);
      }
    }
  }, [existingLayout]);

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

  const handleSaveLayout = async () => {
    if (selectedUnits.length === 0) {
      setError('Please select at least one unit before saving');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const svgString = generateSVGString(selectedUnits);
      
      const floorData = {
        floor_id: existingLayout?.id || null,
        floor_no: floorNumber - 1, // Convert to 0-based for backend
        units_total: selectedUnits.length,
        layout_type: layoutData.layout_type,
        creation_method: layoutData.creation_method,
        layout_data: svgString,
        units: selectedUnits.map((cellIndex, idx) => ({
          svg_id: cellIndex,
          svg_geom: `<rect width="${CELL_SIZE}" height="${CELL_SIZE}" x="${(cellIndex % GRID_SIZE) * CELL_SIZE}" y="${Math.floor(cellIndex / GRID_SIZE) * CELL_SIZE}" id="unit_${cellIndex}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />`,
          floor_number: floorNumber - 1,
          unit_name: `${String.fromCharCode(65 + Math.floor(idx / 26))}${(idx % 26) + 1}`,
          area_sqm: 150,
          bedrooms: 1,
          status: 'vacant',
          rent_amount: 0,
          payment_freq: 'monthly',
          utilities: {
            electricity: false,
            water: false,
            wifi: false
          }
        }))
      };

      let response;
      if (existingLayout && existingLayout.configured) {
        // Update existing floor
        response = await PropertyService.updateFloorLayout(propertyId, floorData);
      } else {
        // Create new floor
        response = await PropertyService.addFloor(propertyId, floorData);
      }

      console.log('Floor layout saved successfully:', response);
      onSave();
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
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Selection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected Units</p>
                <p className="text-2xl font-bold text-primary-600">
                  {selectedUnits.length}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Estimated Area</p>
                <p className="text-lg font-semibold">
                  {(selectedUnits.length * 150).toLocaleString()} sq m
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSaveLayout}
                  disabled={selectedUnits.length === 0 || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Layout
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleClearSelection}
                  disabled={selectedUnits.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
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