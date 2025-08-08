import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errorCode?: string;
  retryable?: boolean;
  fallbackAvailable?: boolean;
  context?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: AppError;
  request: {
    url: string;
    method: string;
    ip: string;
    userAgent: string;
    userId?: string;
  };
  context: Record<string, any>;
  resolved: boolean;
  resolution?: string;
}

export interface ErrorNotification {
  type: 'critical' | 'warning' | 'info';
  message: string;
  error: AppError;
  timestamp: Date;
  recipients: string[];
}

export class ErrorHandlerService extends EventEmitter {
  private errorLogs: Map<string, ErrorLog> = new Map();
  private retryQueue: Array<{ error: AppError; attempt: number; maxAttempts: number }> = [];
  private notificationQueue: ErrorNotification[] = [];
  private isProcessingRetries = false;

  constructor() {
    super();
    this.startRetryProcessor();
    this.startNotificationProcessor();
  }

  // Enhanced Error Handler
  handleError(
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const errorLog = this.createErrorLog(error, req);
    this.errorLogs.set(errorLog.id, errorLog);

    // Log error with comprehensive details
    this.logError(errorLog);

    // Determine if error is retryable
    if (error.retryable && this.shouldRetry(error)) {
      this.queueForRetry(error, req);
    }

    // Check for fallback options
    if (error.fallbackAvailable) {
      this.attemptFallback(error, req, res);
      return;
    }

    // Send error notification if critical
    if (this.isCriticalError(error)) {
      this.queueNotification({
        type: 'critical',
        message: `Critical error occurred: ${error.message}`,
        error,
        timestamp: new Date(),
        recipients: this.getNotificationRecipients()
      });
    }

    // Send response
    const statusCode = error.statusCode || 500;
    const message = this.getUserFriendlyMessage(error);

    res.status(statusCode).json({
      error: {
        message,
        statusCode,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
        retryable: error.retryable,
        fallbackAvailable: error.fallbackAvailable
      }
    });
  }

  // Error Recovery Procedures
  private async attemptFallback(error: AppError, req: Request, res: Response): Promise<void> {
    try {
      const fallbackResult = await this.executeFallbackStrategy(error, req);
      
      if (fallbackResult.success) {
        res.status(200).json({
          message: 'Operation completed using fallback method',
          data: fallbackResult.data,
          fallbackUsed: true
        });
      } else {
        // If fallback also fails, send original error
        res.status(error.statusCode || 500).json({
          error: {
            message: error.message,
            statusCode: error.statusCode || 500,
            fallbackFailed: true
          }
        });
      }
    } catch (fallbackError) {
      res.status(error.statusCode || 500).json({
        error: {
          message: error.message,
          statusCode: error.statusCode || 500,
          fallbackFailed: true
        }
      });
    }
  }

  private async executeFallbackStrategy(error: AppError, req: Request): Promise<{
    success: boolean;
    data?: any;
  }> {
    // Implement fallback strategies based on error type
    switch (error.errorCode) {
      case 'REMOTE_CONNECTION_FAILED':
        return this.fallbackToLocalProcessing(req);
      
      case 'FILE_TRANSFER_FAILED':
        return this.fallbackToAlternativeTransfer(req);
      
      case 'QUALITY_ASSESSMENT_FAILED':
        return this.fallbackToManualReview(req);
      
      case 'PROCESSING_TIMEOUT':
        return this.fallbackToSimplifiedProcessing(req);
      
      default:
        return { success: false };
    }
  }

  private async fallbackToLocalProcessing(req: Request): Promise<{ success: boolean; data?: any }> {
    // Fallback to local processing when remote connection fails
    try {
      // Simulate local processing
      return {
        success: true,
        data: {
          message: 'Processing completed locally',
          processingType: 'local'
        }
      };
    } catch (error) {
      return { success: false };
    }
  }

  private async fallbackToAlternativeTransfer(req: Request): Promise<{ success: boolean; data?: any }> {
    // Fallback to alternative file transfer method
    try {
      // Simulate alternative transfer method
      return {
        success: true,
        data: {
          message: 'File transferred using alternative method',
          transferMethod: 'alternative'
        }
      };
    } catch (error) {
      return { success: false };
    }
  }

