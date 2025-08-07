import { Router } from 'express';
import { RemoteExecutionService, RemoteConnection, ScriptExecution } from '../services/remoteExecutionService';
import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import path from 'path'; // Added missing import for path

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
    next(createError(500, 'Failed to fetch connections'));
  }
});

// Get connection by ID
router.get('/connections/:id', authMiddleware, async (req, res, next) => {
  try {
    const connection = remoteService.getConnection(req.params.id);
    if (!connection) {
      return next(createError(404, 'Connection not found'));
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
    next(createError(500, 'Failed to fetch connection'));
  }
});

// Add new connection
router.post('/connections', authMiddleware, async (req, res, next) => {
  try {
    const { name, type, host, port } = req.body;
    
    if (!name || !type || !host) {
      return next(createError(400, 'Name, type, and host are required'));
    }
    
    if (!['tailscale', 'ssh', 'cloud-tunnel'].includes(type)) {
      return next(createError(400, 'Invalid connection type'));
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
    next(createError(500, 'Failed to create connection'));
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
    next(createError(500, `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
    next(createError(500, `Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
    next(createError(500, 'Failed to delete connection'));
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
    next(createError(500, 'Failed to fetch executions'));
  }
});

// Get execution by ID
router.get('/executions/:id', authMiddleware, async (req, res, next) => {
  try {
    const execution = remoteService.getExecution(req.params.id);
    if (!execution) {
      return next(createError(404, 'Execution not found'));
    }
    
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(createError(500, 'Failed to fetch execution'));
  }
});

// Execute script
router.post('/executions', authMiddleware, async (req, res, next) => {
  try {
    const { connectionId, scriptPath, parameters } = req.body;
    
    if (!connectionId || !scriptPath) {
      return next(createError(400, 'Connection ID and script path are required'));
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
    next(createError(500, `Failed to execute script: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
    next(createError(500, `Failed to stop execution: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
});

// Background removal specific endpoint
router.post('/background-removal', authMiddleware, async (req, res, next) => {
  try {
    const { connectionId, inputPath, outputPath, model, quality, batchMode } = req.body;
    
    if (!connectionId || !inputPath) {
      return next(createError(400, 'Connection ID and input path are required'));
    }
    
    // Build script parameters
    const parameters: Record<string, any> = {
      InputPath: inputPath
    };
    
    if (outputPath) parameters.OutputPath = outputPath;
    if (model) parameters.Model = model;
    if (quality) parameters.Quality = quality;
    if (batchMode) parameters.BatchMode = true; // Corrected from $true to true
    
    // Execute the background removal script
    const scriptPath = path.join(__dirname, '../../scripts/background-removal.ps1');
    const executionId = await remoteService.executeScript(connectionId, scriptPath, parameters);
    
    res.status(201).json({
      success: true,
      data: {
        executionId,
        status: 'started',
        operation: 'background-removal'
      }
    });
  } catch (error) {
    next(createError(500, `Failed to start background removal: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
    next(createError(500, 'Failed to get connection health'));
  }
});

export default router;
