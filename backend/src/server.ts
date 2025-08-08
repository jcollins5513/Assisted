import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import contentRoutes from './routes/content';
import uploadRoutes from './routes/uploads';
import remoteExecutionRoutes from './routes/remote-execution';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsDir));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-sales-ai';
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join user to their room for real-time updates
  socket.on('join-room', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  // Handle voice recording events
  socket.on('voice-data', (data) => {
    // Process voice data for real-time analysis
    console.log('🎤 Voice data received:', data.length, 'bytes');
  });

  // Handle conversation analysis
  socket.on('conversation-update', (data) => {
    // Broadcast to relevant users
    socket.broadcast.to(`user-${data.userId}`).emit('conversation-analysis', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
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
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.io ready for real-time connections`);
  });
};

startServer().catch(console.error);

export { app, io };
