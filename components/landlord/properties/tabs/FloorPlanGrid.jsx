// components/landlord/properties/FloorPlanGrid.jsx
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Home, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * FloorPlanGrid Component
 * 
 * Interactive grid for selecting and configuring floor plan units
 * Follows Cloudflare design system with responsive layout
 */
export default function FloorPlanGrid({
  selectedUnits = [],
  onCellClick,
  existingUnits = [],
  gridSize = 8,
  cellSize = 40,
  readonly = false,
  showLabels = true,
  className = ""
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Create grid cells array
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      
      // Find existing unit data for this cell
      const existingUnit = existingUnits.find(unit => unit.svg_id === i);
      
      cells.push({
        index: i,
        x,
        y,
        isSelected: selectedUnits.includes(i),
        existingUnit,
        hasExistingData: !!existingUnit,
        isOccupied: existingUnit?.current_tenant ? true : false,
        unitName: existingUnit?.unit_name || `Unit ${selectedUnits.indexOf(i) + 1}`,
        rentAmount: existingUnit?.rent_amount || 0
      });
    }
    return cells;
  }, [gridSize, selectedUnits, existingUnits]);

  const handleCellClick = (cellIndex) => {
    if (readonly) return;
    onCellClick?.(cellIndex);
  };

  const getCellStatus = (cell) => {
    if (cell.isOccupied) return 'occupied';
    if (cell.hasExistingData) return 'configured';
    if (cell.isSelected) return 'selected';
    return 'available';
  };

  const getCellStyles = (cell) => {
    const status = getCellStatus(cell);
    const baseStyles = "border-2 cursor-pointer transition-all duration-200 rounded-lg flex items-center justify-center relative";
    
    const statusStyles = {
      occupied: "bg-red-100 border-red-300 hover:bg-red-200 text-red-800",
      configured: "bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800",
      selected: "bg-green-100 border-green-300 hover:bg-green-200 text-green-800",
      available: "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600"
    };

    return `${baseStyles} ${statusStyles[status]} ${readonly ? 'cursor-default' : ''}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      occupied: <Badge variant="destructive" className="text-xs">Occupied</Badge>,
      configured: <Badge variant="default" className="text-xs">Configured</Badge>,
      selected: <Badge variant="secondary" className="text-xs">Selected</Badge>,
      available: null
    };
    return badges[status];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span>Configured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div 
        className="relative mx-auto border-2 border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900"
        style={{
          width: `${gridSize * (cellSize + 4) + 32}px`,
          height: `${gridSize * (cellSize + 4) + 32}px`
        }}
      >
        {/* Grid Background */}
        <div 
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`
          }}
        >
          <TooltipProvider>
            {gridCells.map((cell) => (
              <Tooltip key={cell.index}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={getCellStyles(cell)}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`
                    }}
                    onClick={() => handleCellClick(cell.index)}
                    onMouseEnter={() => setHoveredCell(cell.index)}
                    onMouseLeave={() => setHoveredCell(null)}
                    whileHover={{ scale: readonly ? 1 : 1.05 }}
                    whileTap={{ scale: readonly ? 1 : 0.95 }}
                  >
                    {/* Cell Content */}
                    <div className="flex flex-col items-center justify-center text-xs">
                      {cell.isOccupied && <Users className="h-3 w-3" />}
                      {cell.hasExistingData && !cell.isOccupied && <Home className="h-3 w-3" />}
                      {cell.isSelected && !cell.hasExistingData && <div className="w-2 h-2 bg-current rounded-full" />}
                      
                      {showLabels && cell.hasExistingData && (
                        <span className="font-medium text-xs mt-1">
                          {cell.existingUnit.unit_name?.split(' ')[1] || cell.index + 1}
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    {hoveredCell === cell.index && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-10 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {cell.hasExistingData ? cell.existingUnit.unit_name : `Cell ${cell.index + 1}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      Position: ({cell.x + 1}, {cell.y + 1})
                    </div>
                    {cell.hasExistingData && (
                      <>
                        <div className="text-sm">
                          Area: {cell.existingUnit.area_sqm} sqm
                        </div>
                        <div className="text-sm">
                          Rent: TSh {cell.existingUnit.rent_amount?.toLocaleString() || 0}
                        </div>
                        {cell.isOccupied && (
                          <div className="text-sm text-red-600">
                            Tenant: {cell.existingUnit.current_tenant?.full_name}
                          </div>
                        )}
                      </>
                    )}
                    {getStatusBadge(getCellStatus(cell))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Grid Coordinates */}
        <div className="absolute -top-6 left-4 flex">
          {Array.from({ length: gridSize }, (_, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 flex items-center justify-center"
              style={{ width: `${cellSize + 4}px` }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="absolute -left-6 top-4 flex flex-col">
          {Array.from({ length: gridSize }, (_, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 flex items-center justify-center"
              style={{ height: `${cellSize + 4}px` }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium">Total Cells</div>
          <div className="text-lg">{gridSize * gridSize}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="font-medium">Selected</div>
          <div className="text-lg">{selectedUnits.length}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="font-medium">Configured</div>
          <div className="text-lg">{existingUnits.length}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="font-medium">Occupied</div>
          <div className="text-lg">{existingUnits.filter(unit => unit.current_tenant).length}</div>
        </div>
      </div>

      {/* Warnings */}
      {existingUnits.some(unit => unit.current_tenant) && !readonly && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Warning: Occupied Units
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Some units are currently occupied by tenants. Removing these units from the layout 
                will require vacating the tenants first.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}