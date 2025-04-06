// components/ui/custom-toast.jsx
"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export function CustomToaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        className: "custom-toast-class",
        duration: 4000,
        style: {
          borderRadius: '0.625rem',
          padding: '16px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--card-border)',
          backgroundColor: 'var(--card-bg, white)',
          color: 'var(--card-fg, black)',
        },
      }}
    />
  );
}

// Custom toast functions with enhanced styling
export const customToast = {
  success: (title, options = {}) => {
    return toast.success(title, {
      ...options,
      className: "custom-toast-success",
      style: {
        backgroundColor: 'rgb(var(--color-success-50))',
        borderLeftColor: 'rgb(var(--color-success-500))',
        borderLeftWidth: '4px',
      },
      icon: <SuccessIcon />,
    });
  },
  
  error: (title, options = {}) => {
    return toast.error(title, {
      ...options,
      className: "custom-toast-error",
      style: {
        backgroundColor: 'rgb(var(--color-error-50))',
        borderLeftColor: 'rgb(var(--color-error-500))',
        borderLeftWidth: '4px',
      },
      icon: <ErrorIcon />,
    });
  },
  
  info: (title, options = {}) => {
    return toast.info(title, {
      ...options,
      className: "custom-toast-info",
      style: {
        backgroundColor: 'rgb(var(--color-primary-50))',
        borderLeftColor: 'rgb(var(--color-primary-500))',
        borderLeftWidth: '4px',
      },
      icon: <InfoIcon />,
    });
  },
  
  warning: (title, options = {}) => {
    return toast.warning(title, {
      ...options,
      className: "custom-toast-warning",
      style: {
        backgroundColor: 'rgb(250, 245, 225)',
        borderLeftColor: 'rgb(245, 180, 50)',
        borderLeftWidth: '4px',
      },
      icon: <WarningIcon />,
    });
  },
  
  loading: (title, options = {}) => {
    return toast.loading(title, {
      ...options,
      className: "custom-toast-loading",
      style: {
        backgroundColor: 'rgb(var(--color-primary-50))',
        borderLeftColor: 'rgb(var(--color-primary-500))',
        borderLeftWidth: '4px',
      },
    });
  },
  
  // Custom promise toast
  promise: (promise, options = {}) => {
    return toast.promise(promise, {
      loading: 'Loading...',
      success: 'Success!',
      error: 'Error!',
      ...options,
    });
  },
};

// Custom icons for toast notifications
const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="rgb(var(--color-success-500))" strokeWidth="2"/>
    <path d="M6 10L9 13L14 7" stroke="rgb(var(--color-success-500))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="rgb(var(--color-error-500))" strokeWidth="2"/>
    <path d="M7 7L13 13M7 13L13 7" stroke="rgb(var(--color-error-500))" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="rgb(var(--color-primary-500))" strokeWidth="2"/>
    <path d="M10 6V10M10 14V14.01" stroke="rgb(var(--color-primary-500))" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.99999 2L18.6602 17H1.33984L9.99999 2Z" stroke="rgb(245, 180, 50)" strokeWidth="2"/>
    <path d="M10 8V12M10 16V16.01" stroke="rgb(245, 180, 50)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default customToast;