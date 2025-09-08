// components/landlord/properties/tabs/PropertyFloorsTab.jsx
"use client";

import { useState } from "react";
import { 
  Grid, 
  Edit, 
  Eye, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import FloorLayoutEditor from "@/components/landlord/properties/FloorLayoutEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PropertyFloorsTab({ 
  property, 
  floorData, 
  onEditFloor,
  onSaveFloorLayout,
  refreshProperty
}) {
  const [editingFloor, setEditingFloor] = useState(null);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);

  const handleEditFloor = (floorNumber) => {
    setEditingFloor(floorNumber);
    setShowLayoutEditor(true);
  };

  const handleSaveLayout = async (layoutData) => {
    try {
      console.log('Saving layout data:', layoutData);
      
      await onSaveFloorLayout?.(editingFloor, layoutData);
      
      setShowLayoutEditor(false);
      setEditingFloor(null);
      refreshProperty?.();
    } catch (error) {
      console.error('Error saving floor layout:', error);
      throw error;
    }
  };

  const prepareExistingLayout = (floor) => {
    if (!floor) return null;

    console.log('Preparing existing layout for floor:', floor);

    const existingLayout = {
      id: floor.id,
      floor_number: floor.floor_number,
      configured: floor.configured || false,
      layout_type: floor.layout_type || 'rectangular',
      creation_method: floor.creation_method || 'manual',
      layout_data: floor.layout_data || '',
      units_total: floor.units_total || 0,
      notes: floor.notes || '',
      
      units: floor.units || [],
      grid_configuration: floor.grid_configuration || null,
      units_ids: floor.units_ids || null,
      layout_preview: floor.layout_preview || null
    };

    console.log('Prepared existing layout:', existingLayout);
    return existingLayout;
  };

  const getFloorStatusInfo = (floor) => {
    if (!floor.configured) {
      return {
        status: 'not_configured',
        badge: <Badge variant="secondary">Not Configured</Badge>,
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
      };
    }
    
    if (floor.units_total === 0) {
      return {
        status: 'no_units',
        badge: <Badge variant="secondary">No Units</Badge>,
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
      };
    }
    
    return {
      status: 'configured',
      badge: <Badge variant="default">Configured</Badge>,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Floor Plans</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(floorData).map((floor) => {
          const statusInfo = getFloorStatusInfo(floor);
          
          return (
            <CloudflareCard key={floor.floor_number}>
              <CloudflareCardHeader 
                title={`Floor ${floor.floor_number}`}
                actions={
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFloor(floor.floor_number)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {floor.layout_data && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                }
              />
              <CloudflareCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusInfo.icon}
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    {statusInfo.badge}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Units:</span>
                      <span className="font-medium">{floor.units_total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occupied:</span>
                      <span className="font-medium">{floor.occupied_units || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vacant:</span>
                      <span className="font-medium">{floor.vacant_units || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occupancy Rate:</span>
                      <span className="font-medium">{floor.occupancy_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-medium">TSh {(floor.total_rent || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Layout Type:</span>
                      <span className="font-medium capitalize">{floor.layout_type || 'Manual Grid'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Creation Method:</span>
                      <span className="font-medium capitalize">{floor.creation_method || 'Manual'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Modified:</span>
                      <span className="font-medium">
                        {floor.updated_at 
                          ? new Date(floor.updated_at).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-32 flex items-center justify-center">
                      {floor.layout_data ? (
                        <div className="text-center">
                          <Grid className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-500">Layout Configured</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {floor.units_total} units
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Grid className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <span className="text-sm text-gray-400">No Layout</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEditFloor(floor.floor_number)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {floor.configured ? 'Edit Layout' : 'Configure Layout'}
                    </Button>
                  </div>
                </div>
              </CloudflareCardContent>
            </CloudflareCard>
          );
        })}
      </div>

      <Dialog open={showLayoutEditor} onOpenChange={setShowLayoutEditor}>
         <DialogContent className="w-full max-w-screen-lg max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              Edit Floor {editingFloor} Layout
            </DialogTitle>
          </DialogHeader>
          
          {editingFloor && (
            <FloorLayoutEditor
              propertyId={property.id}
              floorNumber={editingFloor}
              existingLayout={prepareExistingLayout(floorData[editingFloor])}
              onSave={handleSaveLayout}
              onCancel={() => {
                setShowLayoutEditor(false);
                setEditingFloor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}