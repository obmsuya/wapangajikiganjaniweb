// components/ui/toast-provider.jsx
"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "bg-card border border-card-border text-card-fg",
        duration: 5000,
      }}
    />
  );
}