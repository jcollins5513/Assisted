import { toast } from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get authentication token
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // Add authentication header
  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Handle API errors
  private handleError(err: unknown): ApiError {
    const error = err as any;
    if (error?.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          this.handleUnauthorized();
          return { message: 'Authentication required', status };
        case 403:
          return { message: 'Access denied', status };
        case 404:
          return { message: 'Resource not found', status };
        case 422:
          return { message: data?.message || 'Validation error', status };
        case 429:
          return { message: 'Too many requests. Please try again later.', status };
        case 500:
          return { message: 'Internal server error', status };
        default:
          return { message: data?.message || 'An error occurred', status };
      }
    } else if (error?.request) {
      // Network error
      return { message: 'Network error. Please check your connection.', status: 0 };
    } else {
      const msg = (error && error.message) ? error.message : 'An unexpected error occurred';
      return { message: msg, status: 0 };
    }
  }

  // Handle unauthorized access
  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  // Retry mechanism for failed requests
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        const resp = (error as any)?.response;
        if (resp && resp.status >= 400 && resp.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const requestFn = async () => {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const error = new Error('HTTP Error');
          (error as any).response = {
            status: response.status,
            data: await response.json().catch(() => ({})),
          };
          throw error;
        }

        const data = await response.json();
        return data;
      };

      const data = retry ? await this.retryRequest(requestFn) : await requestFn();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      
      // Show error toast for user-facing errors
      if (apiError.status >= 400 && apiError.status < 500) {
        toast.error(apiError.message);
      }

      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, retry: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, retry);
  }

  async post<T>(endpoint: string, data?: any, retry: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, retry);
  }

  async put<T>(endpoint: string, data?: any, retry: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, retry);
  }

  async patch<T>(endpoint: string, data?: any, retry: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, retry);
  }

  async delete<T>(endpoint: string, retry: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, retry);
  }

  // File upload method
  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    // Backend expects field name 'image'
    formData.append('image', file);

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as T;
              resolve({ success: true, data: data as any });
            } catch {
              resolve({ success: true, data: xhr.responseText as any });
            }
          } else {
            const error = this.handleError({ response: { status: xhr.status, data: xhr.responseText } });
            resolve({ success: false, error: error.message });
          }
        });

        xhr.addEventListener('error', () => {
          const error = this.handleError({ request: true });
          resolve({ success: false, error: error.message });
        });

        xhr.open('POST', url, true);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    } catch (error) {
      const apiError = this.handleError(error);
      return { success: false, error: apiError.message };
    }
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/me',
    ME: '/auth/me',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    SETTINGS: '/users/settings',
  },
  
  // Conversations
  CONVERSATIONS: {
    LIST: '/conversations',
    CREATE: '/conversations',
    GET: (id: string) => `/conversations/${id}`,
    UPDATE: (id: string) => `/conversations/${id}`,
    DELETE: (id: string) => `/conversations/${id}`,
    ANALYZE: (id: string) => `/conversations/${id}/analyze`,
  },
  
  // Content
  CONTENT: {
    TEMPLATES: '/content/templates',
    GENERATE: '/content/generate',
    PREVIEW: '/content/preview',
    PUBLISH: '/content/publish',
    UPLOAD: '/content/upload',
  },
  
  // Remote Execution
  REMOTE: {
    CONNECTIONS: '/remote/connections',
    EXECUTE: '/remote/execute',
    STATUS: '/remote/status',
    BACKGROUND_REMOVAL: '/remote/background-removal',
  },

  // Social Media
  SOCIAL: {
    ACCOUNTS: '/social/accounts',
    PUBLISH: '/social/publish',
  },
  
  // Uploads
  UPLOADS: {
    UPLOAD: '/uploads',
    DELETE: (id: string) => `/uploads/${id}`,
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    USAGE: '/analytics/usage',
  },
} as const;

// Export types for use in components
// types exported above
