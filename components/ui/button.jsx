// components/ui/button.jsx
import React from "react";

const Button = React.forwardRef(({ 
  className, 
  variant = "primary",
  size = "default",
  isLoading = false,
  children,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-fg hover:bg-primary-hover focus:ring-primary-500/50",
    secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover focus:ring-primary-500/30",
    outline: "bg-transparent border border-input-border text-foreground hover:bg-secondary",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    link: "bg-transparent text-primary-500 hover:underline p-0 h-auto"
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    default: "text-base px-4 py-2",
    lg: "text-lg px-5 py-2.5"
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;