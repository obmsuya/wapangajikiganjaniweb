// components/ui/badge.jsx
import React from "react";
import { motion } from "framer-motion";

const variantStyles = {
  default: "bg-primary-50 text-primary-700 border-primary-200",
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-secondary/30",
  outline: "bg-transparent text-foreground border-input",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  ghost: "bg-transparent text-muted-foreground border-transparent",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

const Badge = React.forwardRef(({
  children,
  className = "",
  variant = "default",
  size = "md",
  bordered = true,
  rounded = "full",
  icon,
  dismissible = false,
  onDismiss,
  animation = false,
  dot = false,
  dotColor,
  ...props
}, ref) => {
  // Handle badge dismissal
  const handleDismiss = (e) => {
    e.stopPropagation();
    if (onDismiss) onDismiss();
  };

  // Compute dot color based on variant if not explicitly set
  const computedDotColor = dotColor || {
    default: "bg-primary-500",
    primary: "bg-primary",
    secondary: "bg-secondary-foreground",
    outline: "bg-foreground",
    destructive: "bg-destructive",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
    ghost: "bg-muted-foreground",
  }[variant];

  // Animation variants
  const badgeAnimations = animation ? {
    initial: { scale: 1 },
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.98 },
  } : {};

  // Round style mapping
  const roundedStyles = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  
  const Badge = (
    <motion.span
      ref={ref}
      className={`
        inline-flex items-center justify-center
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.md}
        ${roundedStyles[rounded] || roundedStyles.full}
        ${bordered ? "border" : ""}
        font-medium
        whitespace-nowrap
        ${className}
      `}
      {...badgeAnimations}
      {...props}
    >
      {dot && (
        <span className={`mr-1.5 h-2 w-2 rounded-full ${computedDotColor}`} />
      )}
      {icon && (
        <span className="mr-1.5">{icon}</span>
      )}
      {children}
      {dismissible && (
        <button
          type="button"
          className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-black/10 focus:outline-none"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  );

  return Badge;
});

Badge.displayName = "Badge";

export { Badge };