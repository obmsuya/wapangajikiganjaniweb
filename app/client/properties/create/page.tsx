'use client';

import React from 'react';
import { AutoPropertyGenerator } from '@/app/components/properties/AutoPropertyGenerator';

/**
 * Create Property Page
 * 
 * This page displays an automatic property generator interface allowing landlords
 * to create new properties with automated room/unit generation
 */
export default function PropertyCreate() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Property</h1>
      <AutoPropertyGenerator />
    </div>
  );
} 