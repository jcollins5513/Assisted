import { useState, useEffect, useCallback } from 'react';
import { authService, User, LoginCredentials, RegisterData, UserSettings } from '@/services/auth';

// Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
  canAccess: (feature: string) => boolean;
  getUserSettings: () => UserSettings;
  refreshToken: () => Promise<boolean>;
  verifyToken: () => Promise<boolean>;
}

// Custom hook for authentication
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();

        if (isAuthenticated && user) {
          // Verify token is still valid
          const isValid = await authService.verifyToken();
          
          if (isValid) {
            setState({
              user,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } else {
            // Token is invalid, clear auth
            await authService.logout();
            setState({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null,
            });
          }
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Login failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.register(data);
      
      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Registration failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await authService.logout();
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const result = await authService.updateProfile(updates);
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user,
        }));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update settings function
  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    try {
      const result = await authService.updateSettings(settings);
      
      if (result.success && result.settings) {
        // Update user settings in state
        setState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            settings: result.settings,
          } : null,
        }));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Settings update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Role checking functions
  const hasRole = useCallback((role: User['role']) => {
    return authService.hasRole(role);
  }, []);

  const hasAnyRole = useCallback((roles: User['role'][]) => {
    return authService.hasAnyRole(roles);
  }, []);

  const canAccess = useCallback((feature: string) => {
    return authService.canAccess(feature);
  }, []);

  // Get user settings
  const getUserSettings = useCallback(() => {
    return authService.getUserSettings();
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const success = await authService.refreshToken();
      
      if (success) {
        const user = authService.getCurrentUser();
        setState(prev => ({
          ...prev,
          user: user || prev.user,
        }));
      }
      
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  // Verify token
  const verifyToken = useCallback(async () => {
    try {
      return await authService.verifyToken();
    } catch (error) {
      return false;
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    updateSettings,
    hasRole,
    hasAnyRole,
    canAccess,
    getUserSettings,
    refreshToken,
    verifyToken,
  };
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Hook for getting current user
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Hook for checking user roles
export function useUserRole(): {
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
  canAccess: (feature: string) => boolean;
} {
  const { hasRole, hasAnyRole, canAccess } = useAuth();
  return { hasRole, hasAnyRole, canAccess };
}

// Hook for user settings
export function useUserSettings(): {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
} {
  const { getUserSettings, updateSettings } = useAuth();
  return {
    settings: getUserSettings(),
    updateSettings,
  };
}

// Export types
export type { AuthState, UseAuthReturn };
