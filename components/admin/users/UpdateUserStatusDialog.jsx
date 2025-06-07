// components/admin/UpdateUserStatusDialog.jsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UpdateUserStatusDialog({ isOpen, onClose, onConfirm, userName, action }) {
  const title = action === 'activate' 
    ? 'Activate User Account' 
    : 'Suspend User Account';
  
  const description = action === 'activate'
    ? `Are you sure you want to activate ${userName}'s account? They will regain access to the system.`
    : `Are you sure you want to suspend ${userName}'s account? They will lose access to the system until reactivated.`;
  
  const buttonText = action === 'activate' ? 'Activate' : 'Suspend';
  
  const buttonClass = action === 'activate' 
    ? 'bg-green-600 hover:bg-green-700 text-white' 
    : 'bg-yellow-600 hover:bg-yellow-700 text-white';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={buttonClass}
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}