  private async fallbackToManualReview(req: Request): Promise<{ success: boolean; data?: any }> {
    // Fallback to manual review when quality assessment fails
    try {
      return {
        success: true,
        data: {
          message: 'Quality assessment bypassed - manual review required',
          reviewType: 'manual'
        }
      };
    } catch (error) {
      return { success: false };
    }
  }

  private async fallbackToSimplifiedProcessing(req: Request): Promise<{ success: boolean; data?: any }> {
    // Fallback to simplified processing when timeout occurs
    try {
      return {
        success: true,
        data: {
          message: 'Processing completed with simplified settings',
          processingType: 'simplified'
        }
      };
    } catch (error) {
      return { success: false };
    }
  }

  // Automatic Retry Mechanisms
  private shouldRetry(error: AppError): boolean {
    const retryableErrors = [
      'REMOTE_CONNECTION_FAILED',
      'FILE_TRANSFER_FAILED',
      'TEMPORARY_NETWORK_ERROR',
      'PROCESSING_TIMEOUT'
    ];
    
    return retryableErrors.includes(error.errorCode || '');
  }

  private queueForRetry(error: AppError, req: Request): void {
    this.retryQueue.push({
      error,
      attempt: 1,
      maxAttempts: this.getMaxRetryAttempts(error)
    });
  }

  private getMaxRetryAttempts(error: AppError): number {
    const retryConfig: Record<string, number> = {
      'REMOTE_CONNECTION_FAILED': 3,
      'FILE_TRANSFER_FAILED': 5,
      'TEMPORARY_NETWORK_ERROR': 2,
      'PROCESSING_TIMEOUT': 2
    };
    
    return retryConfig[error.errorCode || ''] || 3;
  }

