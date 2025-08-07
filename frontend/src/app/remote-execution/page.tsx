'use client';

import React, { useState, useEffect } from 'react';
import { ConnectionManager } from '@/components/remote/ConnectionManager';
import { ScriptExecutor } from '@/components/remote/ScriptExecutor';
import { ExecutionMonitor } from '@/components/remote/ExecutionMonitor';
import { BackgroundRemoval } from '@/components/remote/BackgroundRemoval';

export default function RemoteExecutionPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'scripts' | 'monitor' | 'background-removal'>('connections');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  const tabs = [
    { id: 'connections', label: 'Connections', icon: '🔗' },
    { id: 'scripts', label: 'Script Execution', icon: '⚡' },
    { id: 'monitor', label: 'Execution Monitor', icon: '📊' },
    { id: 'background-removal', label: 'Background Removal', icon: '🎨' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Remote Execution System
              </h1>
              <p className="text-sm text-gray-600">
                Manage remote connections and execute scripts securely
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'connections' && (
          <ConnectionManager 
            onConnectionSelect={setSelectedConnection}
            selectedConnection={selectedConnection}
          />
        )}
        
        {activeTab === 'scripts' && (
          <ScriptExecutor 
            selectedConnection={selectedConnection}
            onConnectionSelect={setSelectedConnection}
          />
        )}
        
        {activeTab === 'monitor' && (
          <ExecutionMonitor />
        )}
        
        {activeTab === 'background-removal' && (
          <BackgroundRemoval 
            selectedConnection={selectedConnection}
            onConnectionSelect={setSelectedConnection}
          />
        )}
      </div>
    </div>
  );
}
