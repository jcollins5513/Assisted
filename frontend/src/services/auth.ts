import { apiClient, API_ENDPOINTS } from './api';

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'salesperson' | 'manager' | 'admin' | 'sales_manager' | 'sales_representative';
  avatar?: string;
  preferences?: any;
  settings?: UserSettings; // fallback client-side settings
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    defaultView: 'overview' | 'sales' | 'content' | 'analytics';
    widgets: string[];
  };
  language: string;
  timezone: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'sales_manager' | 'sales_representative';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Authentication Service Class
class AuthService {
  private currentUser: User | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize user from localStorage on service creation
    this.initializeFromStorage();
  }

  // Initialize user from localStorage
  private initializeFromStorage(): void {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        try {
          this.currentUser = JSON.parse(storedUser);
          this.setupTokenRefresh();
        } catch (error) {
          console.error('Error parsing stored user:', error);
          this.clearAuth();
        }
      }
    }
  }

  // Setup automatic token refresh
  private setupTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Refresh token 5 minutes before it expires (assuming 1 hour expiry)
    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken();
    }, 55 * 60 * 1000); // 55 minutes
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Store authentication data
        this.setAuthData(user, token, refreshToken || '');
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Backend expects firstName, lastName, dealership
      const [firstName, ...rest] = (data.name || '').split(' ');
      const lastName = rest.join(' ') || 'User';
      const payload: any = {
        email: data.email,
        password: data.password,
        firstName: firstName || data.email.split('@')[0],
        lastName,
        dealership: 'Default Dealership',
        role: data.role || 'salesperson',
      };
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Store authentication data
        this.setAuthData(user, token, refreshToken || '');
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if server call fails
      console.error('Error during logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('authToken');
      
      if (!refreshToken) {
        this.clearAuth();
        return false;
      }

      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
        token: refreshToken,
      });

      if (response.success && response.data) {
        const { user, token, refreshToken: newRefreshToken } = response.data;
        
        // Update stored authentication data
        this.setAuthData(user, token, newRefreshToken || '');
        
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      this.clearAuth();
      return false;
    }
  }

  // Verify current token
  async verifyToken(): Promise<boolean> {
    try {
      // Use /auth/me to validate token and refresh user info
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.AUTH.ME || '/auth/me');
      if (response.success && (response.data as any)?.user) {
        this.currentUser = (response.data as any).user;
        this.updateStoredUser(this.currentUser);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser && !!localStorage.getItem('authToken');
  }

  // Check if user has specific role
  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: User['role'][]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE, updates);
      
      if (response.success && response.data) {
        this.currentUser = response.data;
        this.updateStoredUser(response.data);
        return { success: true, user: response.data };
      } else {
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Update user settings
  async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    try {
      const response = await apiClient.patch<{ settings: UserSettings }>(API_ENDPOINTS.USERS.SETTINGS, { settings });
      
      if (response.success && response.data) {
        if (this.currentUser) {
          this.currentUser.settings = response.data.settings;
          this.updateStoredUser(this.currentUser);
        }
        return { success: true, settings: response.data.settings };
      } else {
        return { success: false, error: response.error || 'Settings update failed' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Store authentication data
  private setAuthData(user: User, token: string, refreshToken: string): void {
    this.currentUser = user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    }
    
    this.setupTokenRefresh();
  }

  // Update stored user data
  private updateStoredUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Clear authentication data
  private clearAuth(): void {
    this.currentUser = null;
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Get user settings with defaults
  getUserSettings(): UserSettings {
    return this.currentUser?.settings || {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      dashboard: {
        defaultView: 'overview',
        widgets: ['performance', 'activity', 'quick-actions', 'system-status'],
      },
      language: 'en',
      timezone: 'UTC',
    };
  }

  // Check if user can access a specific feature
  canAccess(feature: string): boolean {
    if (!this.currentUser) return false;
    
    const rolePermissions = {
      admin: ['all'],
      sales_manager: ['sales_training', 'content_creator', 'remote_execution', 'analytics', 'user_management'],
      sales_representative: ['sales_training', 'content_creator'],
    };
    
    const permissions = rolePermissions[this.currentUser.role] || [];
    return permissions.includes('all') || permissions.includes(feature);
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export types
export type { User, UserSettings, LoginCredentials, RegisterData, AuthResponse };
