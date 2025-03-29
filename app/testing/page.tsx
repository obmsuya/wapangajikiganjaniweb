'use client';

import React, { useState } from 'react';
import { BlockGeneratorTester } from '../components/testing/BlockGeneratorTester';

export default function TestingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Block Generator Testing Tool</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to test the automated block generation algorithm without authentication.
        You can try different property types, shapes, and configurations to see how the blocks are generated.
      </p>
      
      <BlockGeneratorTester />
    </div>
  );
} 