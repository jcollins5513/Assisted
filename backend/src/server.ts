import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { conversationAnalysisService } from './services/conversationAnalysisService';
import { WhisperCppStreamer } from './services/realtimeSttWhisper';
import { conversationStore } from './services/conversationStore';
import mongoose from 'mongoose';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import contentRoutes from './routes/content';
import uploadRoutes from './routes/uploads';
import remoteExecutionRoutes from './routes/remote-execution';
import qualityRoutes from './routes/quality';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Build allowed origins list with sensible dev defaults
const allowedOrigins = (process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS']!.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3002']);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests (no origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(cors(corsOptions));
// Explicitly handle preflight across all routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsDir));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/car-sales-ai';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/conversations', authMiddleware, conversationRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/remote-execution', authMiddleware, remoteExecutionRoutes);
app.use('/api/quality', authMiddleware, qualityRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io connection handling
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.['token'] as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    const secret = process.env['JWT_SECRET'];
    if (!secret) return next(new Error('server-misconfigured'));
    const decoded = jwt.verify(token, secret) as any;
    (socket as any).userId = decoded.userId;
    return next();
  } catch {
    return next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string | undefined;
  if (userId) socket.join(`user-${userId}`);

  // Lazy init per-connection whisper streamer
  let whisper: WhisperCppStreamer | null = null;
  const ensureWhisper = () => {
    if (whisper) return whisper;
    const exe = process.env['WHISPER_CPP_EXE'] || 'whisper-main.exe';
    const model = process.env['WHISPER_CPP_MODEL'] || 'models/ggml-base.en.bin';
    whisper = new WhisperCppStreamer({ whisperExePath: exe, modelPath: model, language: 'en' });
    whisper.setHandlers((partial) => {
      const result = conversationAnalysisService.analyzeConversation(partial);
      if (userId) io.to(`user-${userId}`).emit('conversation-analysis', result);
    }, (finalText) => {
      const result = conversationAnalysisService.analyzeConversation(finalText);
      if (userId) {
        io.to(`user-${userId}`).emit('conversation-analysis', result);
        io.to(`user-${userId}`).emit('real-time-feedback', result.realTimeFeedback);
      }
    });
    whisper.start();
    return whisper;
  };

  socket.on('voice-data', (chunk: { data: ArrayBuffer; timestamp: number; sequence: number; sampleRate?: number }) => {
    const w = ensureWhisper();
    try {
      w.feedPcm(chunk);
      if (userId) conversationStore.append({ type: 'transcript', userId, timestamp: chunk.timestamp, data: { seq: chunk.sequence } });
    } catch {}
  });

  socket.on('conversation-event', (evt) => {
    try {
      if (userId) conversationStore.append({ type: 'start', userId, timestamp: Date.now(), data: evt });
    } catch {}
  });

  socket.on('disconnect', () => {
    if (whisper) whisper.stop();
    whisper = null;
    if (userId) conversationStore.append({ type: 'end', userId, timestamp: Date.now(), data: {} });
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  // Whisper startup validation (non-fatal): log if misconfigured
  try {
    const exe = process.env['WHISPER_CPP_EXE'];
    const model = process.env['WHISPER_CPP_MODEL'];
    if (exe && model) {
      const { WhisperCppStreamer } = await import('./services/realtimeSttWhisper');
      const check = (WhisperCppStreamer as any).validateConfig({ whisperExePath: exe, modelPath: model });
      if (!check.ok) {
        console.warn(`Whisper.cpp validation: ${check.message}`);
      } else {
        console.log('✅ Whisper.cpp configuration looks valid');
      }
    } else {
      console.warn('Whisper.cpp not configured. Set WHISPER_CPP_EXE and WHISPER_CPP_MODEL to enable streaming STT');
    }
  } catch (err) {
    console.warn('Whisper.cpp validation failed:', err);
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.io ready for real-time connections`);
  });
};

if (process.env['NODE_ENV'] !== 'test') {
  startServer().catch(console.error);
}

export { app, io };
