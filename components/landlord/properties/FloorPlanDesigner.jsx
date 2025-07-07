// components/landlord/properties/FloorPlanDesigner.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Grid3X3, 
  Save, 
  Check,
  AlertCircle,
  Building,
  Layers,
  Users,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFloorPlan } from "@/hooks/properties/useProperties";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const GRID_SIZE = 8;
const CELL_SIZE = 40;

export default function FloorPlanDesigner({ 
  onValidationChange, 
  propertyData, 
  floorData, 
  updateFloorData,
  existingProperty = null
}) {
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
    floorMemory
  } = useFloorPlan(updateFloorData, floorData, existingProperty);

  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [tenantWarning, setTenantWarning] = useState(null);
  const [isLoadingFloor, setIsLoadingFloor] = useState(false);

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
        const floor = floorMemory[floorNum];
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
  }, [floors, floorMemory]);

  const handleFloorChange = useCallback(async (floorNumber) => {
    if (floorNumber === currentFloor) return;
    
    setIsLoadingFloor(true);
    
    try {
      if (selectedUnits.length > 0) {
        await handleSaveCurrentFloor();
      }
      
      await loadFloorData(floorNumber);
      
    } catch (error) {
      console.error('Error changing floor:', error);
      setErrors(prev => ({ 
        ...prev, 
        floorChange: 'Failed to load floor data. Please try again.' 
      }));
    } finally {
      setIsLoadingFloor(false);
    }
  }, [currentFloor, selectedUnits, loadFloorData]);

  const handleUnitToggle = useCallback(async (cellIndex) => {
    if (previewMode) return;
    
    if (selectedUnits.includes(cellIndex) && existingProperty) {
      try {
        const tenantInfo = await validateUnitDeletion(currentFloor, cellIndex);
        
        if (tenantInfo && tenantInfo.has_tenant) {
          setTenantWarning({
            floorNumber: currentFloor,
            cellIndex,
            tenantInfo
          });
          return;
        }
      } catch (error) {
        console.error('Error validating unit deletion:', error);
      }
    }
    
    toggleUnit(cellIndex);
  }, [previewMode, selectedUnits, existingProperty, validateUnitDeletion, currentFloor, toggleUnit]);

  const handleVacateTenant = useCallback(async () => {
    if (tenantWarning && tenantWarning.tenantInfo.tenant_id) {
      try {
        await TenantService.vacateTenant(tenantWarning.tenantInfo.tenant_id, {
          vacate_date: new Date().toISOString().split('T')[0],
          vacate_reason: 'Unit layout modification'
        });
        
        toggleUnit(tenantWarning.cellIndex);
        setTenantWarning(null);
      } catch (error) {
        console.error('Error vacating tenant:', error);
        setErrors(prev => ({
          ...prev,
          tenant: 'Failed to vacate tenant. Please try again.'
        }));
      }
    }
  }, [tenantWarning, toggleUnit]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const x = (i % GRID_SIZE) * CELL_SIZE;
      const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;
      const isSelected = selectedUnits.includes(i);
      
      cells.push(
        <motion.div
          key={i}
          whileHover={!previewMode ? { scale: 1.05 } : {}}
          whileTap={!previewMode ? { scale: 0.95 } : {}}
          onClick={() => handleUnitToggle(i)}
          className={`
            absolute w-10 h-10 border-2 rounded cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-blue-500 border-blue-600 shadow-lg transform scale-105' 
              : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }
            ${previewMode ? 'cursor-default' : 'hover:shadow-md'}
            ${isLoadingFloor ? 'opacity-50 pointer-events-none' : ''}
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
        </motion.div>
      );
    }
    return cells;
  }, [selectedUnits, previewMode, handleUnitToggle, isLoadingFloor]);

  const totals = useMemo(() => {
    const allFloorsData = getAllFloorsData();
    const totalUnits = Object.values(allFloorsData).reduce((total, floor) => {
      return total + (floor?.units_total || 0);
    }, 0);
    
    const configuredFloorsCount = Object.keys(allFloorsData).filter(
      floorNum => allFloorsData[floorNum]?.units_total > 0
    ).length;
    
    return {
      totalUnits,
      configuredFloorsCount,
      completionRate: floors.length > 0 ? Math.round((configuredFloorsCount / floors.length) * 100) : 0
    };
  }, [floorMemory, floors.length, getAllFloorsData]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFloorPlanValid);
    }
  }, [isFloorPlanValid, onValidationChange]);

  useEffect(() => {
    if (existingProperty && floors.length > 0) {
      loadFloorData(1);
    }
  }, [existingProperty, floors.length, loadFloorData]);

  const handleSaveCurrentFloor = useCallback(async () => {
    if (!selectedUnits || selectedUnits.length === 0) {
      setErrors(prev => ({ ...prev, currentFloor: 'Please select at least one unit' }));
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
        layout_type: 'manual_grid',
        creation_method: 'manual',
        grid_configuration: {
          grid_size: GRID_SIZE,
          cell_size: CELL_SIZE,
          selected_cells: selectedUnits,
          layout_type: 'manual_grid'
        }
      };

      await saveFloorPlan(currentFloor, floorPlanData);
      
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
                <div className="text-2xl font-bold text-blue-600">{totals.configuredFloorsCount}</div>
                <div className="text-sm text-blue-700">of {floors.length} floors configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.totalUnits}</div>
                <div className="text-sm text-green-700">total units designed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totals.completionRate}%</div>
                <div className="text-sm text-purple-700">completion rate</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totals.completionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.floors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.floors}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Floors ({floors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {floors.map((floorNum) => {
                const floorData = floorMemory[floorNum];
                const isConfigured = floorData && floorData.units_total > 0;
                const isActive = currentFloor === floorNum;
                
                return (
                  <motion.button
                    key={floorNum}
                    onClick={() => handleFloorChange(floorNum)}
                    disabled={isLoadingFloor}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isConfigured
                        ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } ${isLoadingFloor ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={!isLoadingFloor ? { scale: 1.02 } : {}}
                    whileTap={!isLoadingFloor ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Floor {floorNum}</div>
                        <div className="text-xs">
                          {isConfigured 
                            ? `${floorData.units_total} units` 
                            : 'Not configured'
                          }
                        </div>
                      </div>
                      {isConfigured && <Check className="w-4 h-4" />}
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Floor {currentFloor} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Selected Units:</span>
                <span className="font-medium">{selectedUnits.length}</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setPreviewMode(!previewMode)}
                  variant={previewMode ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
                
                <Button 
                  onClick={handleSaveCurrentFloor}
                  disabled={selectedUnits.length === 0}
                  size="sm"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>

              {errors.currentFloor && (
                <p className="text-red-500 text-sm">{errors.currentFloor}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Floor {currentFloor} Layout Designer
                  {isLoadingFloor && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <Badge variant="outline">
                  {GRID_SIZE}x{GRID_SIZE} Grid
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Click on grid cells to select units. 
                    {propertyData.category === 'Multi-Floor' && ' Each floor maintains its own layout memory.'}
                    {!previewMode ? ' Click cells to add/remove units.' : ' Preview mode - editing disabled.'}
                  </p>
                </div>

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
              {floors.map((floorNum) => {
                const floorData = floorMemory[floorNum];
                const isConfigured = floorData && floorData.units_total > 0;
                
                return (
                  <div
                    key={floorNum}
                    className={`p-4 rounded-lg border-2 ${
                      isConfigured 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Floor {floorNum}</h4>
                      {isConfigured && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isConfigured 
                        ? `${floorData.units_total} units configured`
                        : 'Not configured'
                      }
                    </p>
                    {isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handleFloorChange(floorNum)}
                      >
                        View Layout
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!tenantWarning} onOpenChange={() => setTenantWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Tenant Occupancy Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{tenantWarning?.tenantInfo?.message}</p>
              {tenantWarning?.tenantInfo && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      {tenantWarning.tenantInfo.tenant_name}
                    </span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Unit: {tenantWarning.tenantInfo.unit_name}
                  </p>
                </div>
              )}
              <p className="text-sm font-medium">
                Do you want to vacate the tenant and remove this unit?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVacateTenant}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Vacate Tenant & Remove Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}