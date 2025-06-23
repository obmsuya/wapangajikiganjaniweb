// components/cloudflare/Dialog.jsx
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function CloudflareDialog({ open, onOpenChange, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };

    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target) && open) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Dialog Container */}
      <div
        ref={dialogRef}
        className="relative z-10 animate-in fade-in-0 zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function CloudflareDialogContent({ className = "", children, ...props }) {
  return (
    <div
      className={`
        relative bg-white/95 backdrop-blur-xl shadow-2xl border-0 
        rounded-2xl overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CloudflareDialogHeader({ className = "", children, ...props }) {
  return (
    <div
      className={`
        flex flex-col space-y-1.5 text-center sm:text-left
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CloudflareDialogTitle({ className = "", children, ...props }) {
  return (
    <h2
      className={`
        text-lg font-semibold leading-none tracking-tight
        ${className}
      `}
      {...props}
    >
      {children}
    </h2>
  );
}

// Export aliases to match shadcn naming for drop-in replacement
export const Dialog = CloudflareDialog;
export const DialogContent = CloudflareDialogContent;
export const DialogHeader = CloudflareDialogHeader;
export const DialogTitle = CloudflareDialogTitle;