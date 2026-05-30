"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const AccordionContext = createContext({
  expanded: null,
  setExpanded: () => {},
  multiple: false,
});

const AccordionItemContext = createContext(null);

const useAccordion = () => useContext(AccordionContext);

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
  const [expanded, setExpanded] = useState(
    defaultValue || value || (type === "multiple" ? [] : null)
  );

  React.useEffect(() => {
    if (value !== undefined) setExpanded(value);
  }, [value]);

  const handleChange = (itemValue) => {
    let newExpanded;
    if (type === "multiple") {
      newExpanded = expanded.includes(itemValue)
        ? expanded.filter(item => item !== itemValue)
        : [...expanded, itemValue];
    } else {
      newExpanded = expanded === itemValue && collapsible ? null : itemValue;
    }
    setExpanded(newExpanded);
    if (onValueChange) onValueChange(newExpanded);
  };

  return (
    <AccordionContext.Provider value={{ expanded, setExpanded: handleChange, multiple: type === "multiple" }}>
      <div className={`divide-y divide-card-border ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

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
    <AccordionItemContext.Provider value={value}>
      <div
        className={`${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        data-state={isExpanded ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

const AccordionTrigger = ({
  children,
  className = "",
  icon = <ChevronDown size={16} />,
  disabled,
  ...props
}) => {
  const { expanded, setExpanded, multiple } = useAccordion();
  const itemValue = useContext(AccordionItemContext);
  const isExpanded = multiple
    ? Array.isArray(expanded) && expanded.includes(itemValue)
    : expanded === itemValue;

  return (
    <div
      className={`flex justify-between items-center py-4 px-4 cursor-pointer hover:bg-secondary/50 transition-colors duration-150 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      onClick={() => { if (!disabled) setExpanded(itemValue); }}
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

const AccordionContent = ({
  children,
  className = "",
  ...props
}) => {
  const { expanded, multiple } = useAccordion();
  const itemValue = useContext(AccordionItemContext);
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