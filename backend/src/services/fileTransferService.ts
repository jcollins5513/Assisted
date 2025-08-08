import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';

export interface FileTransfer {
  id: string;
  connectionId: string;
  type: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size: number;
  transferred: number;
  checksum?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface TransferOptions {
  chunkSize?: number;
  timeout?: number;
  retryAttempts?: number;
  validateChecksum?: boolean;
  overwrite?: boolean;
}

export class FileTransferService extends EventEmitter {
  private transfers: Map<string, FileTransfer> = new Map();
  private transferQueue: string[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.startQueueProcessor();
  }

  // File Transfer Management
  async startTransfer(
    connectionId: string,
    type: 'upload' | 'download',
    localPath: string,
    remotePath: string,
    options: TransferOptions = {}
  ): Promise<string> {
    const transferId = this.generateId();
    const fileSize = await this.getFileSize(localPath);
    
    const transfer: FileTransfer = {
      id: transferId,
      connectionId,
      type,
      localPath,
      remotePath,
      status: 'pending',
      progress: 0,
      size: fileSize,
      transferred: 0,
      retryCount: 0,
      maxRetries: options.retryAttempts || 3
    };

    this.transfers.set(transferId, transfer);
    this.transferQueue.push(transferId);
    this.emit('transferQueued', transfer);

    return transferId;
  }

  async cancelTransfer(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === 'transferring') {
      transfer.status = 'cancelled';
      this.emit('transferCancelled', transfer);
    }
  }

  // File Validation
  async validateFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File does not exist' };
      }

      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return { valid: false, error: 'File is empty' };
      }

      // Check file permissions
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch {
        return { valid: false, error: 'File is not readable' };
      }

      // Validate file extension for images
      const ext = path.extname(filePath).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'];
      if (!validExtensions.includes(ext)) {
        return { valid: false, error: 'Invalid file type' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  // File Synchronization
  async syncDirectory(localDir: string, remoteDir: string, connectionId: string): Promise<string[]> {
    const transferIds: string[] = [];
    
    try {
      const files = await this.getLocalFiles(localDir);
      
      for (const file of files) {
        const localPath = path.join(localDir, file);
        const remotePath = path.join(remoteDir, file);
        
        // Check if file needs to be synced
        const needsSync = await this.needsSync(localPath, remotePath, connectionId);
        
        if (needsSync) {
          const transferId = await this.startTransfer(connectionId, 'upload', localPath, remotePath);
          transferIds.push(transferId);
        }
      }
    } catch (error) {
      console.error('Directory sync failed:', error);
    }
    
    return transferIds;
  }

  // Progress Tracking
  private updateTransferProgress(transferId: string, transferred: number): void {
    const transfer = this.transfers.get(transferId);
    if (transfer) {
      transfer.transferred = transferred;
      transfer.progress = Math.round((transferred / transfer.size) * 100);
      this.emit('transferProgress', transfer);
    }
  }

  // Retry Mechanisms
  private async retryTransfer(transfer: FileTransfer): Promise<boolean> {
    if (transfer.retryCount >= transfer.maxRetries) {
      transfer.status = 'failed';
      transfer.error = 'Max retry attempts exceeded';
      this.emit('transferFailed', transfer);
      return false;
    }

    transfer.retryCount++;
    transfer.status = 'pending';
    transfer.progress = 0;
    transfer.transferred = 0;
    
    this.emit('transferRetrying', transfer);
    
    // Add exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, transfer.retryCount - 1), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    this.transferQueue.unshift(transfer.id);
    return true;
  }

  // Queue Processing
  private async startQueueProcessor(): Promise<void> {
    while (true) {
      if (this.transferQueue.length > 0 && !this.isProcessing) {
        this.isProcessing = true;
        const transferId = this.transferQueue.shift()!;
        await this.processTransfer(transferId);
        this.isProcessing = false;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processTransfer(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return;

    try {
      transfer.status = 'transferring';
      transfer.startTime = new Date();
      this.emit('transferStarted', transfer);

      // Validate file before transfer
      const validation = await this.validateFile(transfer.localPath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Calculate checksum for validation
      if (transfer.type === 'upload') {
        transfer.checksum = await this.calculateChecksum(transfer.localPath);
      }

      // Simulate file transfer with progress updates
      await this.simulateFileTransfer(transfer);

      transfer.status = 'completed';
      transfer.progress = 100;
      transfer.transferred = transfer.size;
      transfer.endTime = new Date();
      this.emit('transferCompleted', transfer);

    } catch (error) {
      transfer.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Attempt retry if possible
      const retrySuccess = await this.retryTransfer(transfer);
      if (!retrySuccess) {
        transfer.status = 'failed';
        transfer.endTime = new Date();
        this.emit('transferFailed', transfer);
      }
    }
  }

  // File Cleanup
  async cleanupTransfer(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return;

    try {
      // Clean up temporary files
      if (transfer.status === 'failed' || transfer.status === 'cancelled') {
        await this.cleanupTemporaryFiles(transfer);
      }

      // Remove from tracking
      this.transfers.delete(transferId);
      this.emit('transferCleaned', transferId);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  private async cleanupTemporaryFiles(transfer: FileTransfer): Promise<void> {
    try {
      // Clean up any temporary files created during transfer
      const tempPath = `${transfer.localPath}.tmp`;
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      console.error('Failed to cleanup temporary files:', error);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async getFileSize(filePath: string): Promise<number> {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  private async getLocalFiles(dir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files.filter(file => !file.startsWith('.')));
        }
      });
    });
  }

  private async needsSync(_localPath: string, _remotePath: string, _connectionId: string): Promise<boolean> {
    // In a real implementation, this would check file timestamps and sizes
    // For now, we'll assume files need syncing
    return true;
  }

  private async simulateFileTransfer(transfer: FileTransfer): Promise<void> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    let transferred = 0;

    while (transferred < transfer.size) {
      const chunk = Math.min(chunkSize, transfer.size - transferred);
      transferred += chunk;
      
      this.updateTransferProgress(transfer.id, transferred);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Getters
  getTransfers(): FileTransfer[] {
    return Array.from(this.transfers.values());
  }

  getTransfer(id: string): FileTransfer | undefined {
    return this.transfers.get(id);
  }

  getTransferStats(): {
    total: number;
    pending: number;
    transferring: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const transfers = Array.from(this.transfers.values());
    return {
      total: transfers.length,
      pending: transfers.filter(t => t.status === 'pending').length,
      transferring: transfers.filter(t => t.status === 'transferring').length,
      completed: transfers.filter(t => t.status === 'completed').length,
      failed: transfers.filter(t => t.status === 'failed').length,
      cancelled: transfers.filter(t => t.status === 'cancelled').length
    };
  }
}
