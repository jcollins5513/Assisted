'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';

interface RemoteConnection {
  id: string;
  name: string;
  type: 'tailscale' | 'ssh' | 'cloud-tunnel';
  host: string;
  port?: number;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string;
  error?: string;
}

interface ConnectionHealth {
  status: string;
  latency?: number;
}

interface ConnectionManagerProps {
  onConnectionSelect: (connectionId: string | null) => void;
  selectedConnection: string | null;
}

export function ConnectionManager({ onConnectionSelect, selectedConnection }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<RemoteConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'tailscale' as const,
    host: '',
    port: '',
    username: '',
    keyPath: ''
  });

  // Load from backend
  useEffect(() => {
    (async () => {
      const res = await apiClient.get<any>('/remote-execution/connections');
      if (res.success && (res.data as any)?.data) {
        setConnections((res.data as any).data as RemoteConnection[]);
      } else {
        setConnections([]);
      }
      setLoading(false);
    })();
  }, []);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: newConnection.name,
      type: newConnection.type,
      host: newConnection.host,
      port: newConnection.port ? parseInt(newConnection.port) : undefined,
      username: newConnection.username || undefined,
      keyPath: newConnection.keyPath || undefined
    };

    const res = await apiClient.post<any>('/remote-execution/connections', payload);
    if (res.success && (res.data as any)?.data) {
      const created = (res.data as any).data as RemoteConnection;
      setConnections(prev => [...prev, created]);
    }
    setNewConnection({ name: '', type: 'tailscale', host: '', port: '', username: '', keyPath: '' });
    setShowAddForm(false);
  };

  const handleConnect = async (connectionId: string) => {
    setConnections(conns => conns.map(c => c.id === connectionId ? { ...c, status: 'connecting' } as any : c));
    await apiClient.post<any>(`/remote-execution/connections/${connectionId}/connect`, {});
    // Refresh list
    const res = await apiClient.get<any>('/remote-execution/connections');
    if (res.success && (res.data as any)?.data) {
      setConnections((res.data as any).data as RemoteConnection[]);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    await apiClient.post<any>(`/remote-execution/connections/${connectionId}/disconnect`, {});
    const res = await apiClient.get<any>('/remote-execution/connections');
    if (res.success && (res.data as any)?.data) {
      setConnections((res.data as any).data as RemoteConnection[]);
    }
  };

  const handleDelete = async (connectionId: string) => {
    await apiClient.delete<any>(`/remote-execution/connections/${connectionId}`);
    setConnections(conns => conns.filter(c => c.id !== connectionId));
    if (selectedConnection === connectionId) {
      onConnectionSelect(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tailscale': return '🔒';
      case 'ssh': return '🔑';
      case 'cloud-tunnel': return '☁️';
      default: return '🔗';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Remote Connections</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          Add Connection
        </button>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Connection</h3>
          <form onSubmit={handleAddConnection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={newConnection.type}
                  onChange={(e) => setNewConnection({ ...newConnection, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tailscale">Tailscale VPN</option>
                  <option value="ssh">SSH</option>
                  <option value="cloud-tunnel">Cloud Tunnel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port (optional)
                </label>
                <input
                  type="number"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SSH Username (required)
                </label>
                <input
                  type="text"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SSH Private Key Path (required)
                </label>
                <input
                  type="text"
                  value={newConnection.keyPath}
                  onChange={(e) => setNewConnection({ ...newConnection, keyPath: e.target.value })}
                  placeholder={process.platform === 'win32' ? 'C\\\\Users\\you\\.ssh\\id_ed25519' : '/home/you/.ssh/id_ed25519'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Add Connection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connections List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Connections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedConnection === connection.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onConnectionSelect(connection.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(connection.type)}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{connection.name}</h4>
                      <p className="text-sm text-gray-500">{connection.host}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(connection.status)}`}></div>
                    <span className="text-sm text-gray-600 capitalize">{connection.status}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {connection.status === 'connected' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(connection.id);
                      }}
                      className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(connection.id);
                      }}
                      disabled={connection.status === 'connecting'}
                      className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {connection.status === 'connecting' ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(connection.id);
                    }}
                    className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {connection.error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {connection.error}
                </div>
              )}
              {connection.lastConnected && (
                <div className="mt-2 text-sm text-gray-500">
                  Last connected: {new Date(connection.lastConnected).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connection Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Connection Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tailscale VPN provides the most secure and reliable connection</li>
          <li>• SSH connections require proper key authentication setup</li>
          <li>• Cloud tunnels are useful for temporary or public access</li>
          <li>• Always verify connection health before executing scripts</li>
        </ul>
      </div>
    </div>
  );
}
