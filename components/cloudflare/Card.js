// app/components/cloudflare/Card.js
'use client'
import React from 'react';

const CloudflareCard = ({ 
  children, 
  className = '', 
  variant = 'default', 
  padded = true,
  ...props 
}) => {
  const baseStyle = 'rounded-md overflow-hidden';
  
  const variantStyles = {
    default: 'bg-card border border-card-border',
    outlined: 'border border-card-border bg-transparent',
    elevated: 'bg-card shadow-lg'
  };
  
  const paddingStyle = padded ? 'p-4' : '';
  
  return (
    <div 
      className={`${baseStyle} ${variantStyles[variant]} ${paddingStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CloudflareCardHeader Component
 */
const CloudflareCardHeader = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  action,
  icon,
  ...props 
}) => {
  return (
    <div 
      className={`flex items-center justify-between pb-4 ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-3">
        {icon && <div className="text-primary-600">{icon}</div>}
        <div>
          {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {children}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * CloudflareCardContent Component
 */
const CloudflareCardContent = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CloudflareCardFooter Component
 */
const CloudflareCardFooter = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`mt-4 pt-3 border-t border-card-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CloudflareCardGrid Component
 * For creating a responsive grid of cards
 */
const CloudflareCardGrid = ({ 
  children, 
  className = '', 
  columns = 3, // Default to 3 columns on large screens
  ...props 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div 
      className={`grid gap-4 ${gridCols[columns]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CloudflareStatCard Component
 * For displaying statistics in a card format
 */
const CloudflareStatCard = ({
  title,
  value,
  previousValue,
  icon,
  trend,
  className = '',
  ...props
}) => {
  // Calculate percentage change
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down'
    };
  };
  
  const change = previousValue ? calculateChange() : null;
  
  // Determine trend styles
  const getTrendStyles = () => {
    // Override with passed trend if provided
    const direction = trend || (change ? change.direction : null);
    
    if (!direction) return { text: 'text-gray-500' };
    
    return {
      up: { text: 'text-green-600' },
      down: { text: 'text-red-600' },
      neutral: { text: 'text-gray-500' }
    }[direction] || { text: 'text-gray-500' };
  };
  
  const trendStyles = getTrendStyles();
  
  return (
    <CloudflareCard className={className} {...props}>
      <CloudflareCardHeader title={title} icon={icon} />
      <CloudflareCardContent>
        <div className="flex items-end space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          
          {change && (
            <div className={`text-sm ${trendStyles.text} flex items-center`}>
              {change.direction === 'up' ? '↑' : '↓'} {change.value}%
            </div>
          )}
        </div>
      </CloudflareCardContent>
    </CloudflareCard>
  );
};

export { 
  CloudflareCard, 
  CloudflareCardHeader, 
  CloudflareCardContent, 
  CloudflareCardFooter,
  CloudflareCardGrid,
  CloudflareStatCard
};