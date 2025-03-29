import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Home, ArrowRight, AlertTriangle } from 'lucide-react';
import AdminPropertyService from '@/services/property';
import Image from 'next/image';
/**
 * Page title and description metadata
 */
export const metadata = {
  title: 'Properties | WaPangajiKiganjani Admin',
  description: 'Manage your properties and rental units',
};

/**
 * Properties Page
 * 
 * Displays a list of properties and provides access to property management functions
 */
export default async function PropertiesPage() {
  // Fetch properties data from the API
  let properties = [];
  let error = null;
  
  try {
    const response = await AdminPropertyService.getProperties();
    properties = response.results;
  } catch (err) {
    console.error('Error fetching properties:', err);
    error = 'Failed to load properties. Please try again later.';
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Properties</h2>
          <p className="text-gray-500">Manage and track your rental properties</p>
        </div>
        
        <Link href="/client/properties/create" passHref>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Property
          </Button>
        </Link>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Property Cards Grid */}
      {properties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            // Calculate occupancy rate if available
            const occupancyRate = property.total_units 
              ? Math.round(((property.total_units - (property.vacant_units || 0)) / property.total_units) * 100) + '%'
              : 'N/A';
              
            return (
              <Card key={property.id} className="overflow-hidden">
                {/* Placeholder for property image */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {property.image ? (
                    <Image 
                      src={property.image} 
                      alt={property.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Home className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle>{property.name}</CardTitle>
                  <CardDescription className="capitalize">{property.category}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Floors:</span>
                      <span className="font-medium">{property.total_floors}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Occupancy Rate:</span>
                      <span className="font-medium">{occupancyRate}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {property.address}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-50 flex justify-end">
                  <Link href={`/client/properties/${property.id}`} passHref>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center border rounded-lg">
          <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
          <p className="text-gray-500 mb-6">You don&apos;t have any properties set up yet.</p>
          <Link href="/client/properties/create" passHref>
            <Button className="flex items-center gap-2 mx-auto">
              <PlusCircle className="h-4 w-4" />
              Add Your First Property
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 