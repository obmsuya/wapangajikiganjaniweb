// components/ui/input.jsx
import React from "react";

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label,
  ...props 
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-3 py-2 
          bg-input border border-input-border text-input-fg 
          rounded-md focus:outline-none focus:ring-2 
          focus:ring-primary-500/50 focus:border-primary-500
          transition-all duration-200
          ${error ? "border-error focus:ring-error/50 focus:border-error" : ""}
          ${className}
        `}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;