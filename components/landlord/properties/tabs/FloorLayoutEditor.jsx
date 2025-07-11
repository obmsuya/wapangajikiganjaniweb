// components/landlord/properties/FloorLayoutEditor.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Save, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertCircle,
  Check,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFloorPlan } from "@/hooks/properties/useProperties";
import PropertyService from "@/services/landlord/property";
import FloorPlanGrid from "./FloorPlanGrid";
import customToast from "@/components/ui/custom-toast";

export default function FloorLayoutEditor({ 
  propertyId, 
  floorNumber, 
  existingLayout,
  onSave,
  onCancel 
}) {
  const {
    selectedUnits,
    toggleUnit,
    clearSelection,
    generateLayoutPreview,
    validateUnitDeletion,
    saveFloorPlan
  } = useFloorPlan(
    () => {}, // updateFloorData callback
    existingLayout ? { [floorNumber]: existingLayout } : {},
    { id: propertyId } // existingProperty
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected units from existing layout
  useEffect(() => {
    if (existingLayout?.units) {
      const existingUnitIds = existingLayout.units.map(unit => unit.svg_id);
      // Set initial selected units based on existing layout
      existingUnitIds.forEach(unitId => {
        if (!selectedUnits.includes(unitId)) {
          toggleUnit(unitId);
        }
      });
    }
  }, [existingLayout]);

  const handleCellClick = useCallback(async (cellIndex) => {
    if (previewMode) return;
    
    // Check if unit has tenant before allowing deletion
    if (selectedUnits.includes(cellIndex) && existingLayout?.units) {
      const existingUnit = existingLayout.units.find(unit => unit.svg_id === cellIndex);
      if (existingUnit?.current_tenant) {
        try {
          const validation = await validateUnitDeletion(floorNumber, cellIndex);
          if (validation && validation.has_tenant) {
            customToast.error("Cannot Remove Unit", {
              description: `${validation.message}. Please vacate the tenant first.`
            });
            return;
          }
        } catch (error) {
          console.error('Error validating unit deletion:', error);
          customToast.error("Validation Error", {
            description: "Unable to validate unit deletion. Please try again."
          });
          return;
        }
      }
    }
    
    toggleUnit(cellIndex);
    setHasChanges(true);
  }, [selectedUnits, existingLayout, floorNumber, previewMode, toggleUnit, validateUnitDeletion]);

  const handlePreview = useCallback(() => {
    if (selectedUnits.length === 0) {
      customToast.error("No Units Selected", {
        description: "Please select at least one unit to preview the layout."
      });
      return;
    }

    try {
      const preview = generateLayoutPreview(selectedUnits, floorNumber);
      if (preview) {
        setPreviewMode(true);
        customToast.success("Preview Generated", {
          description: `Floor ${floorNumber} layout preview ready`
        });
      }
    } catch (error) {
      customToast.error("Preview Failed", {
        description: "Unable to generate layout preview"
      });
    }
  }, [selectedUnits, floorNumber, generateLayoutPreview]);

  const handleSave = useCallback(async () => {
    if (selectedUnits.length === 0) {
      customToast.error("No Units Selected", {
        description: "Please select at least one unit before saving."
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the hook's save function
      await saveFloorPlan(propertyId, floorNumber, selectedUnits);
      
      // Prepare layout data for parent component
      const layoutData = {
        floor_no: floorNumber - 1,
        units_total: selectedUnits.length,
        layout_type: 'manual_grid',
        creation_method: 'manual',
        layout_data: generateLayoutPreview(selectedUnits, floorNumber)?.svg || '',
        units: selectedUnits.map((cellIndex, arrayIndex) => {
          const x = cellIndex % 8;
          const y = Math.floor(cellIndex / 8);
          return {
            svg_id: cellIndex,
            unit_name: `F${floorNumber}U${arrayIndex + 1}`,
            area_sqm: 150,
            rooms: 1,
            rent_amount: 0,
            floor_number: floorNumber - 1,
            status: 'available',
            svg_geom: `M${x * 40},${y * 40} L${(x + 1) * 40},${y * 40} L${(x + 1) * 40},${(y + 1) * 40} L${x * 40},${(y + 1) * 40} Z`
          };
        })
      };

      onSave?.(layoutData);
      setHasChanges(false);
      
      customToast.success("Layout Saved", {
        description: `Floor ${floorNumber} layout has been saved successfully`
      });
    } catch (error) {
      console.error('Error saving floor layout:', error);
      setError(error.message || 'Failed to save floor layout');
      customToast.error("Save Failed", {
        description: error.message || "Failed to save floor layout"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedUnits, propertyId, floorNumber, saveFloorPlan, generateLayoutPreview, onSave]);

  const handleClearAll = useCallback(() => {
    clearSelection();
    setHasChanges(true);
  }, [clearSelection]);

  const handleSelectAll = useCallback(() => {
    // Select all 64 cells (8x8 grid)
    const allCells = Array.from({ length: 64 }, (_, i) => i);
    allCells.forEach(cellIndex => {
      if (!selectedUnits.includes(cellIndex)) {
        toggleUnit(cellIndex);
      }
    });
    setHasChanges(true);
  }, [selectedUnits, toggleUnit]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan Grid */}
        <div className="lg:col-span-2">
          <CloudflareCard>
            <CloudflareCardHeader 
              title={`Floor ${floorNumber} Layout Editor`}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedUnits.length === 0 || previewMode}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={previewMode}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={selectedUnits.length === 0}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {previewMode ? 'Previewing' : 'Preview'}
                  </Button>
                </div>
              }
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                {!previewMode && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Click on grid cells to select/deselect units</li>
                      <li>• Selected cells (green) will become units</li>
                      <li>• Red cells have tenants and cannot be removed</li>
                      <li>• Blue cells are already configured</li>
                      <li>• Click "Preview" to see the layout</li>
                    </ul>
                  </div>
                )}

                <FloorPlanGrid
                  selectedUnits={selectedUnits}
                  onCellClick={handleCellClick}
                  existingUnits={existingLayout?.units || []}
                  gridSize={8}
                  cellSize={40}
                  readonly={previewMode}
                />

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Selected Units: {selectedUnits.length}</span>
                  <span>Grid Size: 8x8 cells</span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Floor Stats */}
          <CloudflareCard>
            <CloudflareCardHeader title="Floor Statistics" />
            <CloudflareCardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Units:</span>
                  <span className="font-medium">{selectedUnits.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Existing Units:</span>
                  <span className="font-medium">
                    {existingLayout?.units?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Tenants:</span>
                  <span className="font-medium">
                    {existingLayout?.units?.filter(unit => unit.current_tenant)?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Changes Made:</span>
                  <span className="font-medium">
                    {hasChanges ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>

          {/* Actions */}
          <CloudflareCard>
            <CloudflareCardHeader title="Actions" />
            <CloudflareCardContent>
              <div className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || selectedUnits.length === 0 || !hasChanges}
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
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancel
                </Button>

                {previewMode && (
                  <Button
                    variant="outline"
                    onClick={() => setPreviewMode(false)}
                    className="w-full"
                  >
                    Exit Preview
                  </Button>
                )}
              </div>
            </CloudflareCardContent>
          </CloudflareCard>

          {/* Layout Info */}
          <CloudflareCard>
            <CloudflareCardHeader title="Layout Information" />
            <CloudflareCardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Layout Type:</span>
                  <span>Manual Grid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grid Size:</span>
                  <span>8x8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cell Size:</span>
                  <span>40px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Floor Number:</span>
                  <span>{floorNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Modified:</span>
                  <span>
                    {existingLayout?.updated_at 
                      ? new Date(existingLayout.updated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </div>
      </div>
    </div>
  );
}