'use client';

import React, { useState } from 'react';

interface ScriptExecutorProps {
  selectedConnection: string | null;
  onConnectionSelect: (connectionId: string | null) => void;
}

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  scriptPath: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    defaultValue?: any;
    description: string;
  }>;
}

export function ScriptExecutor({ selectedConnection, onConnectionSelect }: ScriptExecutorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');

  const scriptTemplates: ScriptTemplate[] = [
    {
      id: 'system-info',
      name: 'System Information',
      description: 'Get detailed system information from the remote server',
      scriptPath: '/scripts/system-info.ps1',
      parameters: []
    },
    {
      id: 'file-operations',
      name: 'File Operations',
      description: 'Perform file operations on the remote server',
      scriptPath: '/scripts/file-operations.ps1',
      parameters: [
        {
          name: 'operation',
          type: 'string',
          required: true,
          description: 'Operation to perform (copy, move, delete)'
        },
        {
          name: 'source',
          type: 'string',
          required: true,
          description: 'Source file or directory path'
        },
        {
          name: 'destination',
          type: 'string',
          required: false,
          description: 'Destination path (for copy/move operations)'
        }
      ]
    },
    {
      id: 'process-management',
      name: 'Process Management',
      description: 'Manage running processes on the remote server',
      scriptPath: '/scripts/process-management.ps1',
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Action to perform (list, stop, start)'
        },
        {
          name: 'processName',
          type: 'string',
          required: false,
          description: 'Process name or ID'
        }
      ]
    },
    {
      id: 'custom-script',
      name: 'Custom Script',
      description: 'Execute a custom PowerShell script',
      scriptPath: '',
      parameters: [
        {
          name: 'scriptPath',
          type: 'string',
          required: true,
          description: 'Path to the custom script'
        },
        {
          name: 'arguments',
          type: 'string',
          required: false,
          description: 'Script arguments (space-separated)'
        }
      ]
    }
  ];

  const handleTemplateSelect = (template: ScriptTemplate) => {
    setSelectedTemplate(template);
    setParameters({});
    setExecutionResult('');
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const executeScript = async () => {
    if (!selectedConnection) {
      alert('Please select a remote connection first');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select a script template');
      return;
    }

    // Validate required parameters
    const missingParams = selectedTemplate.parameters
      .filter(param => param.required && !parameters[param.name])
      .map(param => param.name);

    if (missingParams.length > 0) {
      alert(`Missing required parameters: ${missingParams.join(', ')}`);
      return;
    }

    setIsExecuting(true);
    setExecutionResult('');

    try {
      // Simulate script execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock execution result
      const result = `Script executed successfully on ${new Date().toLocaleString()}\n\n` +
        `Template: ${selectedTemplate.name}\n` +
        `Parameters: ${JSON.stringify(parameters, null, 2)}\n\n` +
        `Output:\n` +
        `[INFO] Script started\n` +
        `[INFO] Processing parameters...\n` +
        `[INFO] Executing script: ${selectedTemplate.scriptPath || 'Custom script'}\n` +
        `[SUCCESS] Script completed successfully\n` +
        `[INFO] Execution time: 2.5 seconds`;

      setExecutionResult(result);
    } catch (error) {
      setExecutionResult(`Error executing script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setParameters({});
    setExecutionResult('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Script Execution</h2>
          <p className="text-sm text-gray-600">
            Execute PowerShell scripts on remote servers securely
          </p>
        </div>
        {!selectedConnection && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            ⚠️ Please select a remote connection first
          </div>
        )}
      </div>

      {/* Connection Selection */}
      {!selectedConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">No Connection Selected</h3>
          <p className="text-sm text-yellow-700 mb-3">
            You need to select a remote connection to execute scripts. Go to the Connections tab to set up a connection.
          </p>
          <button
            onClick={() => onConnectionSelect('1')}
            className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
          >
            Use Demo Connection
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Templates */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Script Templates</h3>
          
          <div className="space-y-3">
            {scriptTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {template.parameters.length} parameter(s)
                    </p>
                  </div>
                  <div className="text-2xl">⚡</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Script Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Script Configuration</h3>
          
          {selectedTemplate ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>

              {selectedTemplate.parameters.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Parameters</h5>
                  {selectedTemplate.parameters.map((param) => (
                    <div key={param.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {param.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={parameters[param.name] || false}
                          onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                          className="mr-2"
                        />
                      ) : param.type === 'number' ? (
                        <input
                          type="number"
                          value={parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={param.description}
                        />
                      ) : (
                        <input
                          type="text"
                          value={parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={param.description}
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={executeScript}
                  disabled={!selectedConnection || isExecuting}
                  className="btn btn-success"
                >
                  {isExecuting ? 'Executing...' : 'Execute Script'}
                </button>
                <button
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-600">Select a script template to configure and execute</p>
            </div>
          )}
        </div>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Execution Results</h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {executionResult}
            </pre>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-900 mb-2">⚠️ Security Notice</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Only execute scripts from trusted sources</li>
          <li>• Verify script contents before execution</li>
          <li>• Monitor script execution for unexpected behavior</li>
          <li>• Use appropriate permissions and access controls</li>
        </ul>
      </div>
    </div>
  );
}
