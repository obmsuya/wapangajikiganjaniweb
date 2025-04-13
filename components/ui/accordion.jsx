// components/ui/accordion.jsx
"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

// Context for accordion state
const AccordionContext = createContext({
  expanded: null,
  setExpanded: () => {},
  multiple: false,
});

// Hook to use the accordion context
const useAccordion = () => useContext(AccordionContext);

// Main Accordion component
const Accordion = ({ 
  children, 
  className = "", 
  type = "single", 
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  ...props 
}) => {
  // State for controlling expanded items
  const [expanded, setExpanded] = useState(defaultValue || value || (type === "multiple" ? [] : null));
  
  // Handle external control
  React.useEffect(() => {
    if (value !== undefined) {
      setExpanded(value);
    }
  }, [value]);

  // Handle change in expanded state
  const handleChange = (itemValue) => {
    let newExpanded;
    
    if (type === "multiple") {
      // If multiple, toggle the item in the array
      newExpanded = expanded.includes(itemValue)
        ? expanded.filter(item => item !== itemValue)
        : [...expanded, itemValue];
    } else {
      // If single, toggle between the item and null
      newExpanded = expanded === itemValue && collapsible ? null : itemValue;
    }
    
    setExpanded(newExpanded);
    
    // Call external change handler if provided
    if (onValueChange) {
      onValueChange(newExpanded);
    }
  };
  
  return (
    <AccordionContext.Provider value={{ expanded, setExpanded: handleChange, multiple: type === "multiple" }}>
      <div className={`divide-y divide-card-border ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// AccordionItem component
const AccordionItem = ({ 
  children, 
  className = "", 
  value,
  disabled = false,
  ...props 
}) => {
  const { expanded, multiple } = useAccordion();
  const isExpanded = multiple 
    ? Array.isArray(expanded) && expanded.includes(value)
    : expanded === value;
  
  return (
    <div 
      className={`
        ${className}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  );
};

// AccordionTrigger component
const AccordionTrigger = ({ 
  children, 
  className = "", 
  icon = <ChevronDown size={16} />,
  ...props 
}) => {
  const { expanded, setExpanded, multiple } = useAccordion();
  const itemValue = props['data-value'];
  const isExpanded = multiple 
    ? Array.isArray(expanded) && expanded.includes(itemValue)
    : expanded === itemValue;
  const disabled = props.disabled;
  
  const handleClick = () => {
    if (!disabled) {
      setExpanded(itemValue);
    }
  };
  
  return (
    <div
      className={`
        flex justify-between items-center py-4 px-4 cursor-pointer
        hover:bg-secondary/50 transition-colors duration-150
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `}
      onClick={handleClick}
      aria-expanded={isExpanded}
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      <div className="font-medium">{children}</div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-muted-foreground"
      >
        {icon}
      </motion.div>
    </div>
  );
};

// AccordionContent component
const AccordionContent = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  const { expanded, multiple } = useAccordion();
  const itemValue = props['data-value'];
  const isExpanded = multiple 
    ? Array.isArray(expanded) && expanded.includes(itemValue)
    : expanded === itemValue;
  
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`px-4 pb-4 pt-0 ${className}`} {...props}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };