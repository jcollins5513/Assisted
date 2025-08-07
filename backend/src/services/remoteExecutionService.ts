import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface RemoteConnection {
  id: string;
  name: string;
  type: 'tailscale' | 'ssh' | 'cloud-tunnel';
  host: string;
  port?: number;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: Date;
  error?: string;
}

export interface ScriptExecution {
  id: string;
  connectionId: string;
  scriptPath: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  output?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export class RemoteExecutionService extends EventEmitter {
  private connections: Map<string, RemoteConnection> = new Map();
  private executions: Map<string, ScriptExecution> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  constructor() {
    super();
    this.loadConnections();
  }

  // Connection Management
  async addConnection(connection: Omit<RemoteConnection, 'id' | 'status'>): Promise<string> {
    const id = this.generateId();
    const newConnection: RemoteConnection = {
      ...connection,
      id,
      status: 'disconnected'
    };

    this.connections.set(id, newConnection);
    await this.saveConnections();
    this.emit('connectionAdded', newConnection);
    return id;
  }

  async connect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    try {
      connection.status = 'connecting';
      this.emit('connectionStatusChanged', connection);

      switch (connection.type) {
        case 'tailscale':
          await this.connectTailscale(connection);
          break;
        case 'ssh':
          await this.connectSSH(connection);
          break;
        case 'cloud-tunnel':
          await this.connectCloudTunnel(connection);
          break;
      }

      connection.status = 'connected';
      connection.lastConnected = new Date();
      this.emit('connectionStatusChanged', connection);
      return true;
    } catch (error) {
      connection.status = 'error';
      connection.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('connectionStatusChanged', connection);
      throw error;
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Kill any running processes for this connection
    for (const [executionId, execution] of this.executions) {
      if (execution.connectionId === connectionId && execution.status === 'running') {
        await this.stopExecution(executionId);
      }
    }

    connection.status = 'disconnected';
    this.emit('connectionStatusChanged', connection);
  }

  // Script Execution
  async executeScript(
    connectionId: string,
    scriptPath: string,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status !== 'connected') {
      throw new Error('Connection not established');
    }

    const executionId = this.generateId();
    const execution: ScriptExecution = {
      id: executionId,
      connectionId,
      scriptPath,
      parameters,
      status: 'pending',
      progress: 0
    };

    this.executions.set(executionId, execution);
    this.emit('executionStarted', execution);

    try {
      execution.status = 'running';
      execution.startTime = new Date();
      this.emit('executionStatusChanged', execution);

      const result = await this.runScript(connection, scriptPath, parameters, executionId);
      
      execution.status = 'completed';
      execution.progress = 100;
      execution.output = result;
      execution.endTime = new Date();
      this.emit('executionCompleted', execution);

      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
      this.emit('executionFailed', execution);
      throw error;
    }
  }

  async stopExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const process = this.processes.get(executionId);
    if (process) {
      process.kill();
      this.processes.delete(executionId);
    }

    execution.status = 'failed';
    execution.error = 'Execution stopped by user';
    execution.endTime = new Date();
    this.emit('executionStatusChanged', execution);
  }

  // Connection Methods
  private async connectTailscale(connection: RemoteConnection): Promise<void> {
    // Simulate Tailscale connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would:
    // 1. Check if Tailscale is installed
    // 2. Authenticate with Tailscale
    // 3. Connect to the specific node
    // 4. Verify connectivity
  }

  private async connectSSH(connection: RemoteConnection): Promise<void> {
    // Simulate SSH connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation, you would:
    // 1. Establish SSH connection
    // 2. Authenticate with key or password
    // 3. Verify connection is stable
  }

  private async connectCloudTunnel(connection: RemoteConnection): Promise<void> {
    // Simulate cloud tunnel connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In a real implementation, you would:
    // 1. Establish tunnel connection
    // 2. Verify tunnel is active
    // 3. Test connectivity
  }

  // Script Execution
  private async runScript(
    connection: RemoteConnection,
    scriptPath: string,
    parameters: Record<string, any>,
    executionId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = this.buildScriptArguments(scriptPath, parameters);
      const process = spawn('powershell.exe', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(executionId, process);

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
        this.updateExecutionProgress(executionId, output.length);
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        this.processes.delete(executionId);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Script failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        this.processes.delete(executionId);
        reject(error);
      });
    });
  }

  private buildScriptArguments(scriptPath: string, parameters: Record<string, any>): string[] {
    const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath];
    
    for (const [key, value] of Object.entries(parameters)) {
      args.push(`-${key}`, value.toString());
    }
    
    return args;
  }

  private updateExecutionProgress(executionId: string, outputLength: number): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      // Simple progress calculation based on output length
      execution.progress = Math.min(95, Math.floor(outputLength / 100));
      this.emit('executionProgress', execution);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async loadConnections(): Promise<void> {
    try {
      const connectionsPath = path.join(__dirname, '../data/connections.json');
      if (fs.existsSync(connectionsPath)) {
        const data = fs.readFileSync(connectionsPath, 'utf8');
        const connections = JSON.parse(data);
        connections.forEach((conn: RemoteConnection) => {
          this.connections.set(conn.id, conn);
        });
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  }

  private async saveConnections(): Promise<void> {
    try {
      const connectionsPath = path.join(__dirname, '../data');
      if (!fs.existsSync(connectionsPath)) {
        fs.mkdirSync(connectionsPath, { recursive: true });
      }

      const connections = Array.from(this.connections.values());
      fs.writeFileSync(
        path.join(connectionsPath, 'connections.json'),
        JSON.stringify(connections, null, 2)
      );
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  }

  // Getters
  getConnections(): RemoteConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(id: string): RemoteConnection | undefined {
    return this.connections.get(id);
  }

  getExecutions(): ScriptExecution[] {
    return Array.from(this.executions.values());
  }

  getExecution(id: string): ScriptExecution | undefined {
    return this.executions.get(id);
  }

  getConnectionHealth(connectionId: string): { status: string; latency?: number } {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { status: 'not_found' };
    }

    if (connection.status === 'connected') {
      // Simulate latency measurement
      const latency = Math.floor(Math.random() * 50) + 10;
      return { status: connection.status, latency };
    }

    return { status: connection.status };
  }
}
