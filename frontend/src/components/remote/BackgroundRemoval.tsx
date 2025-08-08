'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/services/api';

interface BackgroundRemovalProps {
  selectedConnection: string | null;
  onConnectionSelect: (connectionId: string | null) => void;
}

interface ProcessingJob {
  id: string;
  inputPath: string;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export function BackgroundRemoval({ selectedConnection, onConnectionSelect }: BackgroundRemovalProps) {
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [connections, setConnections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingSettings, setProcessingSettings] = useState({
    model: 'u2net',
    quality: 95,
    batchMode: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await apiClient.get<any>('/remote-execution/connections');
      if (res.success && (res.data as any)?.data) {
        const list = ((res.data as any).data as any[]).map(c => ({ id: c.id, name: c.name }));
        setConnections(list);
      }
    })();
  }, []);

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

  const startProcessing = async () => {
    if (!selectedConnection) {
      alert('Please select a remote connection first');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please select files to process');
      return;
    }

    setIsProcessing(true);

    try {
      // Upload files to server
      const uploadedPaths: string[] = [];
      for (const file of selectedFiles) {
        const res = await apiClient.upload<any>('/uploads/image', file);
        if (!res.success) throw new Error(res.error || 'Upload failed');
        const filePath = res.data?.file?.path || res.data?.path || '';
        if (!filePath) throw new Error('Upload response missing file path');
        uploadedPaths.push(filePath);
      }

      // Create processing jobs
      const newJobs: ProcessingJob[] = uploadedPaths.map((p, idx) => ({
        id: `job-${Date.now()}-${idx}`,
        inputPath: p,
        outputPath: '',
        status: 'pending',
        progress: 0,
        startTime: new Date().toISOString()
      }));
      setProcessingJobs(prev => [...prev, ...newJobs]);

      // Fetch user preferences for remote paths
      const prefsRes = await apiClient.get<any>('/users/profile');
      const rp = prefsRes.success ? prefsRes.data?.user?.preferences?.remoteProcessing : undefined;
      const remoteScriptPath = rp?.remoteScriptPath || 'C\\\\\u005CTools\\\\\u005Cbackgroundremover-cli.ps1';
      const remoteInputDir = rp?.remoteInputDir || 'C\\\\\u005Cprocessing\\\\\u005Cin';
      const remoteOutputDir = rp?.remoteOutputDir || 'C\\\\\u005Cprocessing\\\\\u005Cout';
      const defaultModel = rp?.defaultModel || processingSettings.model;

      // Batch mode by copying a folder: use the server upload folder as input parent
      // For simplicity here, we treat as folder if >1 file
      const isBatch = uploadedPaths.length > 1;
      const inputPath = isBatch ? uploadedPaths[0].replace(/[^\\/]*$/, '') : uploadedPaths[0];

      // Kick off remote execution
      const startRes = await apiClient.post<any>('/remote-execution/background-removal', {
        connectionId: selectedConnection,
        engine: 'backgroundremover',
        inputPath,
        model: defaultModel,
        batchMode: isBatch,
        alphaMatting: true,
        remoteScriptPath,
        remoteInputDir,
        remoteOutputDir
      });
      if (!startRes.success) throw new Error(startRes.error || 'Failed to start background removal');

      // Simulate progress while remote runs
      for (const job of newJobs) {
        await simulateProcessing(job.id);
      }

      // Finalize: copy results back
      const finalizeRes = await apiClient.post<any>('/remote-execution/background-removal/finalize', {
        connectionId: selectedConnection,
        remoteOutputDir
      });
      if (!finalizeRes.success) throw new Error(finalizeRes.error || 'Failed to finalize');

      const files: Array<{ file: string; url: string }> = finalizeRes.data?.data?.files || finalizeRes.data?.files || [];

      // Update jobs with output paths
      setProcessingJobs(prev => prev.map(j => {
        const match = files.find(f => f.file.toLowerCase().includes(j.inputPath.split(/[/\\]/).pop()?.split('.')[0].toLowerCase() || ''));
        return match ? { ...j, status: 'completed', progress: 100, endTime: new Date().toISOString(), outputPath: match.url } : j;
      }));
    } catch (err: any) {
      // Mark all current jobs as failed
      setProcessingJobs(prev => prev.map(j => ({ ...j, status: 'failed', error: err?.message || 'Processing failed' })));
      alert(err?.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
      setSelectedFiles([]);
    }
  };

  const simulateProcessing = async (jobId: string) => {
    // Update job status to processing
    setProcessingJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'processing' as const }
          : job
      )
    );

    // Simulate progress updates
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, progress }
            : job
        )
      );
    }

    // Complete the job
    setProcessingJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed' as const, 
              progress: 100,
              endTime: new Date().toISOString()
            }
          : job
      )
    );
  };

  const removeJob = (jobId: string) => {
    setProcessingJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const downloadResult = (job: ProcessingJob) => {
    // In a real implementation, this would download the processed file
    alert(`Downloading: ${job.outputPath}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Background Removal</h2>
          <p className="text-sm text-gray-600">
            Remove backgrounds from images using AI processing on remote servers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-700">Connection:</label>
          <select
            value={selectedConnection || ''}
            onChange={(e) => onConnectionSelect(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select connection…</option>
            {connections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Connection Selection Notice */}
      {!selectedConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Select a connection above to enable processing.
        </div>
      )}

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h3>
        
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, BMP, TIFF files
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
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
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Processing Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Model
            </label>
            <select
              value={processingSettings.model}
              onChange={(e) => setProcessingSettings({ ...processingSettings, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="u2net">U²-Net (Recommended)</option>
              <option value="u2netp">U²-Net (Lightweight)</option>
              <option value="u2net_human_seg">U²-Net (Human Segmentation)</option>
              <option value="silueta">Silueta</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={processingSettings.quality}
              onChange={(e) => setProcessingSettings({ ...processingSettings, quality: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span>{processingSettings.quality}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="batchMode"
              checked={processingSettings.batchMode}
              onChange={(e) => setProcessingSettings({ ...processingSettings, batchMode: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="batchMode" className="text-sm font-medium text-gray-700">
              Batch Mode
            </label>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={startProcessing}
          disabled={!selectedConnection || selectedFiles.length === 0 || isProcessing}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Start Background Removal'}
        </button>
      </div>

      {/* Processing Jobs */}
      {processingJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Processing Jobs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {processingJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(job.status)}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {job.inputPath.split('/').pop()}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(job.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    {job.status === 'completed' && (
                      <button
                        onClick={() => downloadResult(job)}
                        className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => removeJob(job.id)}
                      className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {job.status === 'processing' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {job.error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Background Removal Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• U²-Net provides the best overall results for most images</li>
          <li>• Higher quality settings produce better results but take longer</li>
          <li>• Batch mode is efficient for processing multiple images</li>
          <li>• Ensure your remote server has sufficient processing power</li>
        </ul>
      </div>
    </div>
  );
}
  