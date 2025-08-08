import { Router } from 'express';
import { RemoteExecutionService, RemoteConnection, ScriptExecution } from '../services/remoteExecutionService';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import path from 'path'; // Added missing import for path
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const remoteService = new RemoteExecutionService();

// Get all connections
router.get('/connections', authMiddleware, async (req, res, next) => {
  try {
    const connections = remoteService.getConnections();
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    next(createError('Failed to fetch connections', 500));
  }
});

// Get connection by ID
router.get('/connections/:id', authMiddleware, async (req, res, next) => {
  try {
    const connection = remoteService.getConnection(req.params.id);
    if (!connection) {
      return next(createError('Connection not found', 404));
    }
    
    const health = remoteService.getConnectionHealth(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...connection,
        health
      }
    });
  } catch (error) {
    next(createError('Failed to fetch connection', 500));
  }
});

// Add new connection
router.post('/connections', authMiddleware, async (req, res, next) => {
  try {
    const { name, type, host, port } = req.body;
    
    if (!name || !type || !host) {
      return next(createError('Name, type, and host are required', 400));
    }
    
    if (!['tailscale', 'ssh', 'cloud-tunnel'].includes(type)) {
      return next(createError('Invalid connection type', 400));
    }
    
    const connectionId = await remoteService.addConnection({
      name,
      type,
      host,
      port
    });
    
    const connection = remoteService.getConnection(connectionId);
    
    res.status(201).json({
      success: true,
      data: connection
    });
  } catch (error) {
    next(createError('Failed to create connection', 500));
  }
});

