// components/landlord/properties/PropertySummary.jsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Home, 
  Users, 
  DollarSign, 
  Edit, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import customToast from "@/components/ui/custom-toast";

export default function PropertySummary({ 
  onComplete, 
  propertyData, 
  floorData, 
  configuredUnits = [],
  saveProperty,
  isLoading 
}) {
  const [validationIssues, setValidationIssues] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // CRITICAL: Prevent multiple submissions with ref
  const submissionInProgress = useRef(false);

  // Merge configured units with generated units from floorData
  const units = useMemo(() => {
    if (!floorData || typeof floorData !== 'object') {
      return configuredUnits;
    }

    const generatedUnits = [];
    
    Object.entries(floorData).forEach(([floorNumber, floor]) => {
      if (floor && floor.units_ids && Array.isArray(floor.units_ids) && floor.units_ids.length > 0) {
        floor.units_ids.forEach((gridCellId, index) => {
          const unitId = `${floorNumber}-${gridCellId}`;
          
          // Check if this unit has been configured
          const configuredUnit = configuredUnits.find(unit => unit.id === unitId);
          
          const unitData = configuredUnit || {
            id: unitId,
            svg_id: gridCellId,
            floor_no: parseInt(floorNumber),
            unit_name: `Floor${floorNumber}-Unit${index + 1}`,
            area_sqm: 150,
            bedrooms: 1,
            status: 'vacant',
            rent_amount: 0,
            payment_freq: 'monthly',
            meter_number: '',
            utilities: {
              electricity: false,
              water: false,
              wifi: false
            },
            included_in_rent: false,
            cost_allocation: 'tenant',
            notes: '',
            floor_number: parseInt(floorNumber) - 1,
            svg_geom: `<rect width="40" height="40" x="0" y="0" id="unit-${gridCellId}" fill="green" stroke="gray" stroke-width="2" />`,
            block: propertyData.block || 'A'
          };
          
          generatedUnits.push(unitData);
        });
      }
    });
    
    return generatedUnits;
  }, [floorData, configuredUnits, propertyData.block]);

  const totalUnits = useMemo(() => {
    return Object.values(floorData || {}).reduce((total, floor) => {
      return total + (floor?.units_total || 0);
    }, 0);
  }, [floorData]);

  const validatePropertyData = useCallback(() => {
    const issues = [];

    // Basic property validation
    if (!propertyData.name?.trim()) {
      issues.push("Property name is required");
    }
    if (!propertyData.location?.trim()) {
      issues.push("Property location is required");
    }
    if (!propertyData.address?.trim()) {
      issues.push("Property address is required");
    }

    // Floor plan validation
    if (Object.keys(floorData || {}).length === 0) {
      issues.push("At least one floor plan is required");
    }

    // Units validation
    const configuredUnits = units.filter(unit => unit.rent_amount > 0);
    if (configuredUnits.length === 0) {
      issues.push("At least one unit must have rent amount configured");
    }

    setValidationIssues(issues);
  }, [propertyData, floorData, units]);

  useEffect(() => {
    validatePropertyData();
  }, [validatePropertyData]);

  // FIXED: Completely prevent duplicate submissions
  const handleCreateProperty = useCallback(async () => {
    // CRITICAL: Check if submission is already in progress
    if (submissionInProgress.current || isCreating || isLoading) {
      console.log('Submission already in progress, blocking duplicate');
      return;
    }

    if (validationIssues.length > 0) {
      customToast.error("Validation Error", {
        description: "Please fix the issues before creating the property."
      });
      return;
    }

    // CRITICAL: Set submission flag immediately
    submissionInProgress.current = true;
    setIsCreating(true);

    try {
      console.log("Starting property creation...");
      
      const result = await saveProperty();
      console.log("Property created successfully:", result);
      
      customToast.success("Property Created Successfully!", {
        description: "Your property is now ready for tenant management."
      });
      
      // Call onComplete only once
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error("Property creation failed:", error);
      customToast.error("Creation Failed", {
        description: error.message || "Failed to create property. Please try again."
      });
    } finally {
      // CRITICAL: Reset flags in finally block
      setIsCreating(false);
      submissionInProgress.current = false;
    }
  }, [isCreating, isLoading, validationIssues, saveProperty, onComplete]);

  const getTotalMonthlyRent = useCallback(() => {
    return units.reduce((total, unit) => total + (unit.rent_amount || 0), 0);
  }, [units]);

  const getConfiguredUnitsCount = useCallback(() => {
    return units.filter(unit => unit.rent_amount > 0).length;
  }, [units]);

  const getUnitsByFloor = useCallback(() => {
    return units.reduce((acc, unit) => {
      if (!acc[unit.floor_no]) acc[unit.floor_no] = [];
      acc[unit.floor_no].push(unit);
      return acc;
    }, {});
  }, [units]);

  const totalMonthlyRent = getTotalMonthlyRent();
  const configuredUnitsCount = getConfiguredUnitsCount();
  const unitsByFloor = getUnitsByFloor();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Review & Create Property</h2>
        <p className="text-muted-foreground">
          Review all your property details before creating
        </p>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Issues to Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={index} className="text-red-700 text-sm">
                  • {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Property Overview */}
        <div className="space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {propertyData.prop_image && (
                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={propertyData.prop_image.uri || propertyData.prop_image}
                    alt="Property"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Image not available</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground">{propertyData.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{propertyData.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {propertyData.address}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{propertyData.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Floors:</span>
                    <p className="font-medium">{propertyData.total_floors}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    TSh {totalMonthlyRent.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">Monthly Rent Potential</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    TSh {(totalMonthlyRent * 12).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">Annual Rent Potential</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Floor & Unit Details */}
        <div className="space-y-6">
          {/* Units Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Units Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{totalUnits}</p>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{configuredUnitsCount}</p>
                  <p className="text-sm text-muted-foreground">Configured</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{totalUnits - configuredUnitsCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>

              {/* Floor Breakdown */}
              <div className="space-y-3">
                {Object.entries(floorData || {}).map(([floorNumber, floor]) => (
                  <div key={floorNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">Floor {floorNumber}</span>
                      <p className="text-sm text-muted-foreground">
                        {floor.units_total} units
                      </p>
                    </div>
                    <Badge variant="outline">
                      {units.filter(u => u.floor_no === parseInt(floorNumber) && u.rent_amount > 0).length} / {floor.units_total} configured
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unit Details by Floor */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Details</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(unitsByFloor).map(([floorNumber, floorUnits]) => (
                  <div key={floorNumber}>
                    <h5 className="font-medium mb-2">Floor {floorNumber}</h5>
                    <div className="space-y-2">
                      {floorUnits.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium text-sm">{unit.unit_name}</span>
                            <p className="text-xs text-muted-foreground">
                              {unit.bedrooms} bed • {unit.area_sqm} sqm
                            </p>
                          </div>
                          <div className="text-right">
                            {unit.rent_amount > 0 ? (
                              <>
                                <p className="font-medium text-sm">TSh {unit.rent_amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{unit.payment_freq}</p>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs">Not configured</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationIssues.length === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Ready to create property</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">
                    {validationIssues.length} issue{validationIssues.length > 1 ? 's' : ''} to fix
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isCreating || isLoading}
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleCreateProperty}
                disabled={validationIssues.length > 0 || isCreating || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {(isCreating || isLoading) ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Creating Property...
                  </>
                ) : (
                  "Create Property"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your property will be created and saved to your account</li>
            <li>• You can start adding tenants to individual units</li>
            <li>• Set up payment collection and rent tracking</li>
            <li>• Access your property management dashboard</li>
            <li>• You can always edit property details later</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}