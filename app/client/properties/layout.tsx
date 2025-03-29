import React from 'react';

/**
 * Layout for the properties section of the client portal
 */
export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Properties Management</h1>
        <p className="text-gray-500">Manage your properties and units</p>
      </div>
      
      {/* Main content area */}
      <div>
        {children}
      </div>
    </div>
  );
} 