  private async startRetryProcessor(): Promise<void> {
    while (true) {
      if (this.retryQueue.length > 0 && !this.isProcessingRetries) {
        this.isProcessingRetries = true;
        const retryItem = this.retryQueue.shift()!;
        await this.processRetry(retryItem);
        this.isProcessingRetries = false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async processRetry(retryItem: { error: AppError; attempt: number; maxAttempts: number }): Promise<void> {
    const { error, attempt, maxAttempts } = retryItem;
    
    if (attempt > maxAttempts) {
      this.logError({
        id: this.generateId(),
        timestamp: new Date(),
        error: { ...error, message: `Max retry attempts (${maxAttempts}) exceeded` },
        request: { url: '', method: '', ip: '', userAgent: '' },
        context: { retryAttempts: attempt },
        resolved: false
      });
      return;
    }

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Attempt to retry the operation
      await this.retryOperation(error, attempt);
      
      this.logError({
        id: this.generateId(),
        timestamp: new Date(),
        error: { ...error, message: `Retry attempt ${attempt} successful` },
        request: { url: '', method: '', ip: '', userAgent: '' },
        context: { retryAttempts: attempt },
        resolved: true,
        resolution: 'Retry successful'
      });
    } catch (retryError) {
      // Queue for next retry attempt
      this.retryQueue.push({
        error,
        attempt: attempt + 1,
        maxAttempts
      });
    }
  }

  private async retryOperation(error: AppError, attempt: number): Promise<void> {
    // Simulate retry operation
    // In a real implementation, this would retry the actual operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure based on attempt number
    if (attempt >= 2) {
      throw new Error('Retry failed');
    }
  }

  // Error Notification System
  private isCriticalError(error: AppError): boolean {
    const criticalErrorCodes = [
      'SYSTEM_CRASH',
      'DATABASE_CONNECTION_FAILED',
      'SECURITY_VIOLATION',
      'REMOTE_SYSTEM_DOWN'
    ];
    
    return criticalErrorCodes.includes(error.errorCode || '') || 
           (error.statusCode && error.statusCode >= 500);
  }

  private queueNotification(notification: ErrorNotification): void {
    this.notificationQueue.push(notification);
  }

  private async startNotificationProcessor(): Promise<void> {
    while (true) {
      if (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift()!;
        await this.sendNotification(notification);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async sendNotification(notification: ErrorNotification): Promise<void> {
    try {
      // In a real implementation, this would send notifications via email, Slack, etc.
      console.log('📧 Sending notification:', {
        type: notification.type,
        message: notification.message,
        recipients: notification.recipients,
        timestamp: notification.timestamp
      });
      
      this.emit('notificationSent', notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private getNotificationRecipients(): string[] {
    // In a real implementation, this would get recipients from configuration
    return ['admin@example.com', 'tech-support@example.com'];
  }

  // Diagnostic Tools
  generateDiagnosticReport(): {
    totalErrors: number;
    criticalErrors: number;
    resolvedErrors: number;
    retryQueueLength: number;
    notificationQueueLength: number;
    recentErrors: ErrorLog[];
    errorDistribution: Record<string, number>;
  } {
    const errors = Array.from(this.errorLogs.values());
    const criticalErrors = errors.filter(e => this.isCriticalError(e.error)).length;
    const resolvedErrors = errors.filter(e => e.resolved).length;
    
    const errorDistribution: Record<string, number> = {};
    errors.forEach(error => {
      const errorCode = error.error.errorCode || 'UNKNOWN';
      errorDistribution[errorCode] = (errorDistribution[errorCode] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      criticalErrors,
      resolvedErrors,
      retryQueueLength: this.retryQueue.length,
      notificationQueueLength: this.notificationQueue.length,
      recentErrors: errors.slice(-10), // Last 10 errors
      errorDistribution
    };
  }

  // Utility Methods
  private createErrorLog(error: AppError, req: Request): ErrorLog {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      request: {
        url: req.url,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress || '',
        userAgent: req.get('User-Agent') || '',
        userId: (req as any).user?.id
      },
      context: error.context || {},
      resolved: false
    };
  }

  private logError(errorLog: ErrorLog): void {
    const logEntry = {
      timestamp: errorLog.timestamp.toISOString(),
      errorId: errorLog.id,
      message: errorLog.error.message,
      errorCode: errorLog.error.errorCode,
      statusCode: errorLog.error.statusCode,
      url: errorLog.request.url,
      method: errorLog.request.method,
      ip: errorLog.request.ip,
      userAgent: errorLog.request.userAgent,
      userId: errorLog.request.userId,
      context: errorLog.context,
      stack: errorLog.error.stack
    };

    console.error('🚨 Error Log:', logEntry);
    
    // Save to file for persistence
    this.saveErrorToFile(logEntry);
  }

  private saveErrorToFile(logEntry: any): void {
    try {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to save error to file:', error);
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      'REMOTE_CONNECTION_FAILED': 'Unable to connect to remote processing server. Please try again.',
      'FILE_TRANSFER_FAILED': 'File transfer failed. Please check your connection and try again.',
      'QUALITY_ASSESSMENT_FAILED': 'Quality assessment could not be completed. Manual review may be required.',
      'PROCESSING_TIMEOUT': 'Processing took longer than expected. Please try again.',
      'TEMPORARY_NETWORK_ERROR': 'Temporary network issue. Please try again in a moment.',
      'SYSTEM_CRASH': 'System temporarily unavailable. Please try again later.',
      'DATABASE_CONNECTION_FAILED': 'Database connection issue. Please try again.',
      'SECURITY_VIOLATION': 'Security validation failed. Please check your credentials.',
      'REMOTE_SYSTEM_DOWN': 'Remote system is currently unavailable. Please try again later.'
    };

    return userMessages[error.errorCode || ''] || error.message || 'An unexpected error occurred';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Getters for monitoring
  getErrorLogs(): ErrorLog[] {
    return Array.from(this.errorLogs.values());
  }

  getRetryQueueLength(): number {
    return this.retryQueue.length;
  }

  getNotificationQueueLength(): number {
    return this.notificationQueue.length;
  }
}

// Create singleton instance
const errorHandlerService = new ErrorHandlerService();

// Enhanced error handler middleware
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  errorHandlerService.handleError(error, req, res, next);
};

export const createError = (
  message: string, 
  statusCode: number = 500,
  errorCode?: string,
  options: {
    retryable?: boolean;
    fallbackAvailable?: boolean;
    context?: Record<string, any>;
  } = {}
): AppError => {
  const appError = new Error(message) as AppError;
  appError.statusCode = statusCode;
  appError.errorCode = errorCode;
  appError.isOperational = true;
  appError.retryable = options.retryable;
  appError.fallbackAvailable = options.fallbackAvailable;
  appError.context = options.context;
  return appError;
};

// Export service for direct use
export { errorHandlerService };
