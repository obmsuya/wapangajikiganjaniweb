'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PropertyFormData } from '../PropertyGeneratorWrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the PropertyBoundaryForm component
 */
interface PropertyBoundaryFormProps {
  formData: PropertyFormData;
  updateFormData: (values: Partial<PropertyFormData>) => void;
  onNext: (isValid: boolean) => void;
}

/**
 * Draw mode types for boundary input
 */
type DrawMode = 'polygon' | 'rectangle';

/**
 * Sample property boundary points for demonstration
 */
const SAMPLE_BOUNDARIES = {
  rectangle: [
    [[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]
  ],
  L_shaped: [
    [[0, 0], [0, 100], [60, 100], [60, 40], [100, 40], [100, 0], [0, 0]]
  ],
  U_shaped: [
    [[0, 0], [0, 100], [100, 100], [100, 60], [60, 60], [60, 40], [100, 40], [100, 0], [0, 0]]
  ]
};

/**
 * PropertyBoundaryForm - Third step in the property generation process
 * 
 * Allows defining the property boundary:
 * - Draw on canvas
 * - Enter coordinates manually
 * - Use predefined shapes
 */
export default function PropertyBoundaryForm({
  formData,
  updateFormData,
  onNext
}: PropertyBoundaryFormProps) {
  // Canvas refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const [points, setPoints] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>('polygon');
  const [startPoint, setStartPoint] = useState<number[]>([0, 0]);
  const [activeTab, setActiveTab] = useState<string>('draw');
  
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [boundaryText, setBoundaryText] = useState<string>('');

  // Initialize canvas when the component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setCanvasContext(ctx);
        
        // If there's an existing boundary, initialize points from it
        if (formData.boundary?.coordinates?.[0]) {
          const boundaryPoints = formData.boundary.coordinates[0].map(coord => 
            [coord[0] * canvas.width, coord[1] * canvas.height] as [number, number]
          );
          setPoints(boundaryPoints);
          drawExistingBoundary(ctx, boundaryPoints, canvas.width, canvas.height);
        }
      }
    }
  }, [formData.boundary]);

  /**
   * Draw existing boundary on canvas
   */
  const drawExistingBoundary = (
    ctx: CanvasRenderingContext2D, 
    boundaryPoints: number[][], 
    width: number, 
    height: number
  ) => {
    if (boundaryPoints.length < 3) return;
    
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(boundaryPoints[0][0], boundaryPoints[0][1]);
    
    for (let i = 1; i < boundaryPoints.length; i++) {
      ctx.lineTo(boundaryPoints[i][0], boundaryPoints[i][1]);
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points
    boundaryPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = index === 0 ? 'green' : 'blue';
      ctx.fill();
    });
  };

  /**
   * Handle mouse down event for drawing
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawMode === 'polygon') {
      // For polygon, add points on each click
      if (points.length === 0) {
        // First point - start new boundary
        setPoints([[x, y]]);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.beginPath();
        canvasContext.arc(x, y, 4, 0, Math.PI * 2);
        canvasContext.fillStyle = 'green';
        canvasContext.fill();
      } else {
        // Check if click is near the first point to close the polygon
        const firstPoint = points[0];
        const distance = Math.sqrt(Math.pow(x - firstPoint[0], 2) + Math.pow(y - firstPoint[1], 2));
        
        if (distance < 20 && points.length > 2) {
          // Close the polygon
          const closedPoints = [...points, [...points[0]]];
          setPoints(closedPoints);
          drawExistingBoundary(canvasContext, closedPoints, canvas.width, canvas.height);
          
          // Convert to normalized coordinates (0-1) and update form data
          updateBoundaryFromPoints(closedPoints, canvas.width, canvas.height);
        } else {
          // Add new point
          const newPoints = [...points, [x, y]];
          setPoints(newPoints);
          
          // Draw line to new point
          canvasContext.beginPath();
          canvasContext.moveTo(points[points.length - 1][0], points[points.length - 1][1]);
          canvasContext.lineTo(x, y);
          canvasContext.strokeStyle = 'rgba(59, 130, 246, 0.8)';
          canvasContext.lineWidth = 2;
          canvasContext.stroke();
          
          // Draw point
          canvasContext.beginPath();
          canvasContext.arc(x, y, 4, 0, Math.PI * 2);
          canvasContext.fillStyle = 'blue';
          canvasContext.fill();
        }
      }
    } else if (drawMode === 'rectangle') {
      // For rectangle, start drawing on mouse down
      setIsDrawing(true);
      setStartPoint([x, y]);
      setPoints([[x, y]]);
      
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      canvasContext.beginPath();
      canvasContext.arc(x, y, 4, 0, Math.PI * 2);
      canvasContext.fillStyle = 'green';
      canvasContext.fill();
    }
  };

  /**
   * Handle mouse move event for drawing
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext || !isDrawing || drawMode !== 'rectangle') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw rectangle preview
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw start point
    canvasContext.beginPath();
    canvasContext.arc(startPoint[0], startPoint[1], 4, 0, Math.PI * 2);
    canvasContext.fillStyle = 'green';
    canvasContext.fill();
    
    // Draw rectangle
    canvasContext.beginPath();
    canvasContext.rect(
      startPoint[0], 
      startPoint[1], 
      x - startPoint[0], 
      y - startPoint[1]
    );
    canvasContext.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    canvasContext.lineWidth = 2;
    canvasContext.stroke();
    canvasContext.fillStyle = 'rgba(59, 130, 246, 0.2)';
    canvasContext.fill();
  };

  /**
   * Handle mouse up event for drawing
   */
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext || !isDrawing || drawMode !== 'rectangle') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create rectangle points
    const rectanglePoints = [
      startPoint,
      [startPoint[0], y],
      [x, y],
      [x, startPoint[1]],
      [...startPoint] // Close the polygon
    ];
    
    setPoints(rectanglePoints);
    setIsDrawing(false);
    
    // Draw final rectangle
    drawExistingBoundary(canvasContext, rectanglePoints, canvas.width, canvas.height);
    
    // Convert to normalized coordinates (0-1) and update form data
    updateBoundaryFromPoints(rectanglePoints, canvas.width, canvas.height);
  };

  /**
   * Clear the current drawing
   */
  const handleClearDrawing = () => {
    if (!canvasContext) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setIsDrawing(false);
    
    // Clear boundary in form data
    updateFormData({
      boundary: undefined
    });
  };

  /**
   * Use a sample boundary
   */
  const handleUseSampleBoundary = (type: keyof typeof SAMPLE_BOUNDARIES) => {
    if (!canvasContext) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get sample points and scale to canvas size
    const samplePoints = SAMPLE_BOUNDARIES[type].map(coords => {
      return coords.map(c => [c[0] * 2, c[1] * 2]); // Scale points to fit canvas
    });
    
    // Draw the boundary
    setPoints(samplePoints[0]);
    drawExistingBoundary(canvasContext, samplePoints[0], canvas.width, canvas.height);
    
    // Convert to normalized coordinates (0-1) and update form data
    updateBoundaryFromPoints(samplePoints[0], canvas.width, canvas.height);
  };

  /**
   * Update the form data with normalized boundary points
   */
  const updateBoundaryFromPoints = (boundaryPoints: number[][], width: number, height: number) => {
    // Normalize coordinates to range 0-1
    const normalizedPoints = boundaryPoints.map(point => [
      point[0] / width,
      point[1] / height
    ] as [number, number]);
    
    // Update form data
    updateFormData({
      boundary: {
        type: 'Polygon',
        coordinates: [normalizedPoints]
      }
    });
    
    // Generate text representation for manual tab
    const pointsString = normalizedPoints
      .map(point => `[${point[0].toFixed(4)}, ${point[1].toFixed(4)}]`)
      .join(', ');
    setBoundaryText(`[[${pointsString}]]`);
  };

  /**
   * Parse boundary text and update form data
   */
  const handleBoundaryTextChange = (text: string) => {
    setBoundaryText(text);
    
    try {
      // Try to parse the text as a GeoJSON coordinate array
      const coordinates = JSON.parse(text);
      
      if (Array.isArray(coordinates) && coordinates.length > 0 && Array.isArray(coordinates[0])) {
        updateFormData({
          boundary: {
            type: 'Polygon',
            coordinates: [coordinates[0]]
          }
        });
        
        setErrors({});
      }
    } catch {
      // Don't set error while user is typing
      if (text.trim()) {
        setErrors({
          boundary: 'Invalid boundary format'
        });
      }
    }
  };

  /**
   * Validate form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Ensure boundary is defined
    if (!formData.boundary) {
      newErrors.boundary = 'Property boundary is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    onNext(isValid);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Define Property Boundary</h3>
          <p className="text-sm text-gray-500">
            Define the boundary of your property to generate accurate room layouts.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Draw Boundary</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-4 pt-4">
            {/* Drawing Controls */}
            <div className="flex space-x-4 items-center">
              <div>
                <Label htmlFor="draw-mode" className="text-sm font-medium mr-2">
                  Drawing Mode:
                </Label>
                <select
                  id="draw-mode"
                  className="border rounded-md text-sm px-2 py-1"
                  value={drawMode}
                  onChange={(e) => setDrawMode(e.target.value as DrawMode)}
                >
                  <option value="polygon">Free Draw</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearDrawing}
                className="text-sm"
              >
                Clear Drawing
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseSampleBoundary('rectangle')}
                  className="text-xs"
                >
                  Use Rectangle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseSampleBoundary('L_shaped')}
                  className="text-xs"
                >
                  Use L-Shape
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseSampleBoundary('U_shaped')}
                  className="text-xs"
                >
                  Use U-Shape
                </Button>
              </div>
            </div>
            
            {/* Drawing Canvas */}
            <div className="border rounded-md p-1">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full h-96 border border-dashed border-gray-300 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </div>
            
            <div className="flex items-start space-x-2 text-sm text-gray-600 mt-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                {drawMode === 'polygon' ? (
                  <p>
                    Click to add points. Click near the first point to close the shape.
                    The first point is green, subsequent points are blue.
                  </p>
                ) : (
                  <p>
                    Click and drag to draw a rectangle that represents the property boundary.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="boundary-text" className="text-sm font-medium">
                Boundary Coordinates (GeoJSON format)
              </Label>
              <Textarea
                id="boundary-text"
                placeholder='[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]'
                value={boundaryText}
                onChange={(e) => handleBoundaryTextChange(e.target.value)}
                className={cn(
                  "font-mono text-xs",
                  errors.boundary ? 'border-red-500' : ''
                )}
                rows={5}
              />
              {errors.boundary && (
                <p className="text-red-500 text-xs mt-1">{errors.boundary}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter coordinates as a GeoJSON polygon array: [[x1, y1], [x2, y2], ...].
                Coordinates should be normalized between 0 and 1.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Boundary Error */}
        {errors.boundary && activeTab === 'draw' && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <p>{errors.boundary}</p>
          </div>
        )}

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Boundary Definition Tips</h3>
            <p className="text-xs text-blue-700">
              A accurately defined boundary helps generate better room layouts. The system will
              optimize the placement of rooms within this boundary. You can either draw the boundary
              directly on the canvas or enter coordinates manually if you have precise measurements.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="pt-4 text-right">
          <Button type="submit">Continue to Review</Button>
        </div>
      </div>
    </form>
  );
} 