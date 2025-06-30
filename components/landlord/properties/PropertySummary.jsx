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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        ? Math.round((configuredFloorsCount / propertyData.total_floors) * 100) 
        : 0
    };
  }, [propertyData, floorData, configuredUnits]);

  // Validate the complete property setup
  useEffect(() => {
    const results = {
      basicInfo: validateBasicInfo(),
      floors: validateFloors(),
      units: validateUnits(),
      overall: false
    };

    results.overall = results.basicInfo.valid && results.floors.valid && results.units.valid;
    setValidationResults(results);

    if (onValidationChange) {
      onValidationChange(results.overall);
    }
  }, [propertyData, floorData, configuredUnits, onValidationChange]);

  const validateBasicInfo = () => {
    const errors = [];
    if (!propertyData?.name) errors.push('Property name is required');
    if (!propertyData?.location) errors.push('Property location is required');
    if (!propertyData?.category) errors.push('Property category is required');
    if (!propertyData?.total_floors || propertyData.total_floors < 1) {
      errors.push('Total floors must be at least 1');
    }

    return { valid: errors.length === 0, errors };
  };

  const validateFloors = () => {
    const errors = [];
    const configuredFloors = Object.keys(floorData || {});
    
    if (configuredFloors.length === 0) {
      errors.push('At least one floor must be configured');
    }

    configuredFloors.forEach(floorNum => {
      const floor = floorData[floorNum];
      if (!floor.units_ids || floor.units_ids.length === 0) {
        errors.push(`Floor ${floorNum} has no units configured`);
      }
      if (!floor.layout_data) {
        errors.push(`Floor ${floorNum} is missing layout data`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const validateUnits = () => {
    const errors = [];
    const unitsArray = configuredUnits || [];
    
    if (unitsArray.length === 0) {
      errors.push('At least one unit must be configured');
    }

    const unitsWithoutRent = unitsArray.filter(unit => !unit.rent_amount || unit.rent_amount <= 0);
    if (unitsWithoutRent.length > 0) {
      errors.push(`${unitsWithoutRent.length} units have no rent amount set`);
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

  const handleCreateProperty = async () => {
    try {
      const result = await saveProperty();
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Failed to create property:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Summary</h2>
        <p className="text-muted-foreground">
          Review your property configuration before creating
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{summaryData.configuredFloors}</p>
                <p className="text-sm text-blue-700">of {summaryData.totalFloors} floors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Home className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{summaryData.totalUnits}</p>
                <p className="text-sm text-green-700">total units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  TSh {summaryData.totalMonthlyRent.toLocaleString()}
                </p>
                <p className="text-sm text-purple-700">monthly rent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{summaryData.completionPercentage}%</p>
                <p className="text-sm text-orange-700">completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="floors">Floor Plans</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="font-semibold">{propertyData?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="font-semibold">{propertyData?.category || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="font-semibold">{propertyData?.location || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Floors</label>
                    <p className="font-semibold">{propertyData?.total_floors || 0}</p>
                  </div>
                </div>
                {propertyData?.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="font-semibold">{propertyData.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Property Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertyData?.prop_image ? (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={typeof propertyData.prop_image === 'string' 
                        ? propertyData.prop_image 
                        : propertyData.prop_image.base64 || ''}
                      alt={propertyData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Image preview not available</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No image uploaded</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Floor Plans Tab */}
        <TabsContent value="floors" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Floor Layouts</h3>
            <Button onClick={handleDownloadAllLayouts} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download All Layouts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(floorData || {}).map(([floorNumber, floor]) => (
              <Card key={floorNumber} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Floor {floorNumber}</span>
                    <Badge variant="secondary">
                      {floor.units_total} units
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Layout Preview */}
                  {floor.layout_preview && floor.layout_preview.svg ? (
                    <div className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-2">
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: floor.layout_preview.svg }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Grid3X3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No layout preview</p>
                      </div>
                    </div>
                  )}

                  {/* Floor Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Units:</span>
                      <span className="font-medium ml-2">{floor.units_total}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium ml-2 capitalize">
                        {floor.layout_preview?.layout_type || 'Custom'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => handleViewFloorLayout(floorNumber)}
                    disabled={!floor.layout_preview}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Layout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Unit Configuration Summary</h3>
            
            {Object.entries(floorData || {}).map(([floorNumber, floor]) => {
              const floorUnits = (configuredUnits || []).filter(unit => unit.floor_no === parseInt(floorNumber));
              
              return (
                <Card key={floorNumber}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Floor {floorNumber}</span>
                      <Badge variant="outline">
                        {floorUnits.length} units configured
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {floorUnits.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floorUnits.map((unit, index) => (
                          <div key={unit.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{unit.unit_name}</h4>
                              <Badge variant={unit.rent_amount > 0 ? "default" : "secondary"}>
                                {unit.rent_amount > 0 ? "Configured" : "Pending"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Rent:</span>
                                <span className="font-medium">
                                  {unit.rent_amount > 0 
                                    ? `TSh ${parseFloat(unit.rent_amount).toLocaleString()}` 
                                    : 'Not set'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Area:</span>
                                <span className="font-medium">{unit.area_sqm || 150} sqm</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bedrooms:</span>
                                <span className="font-medium">{unit.bedrooms || 1}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No units configured for this floor
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuration Validation</h3>
            
            {/* Basic Info Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResults.basicInfo?.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResults.basicInfo?.valid ? (
                  <p className="text-green-600">✓ All basic information is complete</p>
                ) : (
                  <ul className="space-y-1">
                    {validationResults.basicInfo?.errors?.map((error, index) => (
                      <li key={index} className="text-red-600">• {error}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Floors Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResults.floors?.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Floor Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResults.floors?.valid ? (
                  <p className="text-green-600">✓ All floors are properly configured</p>
                ) : (
                  <ul className="space-y-1">
                    {validationResults.floors?.errors?.map((error, index) => (
                      <li key={index} className="text-red-600">• {error}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Units Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResults.units?.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Unit Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResults.units?.valid ? (
                  <p className="text-green-600">✓ All units are properly configured</p>
                ) : (
                  <ul className="space-y-1">
                    {validationResults.units?.errors?.map((error, index) => (
                      <li key={index} className="text-red-600">• {error}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Property Button */}
      <div className="flex items-center justify-center pt-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Create Property?</h3>
            <p className="text-gray-600 mb-4">
              {validationResults.overall 
                ? "Your property configuration is complete and ready to be created."
                : "Please resolve the validation issues before creating the property."
              }
            </p>
            <Button
              onClick={handleCreateProperty}
              disabled={!validationResults.overall || isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Layers className="w-4 h-4" />
                  </motion.div>
                  Creating Property...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Property
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Layout Preview Dialog */}
      <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Floor {selectedFloorPreview?.floorNumber} Layout Preview
            </DialogTitle>
          </DialogHeader>
          {selectedFloorPreview && (
            <div className="space-y-4">
              <div className="aspect-square bg-gray-50 rounded-lg border p-4">
                <div 
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: selectedFloorPreview.svg }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Units Count:</span>
                  <span className="font-medium ml-2">{selectedFloorPreview.units_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Layout Type:</span>
                  <span className="font-medium ml-2 capitalize">{selectedFloorPreview.layout_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Dimensions:</span>
                  <span className="font-medium ml-2">
                    {selectedFloorPreview.dimensions?.width} × {selectedFloorPreview.dimensions?.height}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Efficiency:</span>
                  <span className="font-medium ml-2">{selectedFloorPreview.metadata?.layout_efficiency}%</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}