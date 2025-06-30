// components/landlord/properties/FloorPlanDesigner.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Grid3X3, Trash2, Eye, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFloorPlan } from "@/hooks/properties/useProperties";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function FloorPlanDesigner({ 
  onValidationChange, 
  propertyData, 
  floorData, 
  updateFloorData 
}) {
  const {
    selectedUnits,
    currentFloor,
    setCurrentFloor,
    toggleUnit,
    clearSelection,
    saveFloorPlan,
    generateSVGString,
    generateLayoutPreview
  } = useFloorPlan(updateFloorData, floorData);

  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutPreview, setLayoutPreview] = useState(null);

  const floors = useMemo(() => {
    if (!propertyData?.total_floors) return [];
    
    const floorNumbers = [];
    for (let i = 1; i <= propertyData.total_floors; i++) {
      floorNumbers.push(i);
    }
    return floorNumbers;
  }, [propertyData?.total_floors]);

  const isFloorPlanValid = useMemo(() => {
    const newErrors = {};
    let hasValidFloor = false;

    if (floors.length > 0) {
      floors.forEach(floorNum => {
        const floor = floorData?.[floorNum];
        if (floor && floor.units_total > 0) {
          hasValidFloor = true;
        }
      });

      if (!hasValidFloor) {
        newErrors.floors = 'Please add at least one unit to any floor';
      }
    } else {
      newErrors.floors = 'Property must have at least one floor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && hasValidFloor;
  }, [floors, floorData]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFloorPlanValid);
    }
  }, [isFloorPlanValid, onValidationChange]);

  // Generate layout preview whenever selected units change
  useEffect(() => {
    if (selectedUnits && selectedUnits.length > 0) {
      const preview = generateLayoutPreview(selectedUnits);
      setLayoutPreview(preview);
    } else {
      setLayoutPreview(null);
    }
  }, [selectedUnits, generateLayoutPreview]);

  const handleCellClick = useCallback((cellIndex) => {
    if (previewMode || !toggleUnit) return;
    toggleUnit(cellIndex);
  }, [previewMode, toggleUnit]);

  const handleSaveCurrentFloor = useCallback(() => {
    if (!selectedUnits || selectedUnits.length === 0) {
      setErrors(prev => ({ ...prev, currentFloor: 'Please select at least one unit' }));
      return;
    }

    try {
      // Generate comprehensive layout data
      const svgString = generateSVGString(selectedUnits);
      const layoutPreviewData = generateLayoutPreview(selectedUnits);
      
      const floorPlanData = {
        floor_number: currentFloor,
        units_ids: [...selectedUnits],
        units_total: selectedUnits.length,
        layout_data: svgString,
        layout_preview: layoutPreviewData,
        area: selectedUnits.length * 150,
        grid_configuration: {
          grid_size: GRID_SIZE,
          cell_size: CELL_SIZE,
          selected_cells: selectedUnits,
          layout_type: 'manual_grid'
        }
      };

      saveFloorPlan(currentFloor, floorPlanData);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.currentFloor;
        return newErrors;
      });
      
    } catch (error) {
      console.error('Error saving floor plan:', error);
      setErrors(prev => ({ 
        ...prev, 
        currentFloor: 'Failed to save floor plan. Please try again.' 
      }));
    }
  }, [selectedUnits, currentFloor, generateSVGString, generateLayoutPreview, saveFloorPlan]);

  const handleFloorChange = useCallback((floorNumber) => {
    if (!setCurrentFloor) return;

    const currentFloorData = floorData?.[currentFloor];
    const hasUnsavedChanges = selectedUnits && selectedUnits.length > 0 && !currentFloorData;
    
    if (hasUnsavedChanges) {
      handleSaveCurrentFloor();
    }
    
    setCurrentFloor(floorNumber);
  }, [selectedUnits, currentFloor, floorData, setCurrentFloor, handleSaveCurrentFloor]);

  const handleClearFloor = useCallback(() => {
    if (!clearSelection) return;
    
    clearSelection();
    setLayoutPreview(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.currentFloor;
      return newErrors;
    });
  }, [clearSelection]);

  const handlePreviewToggle = useCallback(() => {
    setPreviewMode(!previewMode);
  }, [previewMode]);

  const handleDownloadLayout = useCallback(() => {
    if (!layoutPreview) return;
    
    const blob = new Blob([layoutPreview.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-${currentFloor}-layout.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layoutPreview, currentFloor]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const isSelected = selectedUnits?.includes(i) || false;
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

  const totalUnits = useMemo(() => {
    if (!floorData || typeof floorData !== 'object') return 0;
    return Object.values(floorData).reduce((total, floor) => {
      return total + (floor?.units_total || 0);
    }, 0);
  }, [floorData]);

  const configuredFloorsCount = useMemo(() => {
    if (!floorData || typeof floorData !== 'object') return 0;
    return Object.keys(floorData).length;
  }, [floorData]);

  const currentFloorData = useMemo(() => {
    return floorData?.[currentFloor];
  }, [floorData, currentFloor]);

  if (!floors.length) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Floor Plan Design</h2>
          <p className="text-muted-foreground">
            Design the layout for each floor by selecting units on the grid
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Please configure your property details first to set the number of floors.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Floor Plan Design</h2>
        <p className="text-muted-foreground">
          Design the layout for each floor by selecting units on the grid
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Floor Tabs and Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Floor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Floors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {floors.map((floorNum) => (
                <motion.button
                  key={floorNum}
                  onClick={() => handleFloorChange(floorNum)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    currentFloor === floorNum
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Floor {floorNum}</span>
                    {floorData?.[floorNum] && (
                      <Badge variant="secondary">
                        {floorData[floorNum].units_total} units
                      </Badge>
                    )}
                  </div>
                  {floorData?.[floorNum] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Configured ✓
                    </p>
                  )}
                </motion.button>
              ))}
            </CardContent>
          </Card>

          {/* Current Floor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Floor {currentFloor}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected Units</p>
                <p className="text-2xl font-bold text-primary-600">
                  {selectedUnits?.length || 0}
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleSaveCurrentFloor}
                  disabled={!selectedUnits || selectedUnits.length === 0}
                  className="w-full"
                  variant={selectedUnits && selectedUnits.length > 0 ? "default" : "outline"}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Floor Plan
                </Button>
                
                <Button
                  onClick={handleClearFloor}
                  disabled={!selectedUnits || selectedUnits.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePreviewToggle}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </Button>
                
                {layoutPreview && (
                  <Button
                    onClick={handleDownloadLayout}
                    variant="ghost"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Layout Preview Card */}
          {layoutPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Layout Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4">
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: layoutPreview.svg }}
                  />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Units: {layoutPreview.units_count}</p>
                  <p>Configuration: {layoutPreview.layout_type}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Floors:</span>
                  <span className="font-medium">{floors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Configured Floors:</span>
                  <span className="font-medium">
                    {configuredFloorsCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span className="font-medium text-primary-600">
                    {totalUnits}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Grid Designer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Floor {currentFloor} Layout</span>
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {GRID_SIZE} × {GRID_SIZE} Grid
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {previewMode 
                    ? "Preview mode - Units are displayed as they will appear in the final layout"
                    : "Click on grid cells to select/deselect units for this floor. Selected cells will become rental units."
                  }
                </div>

                {/* Grid Container */}
                <div 
                  className="relative border-2 border-dashed border-gray-300 mx-auto bg-gray-50 rounded-lg"
                  style={{
                    width: GRID_SIZE * CELL_SIZE + 40,
                    height: GRID_SIZE * CELL_SIZE + 40,
                    padding: 20
                  }}
                >
                  <div 
                    className="relative"
                    style={{
                      width: GRID_SIZE * CELL_SIZE,
                      height: GRID_SIZE * CELL_SIZE
                    }}
                  >
                    {gridCells}
                  </div>
                </div>

                {/* Enhanced Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                    <span>Available Space</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded"></div>
                    <span>Selected Unit</span>
                  </div>
                  {previewMode && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>Active Selection</span>
                    </div>
                  )}
                </div>

                {/* Current Floor Status */}
                {currentFloorData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Floor {currentFloor} Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Units Configured:</span>
                        <span className="font-medium ml-2">{currentFloorData.units_total}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Layout Type:</span>
                        <span className="font-medium ml-2 capitalize">
                          {currentFloorData.grid_configuration?.layout_type || 'Manual Grid'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Messages */}
      {Object.entries(errors).map(([key, error]) => (
        <div key={key} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      ))}

      {/* Enhanced Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use the Floor Designer:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select different floors using the tabs on the left</li>
            <li>• Click on grid cells to add/remove units for the current floor</li>
            <li>• **IMPORTANT**: Save each floor before moving to the next one</li>
            <li>• Use preview mode to see how your layout will look</li>
            <li>• Each selected cell represents one rental unit</li>
            <li>• Download layouts as SVG files for your records</li>
            <li>• The layout preview shows exactly how units will appear to tenants</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}