// stores/useProfileStore.js
import { create } from 'zustand';
import api from '@/lib/api/api-client';

export const useProfileStore = create((set, get) => ({
  loading: false,
  error: null,
  user: null,
  profilePicture: null,
  
  // UI state
  isEditingProfile: false,
  isChangingPassword: false,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),

  // Toggle edit modes
  toggleEditProfile: () => set((state) => ({ 
    isEditingProfile: !state.isEditingProfile,
    error: null 
  })),
  
  togglePasswordChange: () => set((state) => ({ 
    isChangingPassword: !state.isChangingPassword,
    error: null 
  })),

  // Fetch current user profile
  fetchProfile: async () => {
    try {
      set({ loading: true, error: null });

      const userData = await api.get('/api/v1/auth/me/');

      set({ 
        user: userData,
        loading: false 
      });

      // Update localStorage with fresh user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }

      return userData;
    } catch (error) {
      const errorMessage = error.message || 'Failed to load profile';
      set({ 
        error: errorMessage,
        loading: false 
      });
      throw error;
    }
  },

  // Update user profile
updateProfile: async (profileData, pictureFile = null) => {
    try {
        set({ loading: true, error: null });

        let response;

        if (pictureFile) {
            const formData = new FormData();
            Object.entries(profileData).forEach(([key, val]) => {
                if (val !== null && val !== undefined) formData.append(key, val);
            });
            formData.append('profile_picture', pictureFile);
            response = await api.put('/api/v1/auth/me/update/', formData);
        } else {
            response = await api.put('/api/v1/auth/me/update/', profileData);
        }

        if (response.data) {
            set({
                user: { ...get().user, ...response.data },
                loading: false,
                isEditingProfile: false
            });

            if (typeof window !== 'undefined') {
                const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
                localStorage.setItem('user_data', JSON.stringify({ ...currentUser, ...response.data }));
            }

            return { success: true, message: response.message || 'Profile updated successfully' };
        }

        return { success: false, message: 'Update failed' };
    } catch (error) {
        const errorMessage = error.message || 'Failed to update profile';
        set({ error: errorMessage, loading: false });
        return { success: false, message: errorMessage };
    }
},

changePassword: async (passwordData) => {
    try {
        set({ loading: true, error: null });

        const storedTokens = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('tokens') || '{}')
            : {};

        const response = await api.put('/api/v1/auth/password/change/', {
            ...passwordData,
            refresh: storedTokens.refresh || null,
        });

        set({ loading: false, isChangingPassword: false });

        if (response.tokens && typeof window !== 'undefined') {
            localStorage.setItem('tokens', JSON.stringify(response.tokens));
        }

        return { success: true, message: response.message || 'Password changed successfully' };
    } catch (error) {
        const errorMessage = error.message || 'Failed to change password';
        set({ error: errorMessage, loading: false });
        return { success: false, message: errorMessage };
    }
},


  // Upload profile picture (placeholder for future implementation)
  uploadProfilePicture: async (file) => {
    try {
      set({ loading: true, error: null });

      // For now, just store locally - in future, implement actual upload
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          set({ 
            profilePicture: imageDataUrl,
            loading: false 
          });

          // Store in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem(`profile_picture_${get().user?.id}`, imageDataUrl);
          }

          resolve({ success: true, imageUrl: imageDataUrl });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      set({ 
        error: 'Failed to upload profile picture',
        loading: false 
      });
      return { success: false, message: 'Failed to upload profile picture' };
    }
  },

  // Load profile picture from localStorage
  loadProfilePicture: () => {
    const { user } = get();
    if (user?.id && typeof window !== 'undefined') {
      const savedPicture = localStorage.getItem(`profile_picture_${user.id}`);
      if (savedPicture) {
        set({ profilePicture: savedPicture });
      }
    }
  },

  // Remove profile picture
  removeProfilePicture: () => {
    const { user } = get();
    set({ profilePicture: null });
    
    if (user?.id && typeof window !== 'undefined') {
      localStorage.removeItem(`profile_picture_${user.id}`);
    }
  },

  // Get user initials for avatar fallback
  getUserInitials: () => {
    const { user } = get();
    if (!user?.full_name) return 'U';
    
    return user.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Get user type display
  getUserTypeDisplay: () => {
    const { user } = get();
    switch (user?.user_type) {
      case 'landlord': return 'Landlord';
      case 'tenant': return 'Tenant';
      case 'partner': return 'Partner';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  },

  // Format user data for display
  getFormattedUserData: () => {
    const { user } = get();
    if (!user) return null;

    return {
      ...user,
      userTypeDisplay: get().getUserTypeDisplay(),
      initials: get().getUserInitials(),
      joinedDate: user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown',
      lastLoginDate: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
    };
  },

  // Initialize profile (fetch data and load picture)
  initializeProfile: async () => {
    try {
      await get().fetchProfile();
      get().loadProfilePicture();
    } catch (error) {
      // Handle initialization error
    }
  },

  // Reset store
  reset: () => set({
    loading: false,
    error: null,
    user: null,
    profilePicture: null,
    isEditingProfile: false,
    isChangingPassword: false
  })
}));