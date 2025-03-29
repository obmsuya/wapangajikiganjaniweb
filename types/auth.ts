// types/auth.ts

export interface LoginCredentials {
    phone_number: string;
    password: string;
    device_type?: string;
  }
  
  export interface User {
    id: string;
    phone_number: string;
    full_name: string;
    email?: string;
    language: 'en' | 'sw';
    is_active: boolean;
    status: 'active' | 'suspended' | 'blocked';
    date_joined: string;
    last_login?: string;
    notes?: string;
  }
  
  export interface AuthResponse {
    tokens: {
      access: string;
      refresh: string;
      user: User;
    };
  }
  
  export interface PasswordResetParams {
    phone_number: string;
    new_password: string;
    confirm_password: string;
  }
  
  export interface StatusUpdateParams {
    status: 'active' | 'suspended' | 'blocked';
  }
  
  export interface UserActivityLog {
    id: string;
    user: string;
    action: string;
    details: {
        status: string;
    };
    ip_address?: string;
    timestamp: string;
    performed_by: string;
  }