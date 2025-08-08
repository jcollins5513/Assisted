import { useState, useCallback, useRef } from 'react';
import { apiClient, ApiResponse } from '@/services/api';

// Types
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseApiOptions {
  immediate?: boolean;
  retry?: boolean;
  cache?: boolean;
  cacheKey?: string;
  cacheTime?: number;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<ApiResponse<T>>;
  reset: () => void;
  refetch: () => Promise<ApiResponse<T>>;
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCacheKey = (endpoint: string, params?: any): string => {
  return `${endpoint}:${JSON.stringify(params || {})}`;
};

const isCacheValid = (cacheKey: string, cacheTime: number): boolean => {
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < cacheTime;
};

const getCachedData = <T>(cacheKey: string): T | null => {
  const cached = cache.get(cacheKey);
  return cached ? cached.data : null;
};

const setCachedData = <T>(cacheKey: string, data: T, ttl: number): void => {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

// Custom hook for API calls
export function useApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    retry = true,
    cache: enableCache = false,
    cacheKey: customCacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastParamsRef = useRef<any>(null);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  // Execute API call
  const execute = useCallback(
    async (...params: any[]): Promise<ApiResponse<T>> => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      lastParamsRef.current = params;

      const cacheKey = customCacheKey || getCacheKey(endpoint, params);

      // Check cache for GET requests
      if (method === 'GET' && enableCache && isCacheValid(cacheKey, cacheTime)) {
        const cachedData = getCachedData<T>(cacheKey);
        if (cachedData) {
          setState({
            data: cachedData,
            loading: false,
            error: null,
            success: true,
          });
          return { success: true, data: cachedData };
        }
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let response: ApiResponse<T>;

        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(endpoint, retry);
            break;
          case 'POST':
            response = await apiClient.post<T>(endpoint, params[0], retry);
            break;
          case 'PUT':
            response = await apiClient.put<T>(endpoint, params[0], retry);
            break;
          case 'PATCH':
            response = await apiClient.patch<T>(endpoint, params[0], retry);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(endpoint, retry);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        // Check if this is still the latest request
        if (abortControllerRef.current?.signal.aborted) {
          return response;
        }

        if (response.success && response.data) {
          // Cache successful GET responses
          if (method === 'GET' && enableCache) {
            setCachedData(cacheKey, response.data, cacheTime);
          }

          setState({
            data: response.data,
            loading: false,
            error: null,
            success: true,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'Request failed',
            success: false,
          });
        }

        return response;
      } catch (error) {
        // Check if this is still the latest request
        if (abortControllerRef.current?.signal.aborted) {
          return { success: false, error: 'Request cancelled' };
        }

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        });

        return { success: false, error: errorMessage };
      } finally {
        abortControllerRef.current = null;
      }
    },
    [endpoint, method, retry, enableCache, customCacheKey, cacheTime]
  );

  // Refetch with last parameters
  const refetch = useCallback(async (): Promise<ApiResponse<T>> => {
    if (lastParamsRef.current) {
      return execute(...lastParamsRef.current);
    }
    return execute();
  }, [execute]);

  // Execute immediately if requested
  if (immediate && !state.loading && !state.data && !state.error) {
    execute();
  }

  return {
    ...state,
    execute,
    reset,
    refetch,
  };
}

// Specialized hooks for common operations
export function useGet<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi<T>(endpoint, 'GET', options);
}

export function usePost<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi<T>(endpoint, 'POST', options);
}

export function usePut<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi<T>(endpoint, 'PUT', options);
}

export function usePatch<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi<T>(endpoint, 'PATCH', options);
}

export function useDelete<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  return useApi<T>(endpoint, 'DELETE', options);
}

// Hook for file uploads
export function useUpload<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> & { upload: (file: File, onProgress?: (progress: number) => void) => Promise<ApiResponse<T>> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const upload = useCallback(
    async (file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.upload<T>(endpoint, file, onProgress);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            success: true,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'Upload failed',
            success: false,
          });
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        });

        return { success: false, error: errorMessage };
      }
    },
    [endpoint]
  );

  const refetch = useCallback(async (): Promise<ApiResponse<T>> => {
    return { success: false, error: 'Refetch not available for uploads' };
  }, []);

  return {
    ...state,
    execute: upload,
    reset,
    refetch,
    upload,
  };
}

// Export types
export type { UseApiState, UseApiOptions, UseApiReturn };
