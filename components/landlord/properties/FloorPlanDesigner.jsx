// components/landlord/properties/FloorPlanDesigner.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Grid3X3, 
  Trash2, 
  Eye, 
  Save, 
  Download, 
  Plus,
  Check,
  AlertCircle,
  Building,
  Layers,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [showAllFloors, setShowAllFloors] = useState(false);

  // Generate floor numbers based on property type and total floors
  const floors = useMemo(() => {
    if (!propertyData?.total_floors) return [];
    
    const floorNumbers = [];
    for (let i = 1; i <= propertyData.total_floors; i++) {
      floorNumbers.push(i);
    }
    return floorNumbers;
  }, [propertyData?.total_floors]);

  // Check validation for all floors
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
        layout_type: 'manual_grid',
        creation_method: 'manual',
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

  const handleCopyFromFloor = useCallback((sourceFloor) => {
    const sourceFloorData = floorData?.[sourceFloor];
    if (sourceFloorData && sourceFloorData.units_ids) {
      // Copy the layout from source floor to current floor
      const copiedFloorData = {
        ...sourceFloorData,
        floor_number: currentFloor
      };
      
      saveFloorPlan(currentFloor, copiedFloorData);
      
      // Update selected units to reflect the copied layout
      setCurrentFloor(currentFloor);
    }
  }, [floorData, currentFloor, saveFloorPlan, setCurrentFloor]);

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
          Design layouts for {propertyData.category === 'Multi-Floor' ? 'each floor' : 'your property'} 
          by selecting units on the grid
        </p>
      </div>

      {/* Multi-Floor Progress Overview */}
      {propertyData.category === 'Multi-Floor' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Building className="w-5 h-5" />
              Multi-Floor Property Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{configuredFloorsCount}</div>
                <div className="text-sm text-blue-700">of {floors.length} floors configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalUnits}</div>
                <div className="text-sm text-green-700">total units designed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((configuredFloorsCount / floors.length) * 100)}%
                </div>
                <div className="text-sm text-purple-700">completion rate</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(configuredFloorsCount / floors.length) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.floors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.floors}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Floor Selection & Info */}
        <div className="space-y-6">
          {/* Floor Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Floors ({floors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {floors.map((floorNum) => (
                <motion.button
                  key={floorNum}
                  onClick={() => handleFloorChange(floorNum)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    currentFloor === floorNum
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Floor {floorNum}
                        {floorNum === 1 && ' (Ground)'}
                      </p>
                      {floorData?.[floorNum] && (
                        <Badge variant="secondary" className="mt-1">
                          {floorData[floorNum].units_total} units
                        </Badge>
                      )}
                    </div>
                    {floorData?.[floorNum] && (
                      <Check className="w-4 h-4 text-green-500" />
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

              {/* Copy from other floors (Multi-Floor only) */}
              {propertyData.category === 'Multi-Floor' && Object.keys(floorData || {}).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Copy from floor:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(floorData || {}).map((floorNum) => {
                      if (parseInt(floorNum) === currentFloor) return null;
                      return (
                        <Button
                          key={floorNum}
                          onClick={() => handleCopyFromFloor(parseInt(floorNum))}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Floor {floorNum}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePreviewToggle}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
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

              {errors.currentFloor && (
                <p className="text-red-500 text-sm">{errors.currentFloor}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grid Designer */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Floor {currentFloor} Layout Designer
                </div>
                <Badge variant="outline">
                  {GRID_SIZE}x{GRID_SIZE} Grid
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grid Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Click on grid cells to select units. 
                    {propertyData.category === 'Multi-Floor' && ' Each floor can have a different layout.'}
                    {!previewMode ? ' Click cells to add/remove units.' : ' Preview mode - editing disabled.'}
                  </p>
                </div>

                {/* Grid Container */}
                <div className="flex justify-center">
                  <div 
                    className="relative border-2 border-gray-300 bg-gray-50"
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Floor Summary (for Multi-Floor properties) */}
      {propertyData.category === 'Multi-Floor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              All Floors Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {floors.map((floorNum) => (
                <div
                  key={floorNum}
                  className={`p-4 rounded-lg border-2 ${
                    floorData?.[floorNum] 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Floor {floorNum}</h4>
                    {floorData?.[floorNum] && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {floorData?.[floorNum] 
                      ? `${floorData[floorNum].units_total} units configured`
                      : 'Not configured'
                    }
                  </p>
                  {floorData?.[floorNum] && (
                    <Badge variant="secondary" className="mt-2">
                      {floorData[floorNum].layout_type || 'Manual'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}