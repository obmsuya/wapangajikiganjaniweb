// components/landlord/properties/FloorPlanDesigner.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Grid3X3, RotateCcw, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePropertyCreation, useFloorPlan } from "@/hooks/properties/useProperties";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function FloorPlanDesigner({ onValidationChange }) {
  const { propertyData, updateFloorData } = usePropertyCreation();
  const {
    selectedUnits,
    currentFloor,
    floorData,
    setCurrentFloor,
    toggleUnit,
    clearSelection,
    saveFloorPlan,
    generateSVGString
  } = useFloorPlan();

  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);

  // Generate floor numbers based on property type
  const getFloorNumbers = () => {
    const floors = [];
    for (let i = 1; i <= propertyData.total_floors; i++) {
      floors.push(i);
    }
    return floors;
  };

  const floors = getFloorNumbers();

  const validateFloorPlan = useCallback(() => {
    const newErrors = {};
    let hasValidFloor = false;

    // Check if at least one floor has units
    floors.forEach(floorNum => {
      const floor = floorData[floorNum];
      if (floor && floor.units_total > 0) {
        hasValidFloor = true;
      }
    });

    if (!hasValidFloor) {
      newErrors.floors = 'Please add at least one unit to any floor';
    }

    // Check current floor has units if it's been worked on
    if (selectedUnits.length === 0 && floorData[currentFloor]) {
      newErrors.currentFloor = `Floor ${currentFloor} needs at least one unit`;
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0 && hasValidFloor;
    onValidationChange?.(isValid);
    return isValid;
  }, [floors, floorData, selectedUnits, currentFloor, onValidationChange]);

  useEffect(() => {
    validateFloorPlan();
  }, [validateFloorPlan]);

  const handleCellClick = (cellIndex) => {
    if (previewMode) return;
    toggleUnit(cellIndex);
  };

  const handleSaveCurrentFloor = () => {
    if (selectedUnits.length === 0) {
      setErrors(prev => ({ ...prev, currentFloor: 'Please select at least one unit' }));
      return;
    }

    const svgString = generateSVGString(selectedUnits);
    const floorPlanData = {
      floor_number: currentFloor,
      units_ids: selectedUnits,
      units_total: selectedUnits.length,
      layout_data: svgString,
      area: selectedUnits.length * 150 // Approximate area calculation
    };

    saveFloorPlan(currentFloor, floorPlanData);
    updateFloorData(currentFloor, floorPlanData);
    
    setErrors(prev => ({ ...prev, currentFloor: null }));
  };

  const handleFloorChange = (floorNumber) => {
    // Save current floor before switching
    if (selectedUnits.length > 0 && !floorData[currentFloor]) {
      handleSaveCurrentFloor();
    }
    
    setCurrentFloor(floorNumber);
    
    // Load existing floor data if available
    const existingFloor = floorData[floorNumber];
    if (existingFloor && existingFloor.units_ids) {
      // This would need to be handled by the hook
      clearSelection();
      existingFloor.units_ids.forEach(unitId => {
        // Add units back to selection
      });
    } else {
      clearSelection();
    }
  };

  const handleClearFloor = () => {
    clearSelection();
    setErrors(prev => ({ ...prev, currentFloor: null }));
  };

  const generateGrid = () => {
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
            w-10 h-10 border border-gray-300 cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-primary-600 border-primary-700 shadow-md' 
              : 'bg-white hover:bg-gray-100'
            }
            ${previewMode ? 'cursor-default' : 'hover:shadow-sm'}
          `}
          style={{
            position: 'absolute',
            left: x,
            top: y,
          }}
        >
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {i + 1}
              </span>
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  const getTotalUnits = () => {
    return Object.values(floorData).reduce((total, floor) => total + (floor.units_total || 0), 0);
  };

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
                    {floorData[floorNum] && (
                      <Badge variant="secondary">
                        {floorData[floorNum].units_total} units
                      </Badge>
                    )}
                  </div>
                  {floorData[floorNum] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Configured
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
                  {selectedUnits.length}
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleSaveCurrentFloor}
                  disabled={selectedUnits.length === 0}
                  className="w-full"
                  variant={selectedUnits.length > 0 ? "default" : "outline"}
                >
                  Save Floor Plan
                </Button>
                
                <Button
                  onClick={handleClearFloor}
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
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                    {Object.keys(floorData).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span className="font-medium text-primary-600">
                    {getTotalUnits()}
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
                    ? "Preview mode - Units are displayed as they will appear"
                    : "Click on grid cells to select/deselect units for this floor"
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
                    {generateGrid()}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                    <span>Available Space</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary-600 rounded"></div>
                    <span>Selected Unit</span>
                  </div>
                </div>
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

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use the Floor Designer:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select different floors using the tabs on the left</li>
            <li>• Click on grid cells to add/remove units for the current floor</li>
            <li>• Save each floor before moving to the next one</li>
            <li>• Use preview mode to see how your layout will look</li>
            <li>• Each selected cell represents one rental unit</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}