// lib/user-management-logic.js

/**
 * This file contains business logic for user management operations
 * based on user types and admin capabilities
 */

/**
 * Determine what operations are allowed for a specific user
 * @param {Object} user - The user object
 * @param {Object} currentAdmin - The current admin user performing the action
 * @returns {Object} Object containing flags for allowed operations
 */
export function getUserPermissions(user, currentAdmin) {
    if (!user || !currentAdmin) return {};
    
    // Set defaults
    const permissions = {
      canView: true,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canDeactivate: false,
      canResetPassword: false,
      canViewDetails: false, // For type-specific details
    };
    
    // Only system admins can fully manage other users
    if (currentAdmin.user_type === 'system_admin') {
      permissions.canEdit = true;
      permissions.canResetPassword = true;
      permissions.canViewDetails = true;
      
      // System admins can activate/deactivate all user types
      permissions.canActivate = !user.is_active;
      permissions.canDeactivate = user.is_active;
      
      // System admins can delete all users except other system admins
      permissions.canDelete = user.user_type !== 'system_admin';
    }
    
    // Managers can manage tenants (but not delete)
    if (currentAdmin.user_type === 'manager') {
      if (user.user_type === 'tenant') {
        // In a real app, you'd check if this tenant is managed by this manager
        permissions.canEdit = true;
        permissions.canResetPassword = true;
        permissions.canViewDetails = true;
        permissions.canActivate = !user.is_active;
        permissions.canDeactivate = user.is_active;
      }
    }
    
    // Landlords can manage their tenants and managers
    if (currentAdmin.user_type === 'landlord') {
      if (user.user_type === 'tenant' || user.user_type === 'manager') {
        // In a real app, you'd check if this tenant or manager belongs to this landlord
        permissions.canEdit = true;
        permissions.canResetPassword = true;
        permissions.canViewDetails = true;
        permissions.canActivate = !user.is_active;
        permissions.canDeactivate = user.is_active;
        
        // Landlords can delete managers
        permissions.canDelete = user.user_type === 'manager';
      }
    }
    
    return permissions;
  }
  
  /**
   * Determine what fields can be edited for a specific user type
   * @param {string} userType - The type of user
   * @param {Object} currentAdmin - The current admin user performing the action
   * @returns {Array} Array of editable field names
   */
  export function getEditableFields(userType, currentAdmin) {
    // Common fields that can be edited for all user types
    const commonFields = ['full_name', 'email', 'is_active', 'notes'];
    
    // Only system admins can edit these fields
    const adminOnlyFields = ['is_staff', 'user_type', 'status'];
    
    switch (userType) {
      case 'tenant':
        // Tenants may have additional fields like lease information
        return [
          ...commonFields,
          ...(currentAdmin.user_type === 'system_admin' ? adminOnlyFields : [])
        ];
        
      case 'landlord':
        // Only system admins can edit landlords
        return currentAdmin.user_type === 'system_admin' 
          ? [...commonFields, ...adminOnlyFields]
          : [];
        
      case 'manager':
        // Managers may have additional fields like managed properties
        return [
          ...commonFields,
          ...(currentAdmin.user_type === 'system_admin' ? adminOnlyFields : [])
        ];
        
      case 'system_admin':
        // Only system admins can edit other system admins
        return currentAdmin.user_type === 'system_admin' 
          ? [...commonFields, ...adminOnlyFields]
          : [];
        
      default:
        return [];
    }
  }
  
  /**
   * Validate user data before updating
   * @param {Object} userData - The user data to validate
   * @param {string} userType - The type of user 
   * @returns {Object} Object with validation result and any errors
   */
  export function validateUserData(userData, userType) {
    const errors = {};
    
    // Validate common fields
    if (userData.full_name && userData.full_name.length < 3) {
      errors.full_name = 'Name must be at least 3 characters long';
    }
    
    if (userData.email && !isValidEmail(userData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Validate user type specific fields
    switch (userType) {
      case 'tenant':
        // Add tenant-specific validation here
        break;
        
      case 'landlord':
        // Add landlord-specific validation here
        break;
        
      case 'manager':
        // Add manager-specific validation here
        break;
        
      default:
        break;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  /**
   * Get appropriate display properties for user status
   * @param {string} status - User status 
   * @returns {Object} Object with color and label
   */
  export function getUserStatusDisplay(status, isActive = true) {
    // Default to using the isActive field if status isn't set
    const effectiveStatus = status || (isActive ? 'active' : 'blocked');
    
    switch (effectiveStatus) {
      case 'active':
        return {
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          darkBgColor: 'dark:bg-green-900',
          darkTextColor: 'dark:text-green-300',
          label: 'Active'
        };
        
      case 'suspended':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          darkBgColor: 'dark:bg-yellow-900',
          darkTextColor: 'dark:text-yellow-300',
          label: 'Suspended'
        };
        
      case 'blocked':
        return {
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          darkBgColor: 'dark:bg-red-900',
          darkTextColor: 'dark:text-red-300',
          label: 'Blocked'
        };
        
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          darkBgColor: 'dark:bg-gray-900',
          darkTextColor: 'dark:text-gray-300',
          label: 'Unknown'
        };
    }
  }
  
  /**
   * Get appropriate display properties for user type
   * @param {string} userType - User type 
   * @returns {Object} Object with color, icon and label
   */
  export function getUserTypeDisplay(userType) {
    switch (userType) {
      case 'landlord':
        return {
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          darkBgColor: 'dark:bg-blue-900',
          darkTextColor: 'dark:text-blue-300',
          icon: 'Building',
          label: 'Landlord'
        };
        
      case 'tenant':
        return {
          color: 'purple',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          darkBgColor: 'dark:bg-purple-900',
          darkTextColor: 'dark:text-purple-300',
          icon: 'Home',
          label: 'Tenant'
        };
        
      case 'manager':
        return {
          color: 'indigo',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-800',
          darkBgColor: 'dark:bg-indigo-900',
          darkTextColor: 'dark:text-indigo-300',
          icon: 'Users',
          label: 'Manager'
        };
        
      case 'system_admin':
        return {
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          darkBgColor: 'dark:bg-gray-900',
          darkTextColor: 'dark:text-gray-300',
          icon: 'Shield',
          label: 'System Admin'
        };
        
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          darkBgColor: 'dark:bg-gray-900',
          darkTextColor: 'dark:text-gray-300',
          icon: 'User',
          label: 'Unknown'
        };
    }
  }
  
  // Helper functions
  function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }