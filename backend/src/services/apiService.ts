import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiRequest extends Request {
  requestId?: string;
  startTime?: number;
  user?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Service Class
class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generate request ID
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create success response
  success<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  // Create error response
  error(message: string, error?: any, requestId?: string): ApiResponse {
    return {
      success: false,
      error: message,
      message: error?.message || message,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  // Create paginated response
  paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
    requestId?: string
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }

  // Parse pagination parameters from request
  parsePagination(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = (req.query.sortOrder as string || 'desc').toLowerCase() as 'asc' | 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  // Calculate pagination skip value
  calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Validate request body
  validateBody<T>(req: Request, schema: any): { valid: boolean; data?: T; errors?: string[] } {
    try {
      // This would integrate with a validation library like Joi or Zod
      // For now, we'll do basic validation
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return {
          valid: false,
          errors: error.details.map((detail: any) => detail.message),
        };
      }

      return { valid: true, data: value };
    } catch (error) {
      return {
        valid: false,
        errors: ['Validation failed'],
      };
    }
  }

  // Handle async route handlers
  asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Performance monitoring middleware
  performanceMiddleware() {
    return (req: ApiRequest, res: Response, next: NextFunction) => {
      req.requestId = this.generateRequestId();
      req.startTime = performance.now();

      // Add request ID to response headers
      res.setHeader('X-Request-ID', req.requestId);

      // Monitor response time
      res.on('finish', () => {
        const endTime = performance.now();
        const duration = endTime - (req.startTime || 0);
        
        // Log performance metrics
        console.log(`[${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
        
        // This would integrate with your performance monitoring service
        // Example: recordApiMetric(req.path, duration, res.statusCode < 400, res.statusCode);
      });

      next();
    };
  }

  // Error handling middleware
  errorHandler() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      const requestId = (req as ApiRequest).requestId;
      
      console.error(`[${requestId}] Error:`, error);

      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return res.status(400).json(
          this.error('Validation failed', error, requestId)
        );
      }

      if (error.name === 'CastError') {
        return res.status(400).json(
          this.error('Invalid ID format', error, requestId)
        );
      }

      if (error.code === 11000) {
        return res.status(409).json(
          this.error('Duplicate entry', error, requestId)
        );
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(
          this.error('Invalid token', error, requestId)
        );
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(
          this.error('Token expired', error, requestId)
        );
      }

      // Default error
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';

      res.status(statusCode).json(
        this.error(message, error, requestId)
      );
    };
  }

  // Rate limiting middleware
  rateLimit(options: {
    windowMs: number;
    max: number;
    message?: string;
  }) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - options.windowMs;

      const requestData = requests.get(key);
      
      if (!requestData || requestData.resetTime < now) {
        requests.set(key, {
          count: 1,
          resetTime: now + options.windowMs,
        });
      } else {
        requestData.count++;
        
        if (requestData.count > options.max) {
          return res.status(429).json(
            this.error(options.message || 'Too many requests')
          );
        }
      }

      next();
    };
  }

  // CORS middleware
  corsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }

  // Security middleware
  securityMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Remove sensitive headers
      res.removeHeader('X-Powered-By');
      
      // Add security headers
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Content Security Policy
      res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");

      next();
    };
  }

  // Request logging middleware
  requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = (req as ApiRequest).requestId;

      console.log(`[${requestId}] ${req.method} ${req.path} - Started`);

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });

      next();
    };
  }

  // Health check endpoint
  healthCheck() {
    return (req: Request, res: Response) => {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };

      res.json(this.success(health));
    };
  }

  // Not found handler
  notFound() {
    return (req: Request, res: Response) => {
      res.status(404).json(
        this.error('Endpoint not found')
      );
    };
  }

  // Method not allowed handler
  methodNotAllowed() {
    return (req: Request, res: Response) => {
      res.status(405).json(
        this.error('Method not allowed')
      );
    };
  }
}

// Create singleton instance
export const apiService = ApiService.getInstance();

// Export types
export type { ApiResponse, ApiRequest, PaginationParams, PaginatedResponse };
