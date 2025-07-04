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
        ? (configuredFloorsCount / propertyData.total_floors) * 100 
        : 0
    };
  }, [propertyData, floorData, configuredUnits]);

  // Validate property data
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
    
    if (summaryData.configuredFloors < summaryData.totalFloors) {
      errors.push(`${summaryData.totalFloors - summaryData.configuredFloors} floors are not configured`);
    }
    
    // Units validation
    if (summaryData.totalUnits === 0) {
      errors.push('Property must have at least one unit');
    }
    
    const unitsWithoutRent = (configuredUnits || []).filter(unit => !unit.rent_amount || unit.rent_amount <= 0);
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Summary</h2>
        <p className="text-muted-foreground">
          Review your property configuration before creating
        </p>
      </div>

      {/* Validation Messages */}
      {validationResults.errors && validationResults.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-red-700">
              {validationResults.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{summaryData.configuredUnits}</p>
                <p className="text-sm text-purple-700">units configured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  TZS {summaryData.totalMonthlyRent.toLocaleString()}
                </p>
                <p className="text-sm text-orange-700">monthly rent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="floors">Floor Plans</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{propertyData?.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline">{propertyData?.category || 'Not set'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {propertyData?.location || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{propertyData?.address || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="font-semibold">{propertyData?.total_area || 0} sq m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Image</p>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">
                      {propertyData?.prop_image ? 'Uploaded' : 'Not uploaded'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Floor Plans
                <Badge variant="outline">
                  {summaryData.configuredFloors}/{summaryData.totalFloors}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(floorData || {}).map(([floorNum, floor]) => (
                  <div key={floorNum} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{floorNum}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Floor {floorNum}</h4>
                        <p className="text-sm text-muted-foreground">
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
                
                {summaryData.configuredFloors > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleDownloadAllLayouts}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download All Layouts
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Unit Configuration
                <Badge variant="outline">
                  {summaryData.configuredUnits} units
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryData.configuredUnits > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(configuredUnits || []).map((unit, index) => (
                      <div key={unit.id || index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold">{unit.unit_name}</h4>
                          <Badge variant={unit.status === 'vacant' ? 'secondary' : 'default'}>
                            {unit.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Floor {unit.floor_no} • {unit.bedrooms} bed • {unit.area_sqm} sq m
                        </p>
                        <p className="text-sm font-medium">
                          TZS {unit.rent_amount?.toLocaleString() || 0} / {unit.payment_freq}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No units configured yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Property Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleCreateProperty}
          disabled={!validationResults.valid || isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? 'Creating Property...' : 'Create Property'}
        </Button>
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