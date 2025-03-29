'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';
import { authService } from '@/services/auth';

// Define types for auth context
type User = {
  id: string;
  fullName: string;
  phoneNumber: string;
  userType: 'tenant' | 'landlord' | 'manager' | 'system_admin';
  isStaff: boolean;
  isSuperuser: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { phone_number: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (requiredRole: string[]) => boolean;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  checkPermission: () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if there's an authenticated user on mount
  useEffect(() => {
    async function loadUserFromStorage() {
      setIsLoading(true);
      
      try {
        // Check if we have a token in cookies
        const token = getCookie('token');
        
        if (!token) {
          setUser(null);
          return;
        }
        
        // Try to load user data from localStorage first (faster)
        if (typeof window !== 'undefined') {
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            setUser(userData);
          } else {
            // If no user data in localStorage, fetch from API
            try {
              const currentUser = await authService.getCurrentUser();
              
              // Store the user data
              const userData = {
                id: currentUser.id,
                fullName: currentUser.full_name,
                phoneNumber: currentUser.phone_number,
                userType: currentUser.user_type,
                isStaff: currentUser.is_staff,
                isSuperuser: currentUser.is_superuser
              };
              
              setUser(userData);
              
              // Cache in localStorage
              localStorage.setItem('userData', JSON.stringify(userData));
            } catch (error) {
              console.error('Failed to fetch current user:', error);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserFromStorage();
  }, []);
  
  // Login function
  const login = async (credentials: { phone_number: string; password: string }) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login(credentials);
      
      // Create user object
      const userData = {
        id: response.user.id,
        fullName: response.user.full_name,
        phoneNumber: response.user.phone_number,
        userType: response.user.user_type as User['userType'],
        isStaff: response.user.is_staff,
        isSuperuser: response.user.is_superuser
      };
      
      setUser(userData);
      
      // Cache in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Determine redirect path based on user type
      let redirectPath = '/dashboard'; // Default for admin
      
      if (userData.isStaff || userData.isSuperuser) {
        redirectPath = '/dashboard';
      } else if (userData.userType === 'landlord') {
        redirectPath = '/client/dashboard';
      } else if (userData.userType === 'tenant') {
        redirectPath = '/tenant/dashboard';
      } else if (userData.userType === 'manager') {
        redirectPath = '/manager/dashboard';
      }
      
      // Get the callback URL if it exists from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');
      
      // Redirect
      router.push(callbackUrl || redirectPath);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      
      // Clear user data
      setUser(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      
      // Clear cookies
      deleteCookie('token');
      deleteCookie('userType');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to check if user has required role(s)
  const checkPermission = (requiredRoles: string[]) => {
    if (!user) return false;
    
    // Superuser has access to everything
    if (user.isSuperuser) return true;
    
    // Check if user type is in the required roles
    return requiredRoles.includes(user.userType);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 