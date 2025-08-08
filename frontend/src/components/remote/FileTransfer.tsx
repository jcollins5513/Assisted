'use client';

import React, { useState, useEffect } from 'react';

interface FileTransferProps {
  connectionId: string | null;
  onTransferComplete?: (transferId: string) => void;
}

interface TransferItem {
  id: string;
  fileName: string;
  type: 'upload' | 'download';
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size: number;
  transferred: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export function FileTransfer({ connectionId, onTransferComplete }: FileTransferProps) {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [transferSettings, setTransferSettings] = useState({
    chunkSize: 1024 * 1024, // 1MB
    retryAttempts: 3,
    validateChecksum: true,
    overwrite: false
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStats, setTransferStats] = useState({
    total: 0,
    pending: 0,
    transferring: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  });

  useEffect(() => {
    updateTransferStats();
  }, [transfers]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const startTransfer = async (type: 'upload' | 'download') => {
    if (!connectionId) {
      alert('Please select a connection first');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please select files to transfer');
      return;
    }

    setIsTransferring(true);

    // Create transfer items for each file
    const newTransfers: TransferItem[] = selectedFiles.map((file, index) => ({
      id: `transfer-${Date.now()}-${index}`,
      fileName: file.name,
      type,
      status: 'pending',
      progress: 0,
      size: file.size,
      transferred: 0,
      startTime: new Date(),
      retryCount: 0,
      maxRetries: transferSettings.retryAttempts
    }));

    setTransfers(prev => [...prev, ...newTransfers]);

    // Simulate transfers
    for (const transfer of newTransfers) {
      await simulateTransfer(transfer.id);
    }

    setIsTransferring(false);
    setSelectedFiles([]);
  };

  const simulateTransfer = async (transferId: string) => {
    // Update transfer status to transferring
    setTransfers(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: 'transferring' as const }
          : transfer
      )
    );

    // Simulate progress updates
    for (let progress = 0; progress <= 100; progress += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setTransfers(prev => 
        prev.map(transfer => 
          transfer.id === transferId 
            ? { 
                ...transfer, 
                progress,
                transferred: Math.round((transfer.size * progress) / 100)
              }
            : transfer
        )
      );
    }

    // Complete the transfer
    setTransfers(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { 
              ...transfer, 
              status: 'completed' as const, 
              progress: 100,
              transferred: transfer.size,
              endTime: new Date()
            }
          : transfer
      )
    );

    // Notify completion
    if (onTransferComplete) {
      onTransferComplete(transferId);
    }
  };

  const cancelTransfer = (transferId: string) => {
    setTransfers(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: 'cancelled' as const, endTime: new Date() }
          : transfer
      )
    );
  };

  const retryTransfer = (transferId: string) => {
    setTransfers(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { 
              ...transfer, 
              status: 'pending' as const,
              progress: 0,
              transferred: 0,
              retryCount: transfer.retryCount + 1,
              error: undefined
            }
          : transfer
      )
    );

    // Restart the transfer
    simulateTransfer(transferId);
  };

  const removeTransfer = (transferId: string) => {
    setTransfers(prev => prev.filter(transfer => transfer.id !== transferId));
  };

  const updateTransferStats = () => {
    const stats = {
      total: transfers.length,
      pending: transfers.filter(t => t.status === 'pending').length,
      transferring: transfers.filter(t => t.status === 'transferring').length,
      completed: transfers.filter(t => t.status === 'completed').length,
      failed: transfers.filter(t => t.status === 'failed').length,
      cancelled: transfers.filter(t => t.status === 'cancelled').length
    };
    setTransferStats(stats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'transferring': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'transferring': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '⏸️';
      default: return '⏳';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">File Transfer</h2>
          <p className="text-sm text-gray-600">
            Transfer files to and from remote servers securely
          </p>
        </div>
        {!connectionId && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            ⚠️ Please select a connection first
          </div>
        )}
      </div>

      {/* Transfer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{transferStats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{transferStats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{transferStats.transferring}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{transferStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{transferStats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{transferStats.cancelled}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>

      {/* File Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Files</h3>
        
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports all file types
              </p>
            </div>
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Select Files
            </button>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chunk Size
            </label>
            <select
              value={transferSettings.chunkSize}
              onChange={(e) => setTransferSettings({ ...transferSettings, chunkSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={512 * 1024}>512 KB</option>
              <option value={1024 * 1024}>1 MB</option>
              <option value={2 * 1024 * 1024}>2 MB</option>
              <option value={5 * 1024 * 1024}>5 MB</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retry Attempts
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={transferSettings.retryAttempts}
              onChange={(e) => setTransferSettings({ ...transferSettings, retryAttempts: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={transferSettings.validateChecksum}
                onChange={(e) => setTransferSettings({ ...transferSettings, validateChecksum: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Validate Checksum</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={transferSettings.overwrite}
                onChange={(e) => setTransferSettings({ ...transferSettings, overwrite: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Overwrite</span>
            </label>
          </div>
        </div>
      </div>

      {/* Transfer Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => startTransfer('upload')}
          disabled={!connectionId || selectedFiles.length === 0 || isTransferring}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransferring ? 'Uploading...' : 'Upload Files'}
        </button>
        <button
          onClick={() => startTransfer('download')}
          disabled={!connectionId || selectedFiles.length === 0 || isTransferring}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransferring ? 'Downloading...' : 'Download Files'}
        </button>
      </div>

      {/* Transfer Queue */}
      {transfers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transfer Queue</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(transfer.status)}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {transfer.fileName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {transfer.type === 'upload' ? '📤 Upload' : '📥 Download'} • 
                        Started: {transfer.startTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                    {transfer.status === 'transferring' && (
                      <button
                        onClick={() => cancelTransfer(transfer.id)}
                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {transfer.status === 'failed' && (
                      <button
                        onClick={() => retryTransfer(transfer.id)}
                        className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => removeTransfer(transfer.id)}
                      className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {transfer.status === 'transferring' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{transfer.progress}% • {formatFileSize(transfer.transferred)} / {formatFileSize(transfer.size)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${transfer.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {transfer.error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {transfer.error}
                  </div>
                )}
                
                {transfer.retryCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Retry attempts: {transfer.retryCount}/{transfer.maxRetries}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">File Transfer Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Larger chunk sizes may improve transfer speed but use more memory</li>
          <li>• Checksum validation ensures file integrity but adds processing time</li>
          <li>• Failed transfers can be retried automatically or manually</li>
          <li>• Transfer progress is saved and can be resumed if interrupted</li>
        </ul>
      </div>
    </div>
  );
}
