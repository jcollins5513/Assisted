'use client';

import React, { useState, useEffect } from 'react';

interface ExecutionJob {
  id: string;
  connectionId: string;
  connectionName: string;
  scriptPath: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  output?: string;
  error?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export function ExecutionMonitor() {
  const [executions, setExecutions] = useState<ExecutionJob[]>([]);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockExecutions: ExecutionJob[] = [
      {
        id: '1',
        connectionId: '1',
        connectionName: 'Production Server',
        scriptPath: '/scripts/background-removal.ps1',
        parameters: { InputPath: '/uploads/car1.jpg', Model: 'u2net' },
        status: 'completed',
        progress: 100,
        output: 'Background removal completed successfully',
        startTime: new Date(Date.now() - 300000).toISOString(),
        endTime: new Date(Date.now() - 60000).toISOString(),
        duration: 240
      },
      {
        id: '2',
        connectionId: '1',
        connectionName: 'Production Server',
        scriptPath: '/scripts/system-info.ps1',
        parameters: {},
        status: 'running',
        progress: 65,
        output: 'Collecting system information...',
        startTime: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '3',
        connectionId: '2',
        connectionName: 'Development Server',
        scriptPath: '/scripts/file-operations.ps1',
        parameters: { operation: 'copy', source: '/temp/file.txt' },
        status: 'failed',
        progress: 30,
        error: 'File not found: /temp/file.txt',
        startTime: new Date(Date.now() - 180000).toISOString(),
        endTime: new Date(Date.now() - 150000).toISOString(),
        duration: 30
      },
      {
        id: '4',
        connectionId: '1',
        connectionName: 'Production Server',
        scriptPath: '/scripts/background-removal.ps1',
        parameters: { InputPath: '/uploads/car2.jpg', Model: 'u2net', BatchMode: true },
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString()
      }
    ];

    setExecutions(mockExecutions);
  }, []);

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setExecutions(prev => 
        prev.map(execution => {
          if (execution.status === 'running') {
            const newProgress = Math.min(100, execution.progress + Math.random() * 10);
            const newStatus = newProgress >= 100 ? 'completed' : 'running';
            return {
              ...execution,
              progress: newProgress,
              status: newStatus,
              endTime: newStatus === 'completed' ? new Date().toISOString() : undefined,
              duration: newStatus === 'completed' ? 
                Math.floor((Date.now() - new Date(execution.startTime).getTime()) / 1000) : undefined
            };
          }
          return execution;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredExecutions = executions.filter(execution => {
    if (filter === 'all') return true;
    return execution.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'stopped': return 'text-gray-600 bg-gray-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '⏳';
      case 'failed': return '❌';
      case 'stopped': return '⏹️';
      default: return '⏸️';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stopExecution = (executionId: string) => {
    setExecutions(prev => 
      prev.map(execution => 
        execution.id === executionId 
          ? { 
              ...execution, 
              status: 'stopped' as const,
              endTime: new Date().toISOString(),
              duration: Math.floor((Date.now() - new Date(execution.startTime).getTime()) / 1000)
            }
          : execution
      )
    );
  };

  const clearCompleted = () => {
    setExecutions(prev => prev.filter(execution => execution.status === 'running' || execution.status === 'pending'));
  };

  const getExecutionStats = () => {
    const total = executions.length;
    const running = executions.filter(e => e.status === 'running').length;
    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const pending = executions.filter(e => e.status === 'pending').length;

    return { total, running, completed, failed, pending };
  };

  const stats = getExecutionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Execution Monitor</h2>
          <p className="text-sm text-gray-600">
            Monitor and manage script executions in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={clearCompleted}
            className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Clear Completed
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          <div className="text-sm text-gray-600">Running</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'running', 'completed', 'failed'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === filterOption
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Executions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredExecutions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No executions found matching the current filter.
            </div>
          ) : (
            filteredExecutions.map((execution) => (
              <div key={execution.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{getStatusIcon(execution.status)}</div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {execution.scriptPath.split('/').pop()}
                      </h4>
                      <p className="text-sm text-gray-600">{execution.connectionName}</p>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(execution.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    {execution.status === 'running' && (
                      <button
                        onClick={() => stopExecution(execution.id)}
                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {execution.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(execution.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${execution.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Parameters */}
                {Object.keys(execution.parameters).length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Parameters</h5>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <pre className="text-gray-800">{JSON.stringify(execution.parameters, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Output/Error */}
                {(execution.output || execution.error) && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">
                      {execution.error ? 'Error' : 'Output'}
                    </h5>
                    <div className={`p-3 rounded text-xs ${
                      execution.error ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-800'
                    }`}>
                      <pre className="whitespace-pre-wrap">{execution.error || execution.output}</pre>
                    </div>
                  </div>
                )}

                {/* Duration */}
                {execution.duration && (
                  <div className="text-xs text-gray-500">
                    Duration: {formatDuration(execution.duration)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Updates Notice */}
      {autoRefresh && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-800">Real-time updates enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}
