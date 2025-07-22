// components/ui/ProfileAvatar.jsx
"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useProfileStore } from "@/stores/useProfileStore";

export default function ProfileAvatar({ 
  size = "md", 
  showOnlineStatus = false,
  className = "",
  onClick 
}) {
  const { user, profilePicture, getUserInitials, loadProfilePicture } = useProfileStore();
  
  useEffect(() => {
    if (user?.id) {
      loadProfilePicture();
    }
  }, [user?.id, loadProfilePicture]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm", 
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };

  const avatarSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={user?.full_name || 'User Avatar'}
          className={`${avatarSize} rounded-full object-cover border-2 border-white shadow-sm hover:shadow-md transition-shadow`}
        />
      ) : (
        <div className={`${avatarSize} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-white shadow-sm hover:shadow-md transition-shadow`}>
          {user?.full_name ? (
            <span className="font-semibold text-white">
              {getUserInitials()}
            </span>
          ) : (
            <User className="w-1/2 h-1/2 text-white" />
          )}
        </div>
      )}
      
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
}