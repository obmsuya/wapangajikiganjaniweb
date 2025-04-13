// components/cloudflare/PageHeader.jsx
"use client";

import Link from 'next/link';
import { ChevronRight, HomeIcon } from 'lucide-react';

export function CloudflarePageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex text-sm text-gray-500 dark:text-gray-400">
          <ol role="list" className="flex items-center space-x-2">
            <li>
              <Link href="/" className="flex items-center hover:text-primary-600 transition-colors">
                <HomeIcon className="h-4 w-4 mr-1" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href} 
                    className="hover:text-primary-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}