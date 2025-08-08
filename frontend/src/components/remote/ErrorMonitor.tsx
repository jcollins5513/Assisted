'use client';

import React, { useState, useEffect } from 'react';

interface ErrorMonitorProps {
  connectionId?: string;
  onErrorResolved?: (errorId: string) => void;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    errorCode?: string;
    statusCode?: number;
    retryable?: boolean;
    fallbackAvailable?: boolean;
  };
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

interface DiagnosticReport {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  retryQueueLength: number;
  notificationQueueLength: number;
  recentErrors: ErrorLog[];
  errorDistribution: Record<string, number>;
}

export function ErrorMonitor({ connectionId, onErrorResolved }: ErrorMonitorProps) {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport>({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    retryQueueLength: 0,
    notificationQueueLength: 0,
    recentErrors: [],
    errorDistribution: {}
  });
  const [filterSettings, setFilterSettings] = useState({
    showResolved: false,
    showCritical: true,
    showRetryable: true,
    timeRange: '24h' as '1h' | '24h' | '7d' | '30d'
  });

  useEffect(() => {
    // Load sample error logs
    loadSampleErrorLogs();
  }, []);

  useEffect(() => {
    updateDiagnosticReport();
  }, [errorLogs]);

  const loadSampleErrorLogs = () => {
    const sampleErrors: ErrorLog[] = [
      {
        id: 'error-1',
        timestamp: new Date(Date.now() - 3600000),
        error: {
          message: 'Remote connection failed',
          errorCode: 'REMOTE_CONNECTION_FAILED',
          statusCode: 503,
          retryable: true,
          fallbackAvailable: true
        },
        request: {
          url: '/api/remote-execution/connect',
          method: 'POST',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-123'
        },
        context: {
          connectionId: 'conn-1',
          retryAttempts: 2
        },
        resolved: false
      },
      {
        id: 'error-2',
        timestamp: new Date(Date.now() - 7200000),
        error: {
          message: 'File transfer timeout',
          errorCode: 'FILE_TRANSFER_FAILED',
          statusCode: 408,
          retryable: true,
          fallbackAvailable: true
        },
        request: {
          url: '/api/file-transfer/upload',
          method: 'POST',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-123'
        },
        context: {
          fileName: 'car-image.jpg',
          fileSize: 2048576,
          transferId: 'transfer-1'
        },
        resolved: true,
        resolution: 'Retry successful on attempt 3'
      },
      {
        id: 'error-3',
        timestamp: new Date(Date.now() - 10800000),
        error: {
          message: 'Quality assessment failed',
          errorCode: 'QUALITY_ASSESSMENT_FAILED',
          statusCode: 500,
          retryable: false,
          fallbackAvailable: true
        },
        request: {
          url: '/api/quality-assessment/assess',
          method: 'POST',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-123'
        },
        context: {
          imagePath: '/processed/car-1.png',
          assessmentId: 'assessment-1'
        },
        resolved: true,
        resolution: 'Fallback to manual review'
      },
      {
        id: 'error-4',
        timestamp: new Date(Date.now() - 14400000),
        error: {
          message: 'System crash detected',
          errorCode: 'SYSTEM_CRASH',
          statusCode: 500,
          retryable: false,
          fallbackAvailable: false
        },
        request: {
          url: '/api/remote-execution/process',
          method: 'POST',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          userId: 'user-123'
        },
        context: {
          processId: 'proc-1',
          memoryUsage: '85%',
          cpuUsage: '92%'
        },
        resolved: false
      }
    ];

    setErrorLogs(sampleErrors);
  };

  const updateDiagnosticReport = () => {
    const criticalErrors = errorLogs.filter(e => isCriticalError(e.error)).length;
    const resolvedErrors = errorLogs.filter(e => e.resolved).length;
    
    const errorDistribution: Record<string, number> = {};
    errorLogs.forEach(error => {
      const errorCode = error.error.errorCode || 'UNKNOWN';
      errorDistribution[errorCode] = (errorDistribution[errorCode] || 0) + 1;
    });

    const report: DiagnosticReport = {
      totalErrors: errorLogs.length,
      criticalErrors,
      resolvedErrors,
      retryQueueLength: Math.floor(Math.random() * 5), // Simulated
      notificationQueueLength: Math.floor(Math.random() * 3), // Simulated
      recentErrors: errorLogs.slice(-10),
      errorDistribution
    };

    setDiagnosticReport(report);
  };

  const isCriticalError = (error: any): boolean => {
    const criticalErrorCodes = [
      'SYSTEM_CRASH',
      'DATABASE_CONNECTION_FAILED',
      'SECURITY_VIOLATION',
      'REMOTE_SYSTEM_DOWN'
    ];
    
    return criticalErrorCodes.includes(error.errorCode || '') || 
           (error.statusCode && error.statusCode >= 500);
  };

  const handleErrorSelect = (error: ErrorLog) => {
    setSelectedError(error);
  };

  const handleResolveError = (errorId: string) => {
    setErrorLogs(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, resolved: true, resolution: 'Manually resolved by user' }
          : error
      )
    );

    if (onErrorResolved) {
      onErrorResolved(errorId);
    }
  };

  const handleRetryError = (errorId: string) => {
    // Simulate retry
    setErrorLogs(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { 
              ...error, 
              context: { 
                ...error.context, 
                retryAttempts: (error.context.retryAttempts || 0) + 1 
              }
            }
          : error
      )
    );
  };

  const getErrorSeverity = (error: any) => {
    if (isCriticalError(error)) return 'critical';
    if (error.statusCode && error.statusCode >= 500) return 'high';
    if (error.statusCode && error.statusCode >= 400) return 'medium';
    return 'low';
  };

  const getErrorColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredErrors = errorLogs.filter(error => {
    if (!filterSettings.showResolved && error.resolved) return false;
    if (!filterSettings.showCritical && isCriticalError(error.error)) return false;
    if (!filterSettings.showRetryable && error.error.retryable) return false;
    
    // Time range filter
    const errorTime = error.timestamp.getTime();
    const now = Date.now();
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    };
    
    return (now - errorTime) <= timeRanges[filterSettings.timeRange];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Error Monitor</h2>
          <p className="text-sm text-gray-600">
            Monitor and manage system errors and recovery procedures
          </p>
        </div>
      </div>

      {/* Diagnostic Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{diagnosticReport.totalErrors}</div>
          <div className="text-sm text-gray-600">Total Errors</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{diagnosticReport.criticalErrors}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{diagnosticReport.resolvedErrors}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{diagnosticReport.retryQueueLength}</div>
          <div className="text-sm text-gray-600">Retry Queue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{diagnosticReport.notificationQueueLength}</div>
          <div className="text-sm text-gray-600">Notifications</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {diagnosticReport.totalErrors > 0 
              ? Math.round((diagnosticReport.resolvedErrors / diagnosticReport.totalErrors) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-600">Resolution Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {diagnosticReport.totalErrors > 0 
              ? Math.round((diagnosticReport.criticalErrors / diagnosticReport.totalErrors) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-600">Critical Rate</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterSettings.showResolved}
              onChange={(e) => setFilterSettings({ ...filterSettings, showResolved: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Show Resolved</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterSettings.showCritical}
              onChange={(e) => setFilterSettings({ ...filterSettings, showCritical: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Show Critical</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterSettings.showRetryable}
              onChange={(e) => setFilterSettings({ ...filterSettings, showRetryable: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Show Retryable</span>
          </label>
          <select
            value={filterSettings.timeRange}
            onChange={(e) => setFilterSettings({ ...filterSettings, timeRange: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Error Logs ({filteredErrors.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredErrors.map((error) => {
              const severity = getErrorSeverity(error.error);
              return (
                <div 
                  key={error.id} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedError?.id === error.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleErrorSelect(error)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getErrorIcon(severity)}</span>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {error.error.message}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {error.error.errorCode} • {formatTimestamp(error.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getErrorColor(severity)}`}>
                        {severity.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {error.resolved ? 'Resolved' : 'Active'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {error.error.retryable && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Retryable
                      </span>
                    )}
                    {error.error.fallbackAvailable && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Fallback Available
                      </span>
                    )}
                    {error.context.retryAttempts > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Retries: {error.context.retryAttempts}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Details */}
        {selectedError && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Error Details</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Error Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Error Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="text-gray-900">{selectedError.error.message}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Code:</span>
                    <span className="text-gray-900">{selectedError.error.errorCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Code:</span>
                    <span className="text-gray-900">{selectedError.error.statusCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retryable:</span>
                    <span className="text-gray-900">{selectedError.error.retryable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fallback Available:</span>
                    <span className="text-gray-900">{selectedError.error.fallbackAvailable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="text-gray-900">{selectedError.resolved ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Request Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">URL:</span>
                    <span className="text-gray-900">{selectedError.request.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="text-gray-900">{selectedError.request.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="text-gray-900">{selectedError.request.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="text-gray-900">{selectedError.request.userId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Context Information */}
              {Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Context Information</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedError.context).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Information */}
              {selectedError.resolution && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Resolution</h4>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">{selectedError.resolution}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedError.resolved && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Actions</h4>
                  <div className="flex space-x-2">
                    {selectedError.error.retryable && (
                      <button
                        onClick={() => handleRetryError(selectedError.id)}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleResolveError(selectedError.id)}
                      className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Error Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(diagnosticReport.errorDistribution).map(([errorCode, count]) => (
            <div key={errorCode} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{errorCode}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Error Monitoring Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Critical errors require immediate attention and may need manual intervention</li>
          <li>• Retryable errors will be automatically retried with exponential backoff</li>
          <li>• Use fallback mechanisms when available to maintain system functionality</li>
          <li>• Monitor error patterns to identify systemic issues</li>
        </ul>
      </div>
    </div>
  );
}
