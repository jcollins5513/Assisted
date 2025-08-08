import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { apiService } from './apiService';

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales_manager' | 'sales_representative';
  avatar?: string;
  settings?: UserSettings;
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

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Authentication Service Class
class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly SALT_ROUNDS: number = 12;

  private constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  // Generate refresh token
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; tokens?: AuthTokens; error?: string }> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check password
      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if user is active
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const token = this.generateToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data (without password)
      const authUser: AuthUser = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        settings: user.settings,
      };

      const tokens: AuthTokens = {
        token,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      };

      return { success: true, user: authUser, tokens };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<{ success: boolean; user?: AuthUser; tokens?: AuthTokens; error?: string }> {
    try {
      const { name, email, password, role = 'sales_representative' } = data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        settings: this.getDefaultSettings(),
      });

      await user.save();

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const token = this.generateToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Return user data
      const authUser: AuthUser = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        settings: user.settings,
      };

      const tokens: AuthTokens = {
        token,
        refreshToken,
        expiresIn: 3600,
      };

      return { success: true, user: authUser, tokens };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);
      if (!payload) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Check if user exists and is active
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        return { success: false, error: 'User not found or inactive' };
      }

      // Generate new tokens
      const tokenPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const newToken = this.generateToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      const tokens: AuthTokens = {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
      };

      return { success: true, tokens };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        settings: user.settings,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const allowedUpdates = ['name', 'avatar'];
      const updateData: any = {};

      // Only allow certain fields to be updated
      allowedUpdates.forEach(field => {
        if (updates[field as keyof AuthUser] !== undefined) {
          updateData[field] = updates[field as keyof AuthUser];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const authUser: AuthUser = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        settings: user.settings,
      };

      return { success: true, user: authUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Profile update failed' };
    }
  }

  // Update user settings
  async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { settings: { ...this.getDefaultSettings(), ...settings } },
        { new: true }
      );

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, settings: user.settings };
    } catch (error) {
      console.error('Update settings error:', error);
      return { success: false, error: 'Settings update failed' };
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Password change failed' };
    }
  }

  // Get default user settings
  private getDefaultSettings(): UserSettings {
    return {
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

  // Authentication middleware
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json(
            apiService.error('Authentication required')
          );
        }

        const token = authHeader.substring(7);
        const payload = this.verifyToken(token);

        if (!payload) {
          return res.status(401).json(
            apiService.error('Invalid or expired token')
          );
        }

        // Get user from database
        const user = await this.getUserById(payload.userId);
        if (!user) {
          return res.status(401).json(
            apiService.error('User not found')
          );
        }

        // Add user to request
        (req as any).user = user;
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json(
          apiService.error('Authentication failed')
        );
      }
    };
  }

  // Authorization middleware
  authorize(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json(
          apiService.error('Authentication required')
        );
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json(
          apiService.error('Insufficient permissions')
        );
      }

      next();
    };
  }

  // Check if user can access feature
  canAccess(user: AuthUser, feature: string): boolean {
    const rolePermissions = {
      admin: ['all'],
      sales_manager: ['sales_training', 'content_creator', 'remote_execution', 'analytics', 'user_management'],
      sales_representative: ['sales_training', 'content_creator'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('all') || permissions.includes(feature);
  }

  // Logout (invalidate refresh token)
  async logout(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real application, you might want to store invalidated refresh tokens
      // in a database or Redis cache to prevent their reuse
      
      // For now, we'll just return success
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }
}

// Create singleton instance
export const authService = AuthService.getInstance();

// Export types
export type { AuthUser, UserSettings, LoginCredentials, RegisterData, TokenPayload, AuthTokens };
