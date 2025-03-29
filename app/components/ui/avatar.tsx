import { IconInbox } from "@tabler/icons-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function Avatar({ 
  title = "No data available", 
  message = "There is no data to display at the moment.",
  icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-12 w-12 text-gray-400 mb-4">
        {icon || <IconInbox size={48} />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
} 
