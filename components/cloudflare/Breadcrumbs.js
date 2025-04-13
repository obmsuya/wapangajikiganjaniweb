// app/components/cloudflare/Breadcrumbs.js
'use client'
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/**
 * CloudflareBreadcrumbs Component
 * 
 * A breadcrumb navigation component styled like Cloudflare's UI
 * 
 * @param {Array} items - Array of breadcrumb items with label and href
 * @param {boolean} showHomeIcon - Whether to show home icon for the first item
 * @param {string} className - Additional classes
 */
const CloudflareBreadcrumbs = ({ 
  items = [], 
  showHomeIcon = true,
  className = '',
  ...props 
}) => {
  // Ensure items is an array
  const breadcrumbItems = Array.isArray(items) ? items : [];
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href || '#'} 
                  className="text-gray-500 hover:text-primary-600 transition-colors flex items-center"
                >
                  {isFirst && showHomeIcon ? (
                    <Home className="h-4 w-4 mr-1" />
                  ) : null}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * PageHeader Component combines breadcrumbs with a page title and optional actions
 */
const CloudflarePageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {breadcrumbs && (
        <div className="mb-2">
          <CloudflareBreadcrumbs items={breadcrumbs} />
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-gray-500">{description}</p>}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export { CloudflareBreadcrumbs, CloudflarePageHeader };