// Connect to remote server
router.post('/connections/:id/connect', authMiddleware, async (req, res, next) => {
  try {
    const success = await remoteService.connect(req.params.id);
    
    res.json({
      success: true,
      data: { connected: success }
    });
  } catch (error) {
    next(createError(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});

// Disconnect from remote server
router.post('/connections/:id/disconnect', authMiddleware, async (req, res, next) => {
  try {
    await remoteService.disconnect(req.params.id);
    
    res.json({
      success: true,
      data: { disconnected: true }
    });
  } catch (error) {
    next(createError(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});

// Delete connection
router.delete('/connections/:id', authMiddleware, async (req, res, next) => {
  try {
    // First disconnect if connected
    const connection = remoteService.getConnection(req.params.id);
    if (connection && connection.status === 'connected') {
      await remoteService.disconnect(req.params.id);
    }
    
    // In a real implementation, you would remove the connection from storage
    // For now, we'll just return success
    
    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    next(createError('Failed to delete connection', 500));
  }
});

// Get all executions
router.get('/executions', authMiddleware, async (req, res, next) => {
  try {
    const executions = remoteService.getExecutions();
    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    next(createError('Failed to fetch executions', 500));
  }
});

// Get execution by ID
router.get('/executions/:id', authMiddleware, async (req, res, next) => {
  try {
    const execution = remoteService.getExecution(req.params.id);
    if (!execution) {
      return next(createError('Execution not found', 404));
    }
    
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(createError('Failed to fetch execution', 500));
  }
});

// Execute script
router.post('/executions', authMiddleware, async (req, res, next) => {
  try {
    const { connectionId, scriptPath, parameters } = req.body;
    
    if (!connectionId || !scriptPath) {
      return next(createError('Connection ID and script path are required', 400));
    }
    
    const executionId = await remoteService.executeScript(connectionId, scriptPath, parameters || {});
    
    res.status(201).json({
      success: true,
      data: {
        executionId,
        status: 'started'
      }
    });
  } catch (error) {
    next(createError(`Failed to execute script: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});

// Stop execution
router.post('/executions/:id/stop', authMiddleware, async (req, res, next) => {
  try {
    await remoteService.stopExecution(req.params.id);
    
    res.json({
      success: true,
      data: { stopped: true }
    });
  } catch (error) {
    next(createError(`Failed to stop execution: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});

// Background removal specific endpoint
router.post('/background-removal', authMiddleware, async (req, res, next) => {
  try {
    const { 
      connectionId,
      inputPath,          // local server path or remote folder if remoteScriptPath provided
      outputPath,         // desired output path (remote or local depending on mode)
      model,
      batchMode,
      alphaMatting,
      alphaErode,
      transparentVideo,
      frameRate,
      frameLimit,
      gpuBatch,
      workers,
      overlayVideoPath,
      overlayImagePath,
      engine, // 'backgroundremover' | 'rembg'
      remoteScriptPath, // Optional: absolute path on remote host for PowerShell script
      remoteInputDir,   // Optional: where to copy inputs on remote host (e.g., C:\processing\in)
      remoteOutputDir   // Optional: where outputs are written on remote host (e.g., C:\processing\out)
    } = req.body;
    
    if (!connectionId || !inputPath) {
      return next(createError('Connection ID and input path are required', 400));
    }

    const useBackgroundRemover = (engine || 'backgroundremover') === 'backgroundremover';

    // Build script parameters
    const parameters: Record<string, any> = {
      InputPath: inputPath
    };
    
    if (outputPath) parameters.OutputPath = outputPath;

    if (useBackgroundRemover) {
      if (model) parameters.Model = model;
      if (batchMode) parameters.BatchMode = true;
      if (alphaMatting) parameters.AlphaMatting = true;
      if (alphaErode !== undefined) parameters.AlphaErode = alphaErode;
      if (transparentVideo) parameters.TransparentVideo = true;
      if (frameRate !== undefined) parameters.FrameRate = frameRate;
      if (frameLimit !== undefined) parameters.FrameLimit = frameLimit;
      if (gpuBatch !== undefined) parameters.GpuBatch = gpuBatch;
      if (workers !== undefined) parameters.Workers = workers;
      if (overlayVideoPath) parameters.OverlayVideoPath = overlayVideoPath;
      if (overlayImagePath) parameters.OverlayImagePath = overlayImagePath;
    } else {
      // Legacy script parameters
      if (model) parameters.Model = model;
      if (batchMode) parameters.BatchMode = true;
    }
    
    // If remoteScriptPath is provided, we assume running entirely on remote host
    if (remoteScriptPath) {
      // Ensure remote directories
      if (!remoteInputDir || !remoteOutputDir) {
        return next(createError('remoteInputDir and remoteOutputDir are required when using remoteScriptPath', 400));
      }

      await remoteService.ensureRemoteDirectory(connectionId, remoteInputDir);
      await remoteService.ensureRemoteDirectory(connectionId, remoteOutputDir);

      // Copy input (file or folder) to remote
      const serverPath = inputPath as string;
      const isDirectory = fs.existsSync(serverPath) && fs.lstatSync(serverPath).isDirectory();
      if (isDirectory) {
        await remoteService.copyDirectoryToRemote(connectionId, serverPath, remoteInputDir);
      } else {
        await remoteService.copyFileToRemote(connectionId, serverPath, path.join(remoteInputDir, path.basename(serverPath)));
      }

      // Run script on remote against the remote input/output
      const remoteParams = {
        ...parameters,
        InputPath: remoteInputDir,
        OutputPath: remoteOutputDir
      };
      const executionId = await remoteService.executeScript(connectionId, remoteScriptPath, remoteParams);

      return res.status(201).json({
        success: true,
        data: {
          executionId,
          status: 'started',
          operation: 'background-removal',
          engine: useBackgroundRemover ? 'backgroundremover' : 'rembg'
        }
      });
    }

    // Local run (server executes PowerShell locally). Assumes inputPath is available to server
    const script = useBackgroundRemover
      ? path.join(__dirname, '../../scripts/backgroundremover-cli.ps1')
      : path.join(__dirname, '../../scripts/background-removal.ps1');

    const executionId = await remoteService.executeScript(connectionId, script, parameters);
    
    res.status(201).json({
      success: true,
      data: {
        executionId,
        status: 'started',
        operation: 'background-removal',
        engine: useBackgroundRemover ? 'backgroundremover' : 'rembg'
      }
    });
  } catch (error) {
    next(createError(`Failed to start background removal: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});

// Get connection health
router.get('/connections/:id/health', authMiddleware, async (req, res, next) => {
  try {
    const health = remoteService.getConnectionHealth(req.params.id);
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(createError('Failed to get connection health', 500));
  }
});

export default router;
 
// Finalize background removal: copy results back to server uploads and return URLs
router.post('/background-removal/finalize', authMiddleware, async (req, res, next) => {
  try {
    const { connectionId, remoteOutputDir } = req.body as { connectionId: string; remoteOutputDir: string };
    if (!connectionId || !remoteOutputDir) {
      return next(createError('connectionId and remoteOutputDir are required', 400));
    }

    const localProcessedDir = path.join(__dirname, '../../uploads/processed');
    if (!fs.existsSync(localProcessedDir)) {
      fs.mkdirSync(localProcessedDir, { recursive: true });
    }

    // Copy remote folder to server processed directory
    await remoteService.copyDirectoryFromRemote(connectionId, remoteOutputDir, localProcessedDir);

    // Collect file URLs
    const files = fs.readdirSync(localProcessedDir)
      .filter(f => !f.startsWith('.'))
      .map(f => ({
        file: f,
        url: `/uploads/processed/${f}`
      }));

    res.json({ success: true, data: { files } });
  } catch (error) {
    next(createError(`Failed to finalize background removal: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
  }
});
