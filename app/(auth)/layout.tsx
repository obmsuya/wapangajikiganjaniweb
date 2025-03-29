// app/(auth)/layout.tsx
'use client';

import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@/app/components/theme/ThemeProvider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}