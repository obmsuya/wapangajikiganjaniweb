// components/ui/card.jsx
import React from "react";
import { motion } from "framer-motion";

const variantStyles = {
  default: "bg-card border-card-border text-card-fg",
  primary: "bg-primary/5 border-primary/20 text-primary-fg",
  secondary: "bg-secondary border-secondary/20 text-secondary-fg",
  outline: "bg-transparent border-card-border text-card-fg",
  ghost: "bg-transparent border-transparent text-card-fg hover:bg-secondary/50",
};

const sizeStyles = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

const radiusStyles = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const Card = React.forwardRef(({
  children,
  className = "",
  variant = "default",
  size = "md",
  radius = "lg",
  hover = false,
  clickable = false,
  shadow = "sm",
  header,
  footer,
  title,
  subtitle,
  image,
  imageAlt = "Card image",
  imagePosition = "top",
  ...props
}, ref) => {
  const shadowStyles = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  const cardContent = (
    <div className={`
      ${variantStyles[variant] || variantStyles.default}
      ${sizeStyles[size] || sizeStyles.md}
      ${radiusStyles[radius] || radiusStyles.lg}
      ${shadowStyles[shadow] || shadowStyles.sm}
      overflow-hidden border transition-all duration-200
      ${hover ? "hover:shadow-md hover:-translate-y-1" : ""}
      ${clickable ? "cursor-pointer active:scale-[0.98]" : ""}
      ${className}
    `}
    ref={ref}
    {...props}
    >
      {/* Card image - top position */}
      {image && imagePosition === "top" && (
        <div className={`-mx-${sizeStyles[size].slice(1)} -mt-${sizeStyles[size].slice(1)} mb-4`}>
          <img 
            src={image} 
            alt={imageAlt} 
            className="w-full h-auto object-cover" 
          />
        </div>
      )}
      
      {/* Card header */}
      {(header || title) && (
        <div className={`${header ? "" : "mb-4"}`}>
          {header || (
            <div>
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      
      {/* Card image - middle position */}
      {image && imagePosition === "middle" && (
        <div className="my-4">
          <img 
            src={image} 
            alt={imageAlt} 
            className="w-full h-auto object-cover rounded-md" 
          />
        </div>
      )}
      
      {/* Card body */}
      <div className={`${(!footer && !header && !title) ? "" : "my-4"}`}>
        {children}
      </div>
      
      {/* Card image - bottom position */}
      {image && imagePosition === "bottom" && (
        <div className={`-mx-${sizeStyles[size].slice(1)} -mb-${sizeStyles[size].slice(1)} mt-4`}>
          <img 
            src={image} 
            alt={imageAlt} 
            className="w-full h-auto object-cover" 
          />
        </div>
      )}
      
      {/* Card footer */}
      {footer && (
        <div className={`mt-4 ${variant === "default" ? "border-t border-card-border pt-4" : ""}`}>
          {footer}
        </div>
      )}
    </div>
  );

  // If card is animated with hover effects
  if (hover) {
    return (
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
});

Card.displayName = "Card";

// Sub-components for better composition
const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-muted-foreground text-sm mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "", divider = true, ...props }) => (
  <div className={`mt-4 ${divider ? "border-t border-card-border pt-4" : ""} ${className}`} {...props}>
    {children}
  </div>
);

const CardImage = ({ src, alt = "Card image", position = "top", className = "", ...props }) => {
  const positionClasses = {
    top: "w-full h-auto object-cover rounded-t-lg -mt-5 -mx-5 mb-4",
    middle: "w-full h-auto object-cover rounded-md my-4",
    bottom: "w-full h-auto object-cover rounded-b-lg -mb-5 -mx-5 mt-4",
  };

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${positionClasses[position]} ${className}`} 
      {...props}
    />
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardImage };