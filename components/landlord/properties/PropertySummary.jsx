// components/landlord/properties/PropertySummary.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Home, 
  Users, 
  DollarSign, 
  Eye, 
  Download,
  CheckCircle,
  AlertCircle,
  Grid3X3,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareCard, CloudflareCardHeader, CloudflareCardContent } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PropertySummary({ 
  propertyData, 
  floorData, 
  configuredUnits,
  saveProperty,
  isLoading,
  onComplete,
  onValidationChange
}) {
  const [selectedFloorPreview, setSelectedFloorPreview] = useState(null);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [validationResults, setValidationResults] = useState({});

  // Calculate comprehensive summary data
  const summaryData = useMemo(() => {
    const floors = Object.keys(floorData || {});
    const totalUnits = floors.reduce((sum, floorNum) => {
      return sum + (floorData[floorNum]?.units_total || 0);
    }, 0);

    const configuredUnitsArray = configuredUnits || [];
    const totalRent = configuredUnitsArray.reduce((sum, unit) => {
      return sum + (parseFloat(unit.rent_amount) || 0);
    }, 0);

    const configuredFloorsCount = floors.length;
    const unitsWithRent = configuredUnitsArray.filter(unit => unit.rent_amount > 0).length;

    return {
      totalFloors: propertyData?.total_floors || 0,
      configuredFloors: configuredFloorsCount,
      totalUnits,
      configuredUnits: configuredUnitsArray.length,
      unitsWithRent,
      totalMonthlyRent: totalRent,
      averageRentPerUnit: totalUnits > 0 ? totalRent / totalUnits : 0,
      completionPercentage: propertyData?.total_floors > 0 
        ? (configuredFloorsCount / propertyData.total_floors) * 100 
        : 0
    };
  }, [propertyData, floorData, configuredUnits]);

  // Simplified validation - only check basic requirements
  const validateProperty = () => {
    const errors = [];
    
    // Basic validation
    if (!propertyData?.name?.trim()) {
      errors.push('Property name is required');
    }
    
    if (!propertyData?.location?.trim()) {
      errors.push('Property location is required');
    }
    
    if (!propertyData?.address?.trim()) {
      errors.push('Property address is required');
    }
    
    // Floor validation
    if (summaryData.configuredFloors === 0) {
      errors.push('At least one floor must be configured');
    }
    
    // Units validation - just check if units exist, not if they're configured
    if (summaryData.totalUnits === 0) {
      errors.push('Property must have at least one unit');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleViewFloorLayout = (floorNumber) => {
    const floor = floorData[floorNumber];
    if (floor && floor.layout_preview) {
      setSelectedFloorPreview({
        floorNumber,
        ...floor.layout_preview
      });
      setShowLayoutDialog(true);
    }
  };

  const handleDownloadAllLayouts = () => {
    Object.entries(floorData).forEach(([floorNum, floor]) => {
      if (floor.layout_data) {
        const blob = new Blob([floor.layout_data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${propertyData.name}-floor-${floorNum}-layout.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  // Use onComplete directly in the button click
  const handleCreateProperty = () => {
    if (onComplete) {
      onComplete(); // This will trigger the save in the parent component
    }
  };

  // Validate on mount and when data changes
  useEffect(() => {
    const validation = validateProperty();
    setValidationResults(validation);
    
    if (onValidationChange) {
      onValidationChange(validation.valid);
    }
  }, [propertyData, floorData, configuredUnits, onValidationChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Summary</h2>
        <p className="text-muted-foreground">
          Review your property configuration before creating
        </p>
      </div>

      {/* Validation Messages */}
      {validationResults.errors && validationResults.errors.length > 0 && (
        <CloudflareCard className="border-red-200 bg-red-50">
          <CloudflareCardHeader 
            title="Issues Found" 
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          />
          <CloudflareCardContent>
            <ul className="space-y-1 text-sm text-red-700">
              {validationResults.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Floors</p>
                <p className="text-2xl font-bold text-blue-600">{summaryData.configuredFloors}</p>
                <p className="text-xs text-gray-500">of {summaryData.totalFloors} floors</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Units</p>
                <p className="text-2xl font-bold text-green-600">{summaryData.totalUnits}</p>
                <p className="text-xs text-gray-500">total units</p>
              </div>
              <Home className="w-8 h-8 text-green-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Configured</p>
                <p className="text-2xl font-bold text-purple-600">{summaryData.unitsWithRent}</p>
                <p className="text-xs text-gray-500">units with rent</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>

        <CloudflareCard>
          <CloudflareCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                <p className="text-lg font-bold text-orange-600">
                  TZS {summaryData.totalMonthlyRent.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">total monthly</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="floors">Floor Plans</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <CloudflareCard>
            <CloudflareCardHeader 
              title="Property Details"
              icon={<Building2 className="w-5 h-5" />}
            />
            <CloudflareCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold">{propertyData?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{propertyData?.location || 'Not set'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-semibold">{propertyData?.address || 'Not set'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <Badge variant="outline">{propertyData?.category || 'Not set'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Area</p>
                    <p className="font-semibold">{propertyData?.total_area || 0} sq m</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Property Image</p>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {propertyData?.prop_image ? 'Uploaded' : 'Not uploaded'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </TabsContent>

        <TabsContent value="floors" className="space-y-4">
          <CloudflareCard>
            <CloudflareCardHeader 
              title="Floor Plans"
              icon={<Layers className="w-5 h-5" />}
              action={
                summaryData.configuredFloors > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllLayouts}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                )
              }
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                {Object.entries(floorData || {}).map(([floorNum, floor]) => (
                  <div key={floorNum} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{floorNum}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Floor {floorNum}</h4>
                        <p className="text-sm text-gray-600">
                          {floor.units_total} units • {floor.layout_type || 'Manual'} layout
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFloorLayout(floorNum)}
                        disabled={!floor.layout_preview}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Layout
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <CloudflareCard>
            <CloudflareCardHeader 
              title="Unit Configuration"
              icon={<Home className="w-5 h-5" />}
            />
            <CloudflareCardContent>
              <div className="space-y-4">
                {summaryData.configuredUnits > 0 ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {(configuredUnits || []).map((unit, index) => (
                        <div key={unit.id || index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">{unit.unit_name}</h4>
                            <Badge variant={unit.status === 'vacant' ? 'secondary' : 'default'}>
                              {unit.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Floor {unit.floor_no} • {unit.bedrooms || unit.rooms || 1} bed • {unit.area_sqm} sq m
                          </p>
                          {unit.rent_amount > 0 ? (
                            <p className="text-sm font-medium text-green-600">
                              TZS {unit.rent_amount?.toLocaleString()} / {unit.payment_freq}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Rent not set</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {summaryData.unitsWithRent < summaryData.configuredUnits && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          <strong>Note:</strong> {summaryData.configuredUnits - summaryData.unitsWithRent} units don't have rent amounts set. 
                          You can configure them later from the property management page.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No units configured yet</p>
                    <p className="text-sm">Units will be created from your floor plans</p>
                  </div>
                )}
              </div>
            </CloudflareCardContent>
          </CloudflareCard>
        </TabsContent>
      </Tabs>

      {/* Create Property Button */}
      <div className="flex justify-center pt-6">
        <CloudflareCard className="w-full max-w-md">
          <CloudflareCardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Create Property?</h3>
            <p className="text-gray-600 mb-4">
              {validationResults.valid 
                ? "Your property configuration is complete and ready to be created. Units can be configured with rent amounts later."
                : "Please resolve the validation issues before creating the property."
              }
            </p>
            <Button
              onClick={handleCreateProperty}
              disabled={!validationResults.valid || isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Creating Property...
                </>
              ) : (
                'Create Property'
              )}
            </Button>
          </CloudflareCardContent>
        </CloudflareCard>
      </div>

      {/* Layout Preview Dialog */}
      <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Floor {selectedFloorPreview?.floorNumber} Layout
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedFloorPreview?.svg && (
              <div 
                className="border rounded-lg p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: selectedFloorPreview.svg }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}