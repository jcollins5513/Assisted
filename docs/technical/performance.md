# ⚡ Performance Optimization Guidelines

## 📋 Overview

This document provides comprehensive performance optimization strategies for the Car Sales AI Assistant platform, covering frontend, backend, database, and infrastructure optimization to ensure optimal user experience and system efficiency.

## 🎯 Performance Targets

### 1. Response Time Targets
- **Page Load Time:** < 2 seconds
- **API Response Time:** < 500ms (95th percentile)
- **Database Queries:** < 100ms
- **Image Processing:** < 5 seconds
- **Real-time Updates:** < 100ms latency

### 2. Throughput Targets
- **Concurrent Users:** 1000+ simultaneous users
- **API Requests:** 10,000+ requests per minute
- **File Uploads:** 100+ concurrent uploads
- **Real-time Connections:** 500+ WebSocket connections

### 3. Resource Utilization
- **CPU Usage:** < 70% average
- **Memory Usage:** < 80% of allocated
- **Disk I/O:** < 80% of capacity
- **Network:** < 80% of bandwidth

## 🖥️ Frontend Performance

### 1. Next.js Optimization

#### Code Splitting and Lazy Loading
```javascript
// pages/index.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const VoiceRecorder = dynamic(() => import('../components/VoiceRecorder'), {
  loading: () => <div>Loading voice recorder...</div>,
  ssr: false // Disable SSR for browser-specific features
});

const ContentGenerator = dynamic(() => import('../components/ContentGenerator'), {
  loading: () => <div>Loading content generator...</div>
});

// Route-based code splitting
const SalesTraining = dynamic(() => import('../pages/sales-training'), {
  loading: () => <div>Loading sales training...</div>
});
```

#### Image Optimization
```javascript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  swcMinify: true,
};

export default nextConfig;
```

#### Bundle Optimization
```javascript
// webpack.config.js (if custom webpack needed)
const webpack = require('webpack');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
    runtimeChunk: 'single',
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
```

### 2. React Performance

#### Memoization and Optimization
```javascript
// components/VoiceRecorder.tsx
import React, { useMemo, useCallback, memo } from 'react';

const VoiceRecorder = memo(({ onRecordingComplete, settings }) => {
  // Memoize expensive calculations
  const audioConfig = useMemo(() => ({
    sampleRate: settings.sampleRate || 44100,
    channels: settings.channels || 1,
    bitDepth: settings.bitDepth || 16,
  }), [settings]);

  // Memoize callbacks
  const handleRecordingStart = useCallback(() => {
    // Recording logic
  }, [audioConfig]);

  const handleRecordingStop = useCallback(() => {
    // Stop recording logic
  }, [onRecordingComplete]);

  return (
    <div className="voice-recorder">
      {/* Component JSX */}
    </div>
  );
});

VoiceRecorder.displayName = 'VoiceRecorder';
```

#### Virtual Scrolling for Large Lists
```javascript
// components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items, itemHeight = 50 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TrainingSessionItem session={items[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. State Management Optimization

#### Context Optimization
```javascript
// hooks/useOptimizedContext.ts
import { useContext, useMemo } from 'react';

export const useOptimizedContext = (Context, selector) => {
  const context = useContext(Context);
  
  return useMemo(() => {
    return selector ? selector(context) : context;
  }, [context, selector]);
};

// Usage
const useUserData = () => useOptimizedContext(UserContext, state => state.user);
const useUserPermissions = () => useOptimizedContext(UserContext, state => state.permissions);
```

#### Redux Optimization
```javascript
// store/optimizedStore.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'preferences'], // Only persist necessary data
  blacklist: ['tempData', 'sessionData'], // Don't persist temporary data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});
```

## ⚙️ Backend Performance

### 1. Express.js Optimization

#### Middleware Optimization
```javascript
// middleware/performance.js
const compression = require('compression');
const helmet = require('helmet');

// Compression middleware
const compressionMiddleware = compression({
  level: 6, // Balanced compression
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Response time monitoring
const responseTime = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
};

module.exports = { compressionMiddleware, responseTime };
```

#### Route Optimization
```javascript
// routes/optimizedRoutes.js
const express = require('express');
const router = express.Router();

// Route-specific caching
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    redis.get(key, (err, cached) => {
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.originalJson = res.json;
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data));
        res.originalJson(data);
      };
      
      next();
    });
  };
};

// Optimized route with caching
router.get('/api/training-sessions', cacheMiddleware(600), async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (page - 1) * limit;
    
    const query = userId ? { userId } : {};
    
    const [sessions, total] = await Promise.all([
      TrainingSession.find(query)
        .select('title sessionType startTime duration metrics.overallScore')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TrainingSession.countDocuments(query)
    ]);
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. Database Query Optimization

#### MongoDB Query Optimization
```javascript
// models/optimizedQueries.js
const mongoose = require('mongoose');

// Optimized aggregation pipeline
const getTrainingAnalytics = async (userId, dateRange) => {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$startTime" }
        },
        totalSessions: { $sum: 1 },
        avgScore: { $avg: "$metrics.overallScore" },
        totalDuration: { $sum: "$duration" },
        sessionTypes: { $addToSet: "$sessionType" }
      }
    },
    {
      $sort: { "_id": 1 }
    },
    {
      $project: {
        date: "$_id",
        totalSessions: 1,
        avgScore: { $round: ["$avgScore", 2] },
        totalDuration: 1,
        sessionTypes: 1,
        _id: 0
      }
    }
  ];

  return await TrainingSession.aggregate(pipeline);
};

// Optimized text search
const searchContentProjects = async (userId, searchTerm) => {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return await ContentProject.find({
    userId,
    $or: [
      { title: searchRegex },
      { 'content.text': searchRegex },
      { 'settings.tags': { $in: [searchRegex] } }
    ]
  })
  .select('title type platform status createdAt')
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();
};

// Batch operations
const batchUpdateUserPreferences = async (updates) => {
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: update.userId },
      update: { $set: { preferences: update.preferences } }
    }
  }));

  return await User.bulkWrite(bulkOps);
};
```

#### Connection Pooling
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      // Read preference for better performance
      readPreference: 'secondaryPreferred',
      // Write concern for consistency
      w: 'majority',
      j: true
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connection monitoring
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});
```

### 3. Caching Strategies

#### Redis Caching
```javascript
// services/cacheService.js
const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection pooling
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxLoadingTimeout: 5000
    });
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
```

#### Application-Level Caching
```javascript
// middleware/cacheMiddleware.js
const cacheService = require('../services/cacheService');

const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
    
    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original response methods
      const originalJson = res.json;
      const originalSend = res.send;
      
      // Override response methods to cache
      res.json = async (data) => {
        await cacheService.set(key, data, duration);
        originalJson.call(res, data);
      };
      
      res.send = async (data) => {
        await cacheService.set(key, data, duration);
        originalSend.call(res, data);
      };
      
      next();
    } catch (error) {
      // If caching fails, continue without cache
      next();
    }
  };
};

module.exports = cacheMiddleware;
```

## 🗄️ Database Performance

### 1. Indexing Strategy

#### MongoDB Indexes
```javascript
// models/indexes.js
const mongoose = require('mongoose');

// User indexes
const userIndexes = [
  { email: 1 },
  { role: 1 },
  { 'profile.dealership': 1 },
  { 'subscription.plan': 1 },
  { isActive: 1 },
  { createdAt: -1 }
];

// Training session indexes
const trainingSessionIndexes = [
  { userId: 1, startTime: -1 },
  { sessionType: 1 },
  { status: 1 },
  { 'metrics.overallScore': -1 },
  { tags: 1 },
  { startTime: -1 }
];

// Content project indexes
const contentProjectIndexes = [
  { userId: 1, createdAt: -1 },
  { type: 1 },
  { platform: 1 },
  { status: 1 },
  { 'settings.tags': 1 },
  { 'settings.scheduledDate': 1 }
];

// Processing job indexes
const processingJobIndexes = [
  { userId: 1, createdAt: -1 },
  { jobType: 1 },
  { status: 1 },
  { priority: 1 },
  { scheduledAt: 1 },
  { 'settings.quality': 1 }
];

// Create indexes
const createIndexes = async () => {
  try {
    await User.collection.createIndexes(userIndexes);
    await TrainingSession.collection.createIndexes(trainingSessionIndexes);
    await ContentProject.collection.createIndexes(contentProjectIndexes);
    await ProcessingJob.collection.createIndexes(processingJobIndexes);
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = { createIndexes };
```

#### Query Optimization
```javascript
// services/queryOptimizer.js
class QueryOptimizer {
  // Optimize aggregation pipelines
  static optimizeAggregation(pipeline) {
    // Add $match stage early to reduce documents
    const matchStage = pipeline.find(stage => stage.$match);
    if (matchStage && pipeline.indexOf(matchStage) > 0) {
      pipeline.splice(pipeline.indexOf(matchStage), 1);
      pipeline.unshift(matchStage);
    }
    
    // Add $limit stage early if possible
    const limitStage = pipeline.find(stage => stage.$limit);
    if (limitStage && pipeline.indexOf(limitStage) > 2) {
      pipeline.splice(pipeline.indexOf(limitStage), 1);
      pipeline.splice(2, 0, limitStage);
    }
    
    return pipeline;
  }

  // Optimize find queries
  static optimizeFindQuery(query, options = {}) {
    const optimizedQuery = { ...query };
    const optimizedOptions = { ...options };
    
    // Add lean() for read-only operations
    if (!options.lean && !options.update) {
      optimizedOptions.lean = true;
    }
    
    // Add projection to reduce data transfer
    if (!options.projection) {
      optimizedOptions.projection = {
        __v: 0,
        createdAt: 0,
        updatedAt: 0
      };
    }
    
    return { query: optimizedQuery, options: optimizedOptions };
  }
}

module.exports = QueryOptimizer;
```

### 2. Database Monitoring

#### Performance Monitoring
```javascript
// monitoring/databaseMonitor.js
const mongoose = require('mongoose');

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queryCount: 0,
      slowQueries: [],
      averageQueryTime: 0,
      totalQueryTime: 0
    };
  }

  // Monitor query performance
  monitorQuery(query, duration) {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += duration;
    this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.queryCount;
    
    // Log slow queries
    if (duration > 100) {
      this.metrics.slowQueries.push({
        query: query,
        duration: duration,
        timestamp: new Date()
      });
      
      // Keep only last 100 slow queries
      if (this.metrics.slowQueries.length > 100) {
        this.metrics.slowQueries.shift();
      }
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      ...this.metrics
    };
  }

  // Get slow query analysis
  getSlowQueryAnalysis() {
    const slowQueries = this.metrics.slowQueries;
    const analysis = {};
    
    slowQueries.forEach(query => {
      const queryType = query.query.operation || 'unknown';
      if (!analysis[queryType]) {
        analysis[queryType] = {
          count: 0,
          totalTime: 0,
          averageTime: 0
        };
      }
      
      analysis[queryType].count++;
      analysis[queryType].totalTime += query.duration;
      analysis[queryType].averageTime = analysis[queryType].totalTime / analysis[queryType].count;
    });
    
    return analysis;
  }
}

module.exports = new DatabaseMonitor();
```

## 🚀 Infrastructure Performance

### 1. Load Balancing

#### Nginx Load Balancer Configuration
```nginx
# nginx.conf
upstream backend {
    least_conn;  # Use least connections algorithm
    server backend1:5000 max_fails=3 fail_timeout=30s;
    server backend2:5000 max_fails=3 fail_timeout=30s;
    server backend3:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;  # Keep connections alive
}

upstream frontend {
    least_conn;
    server frontend1:3000 max_fails=3 fail_timeout=30s;
    server frontend2:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API with caching
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache API responses
        proxy_cache api_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;
    }
    
    # Static files with aggressive caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
}

# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

### 2. CDN Configuration

#### CloudFront Configuration
```javascript
// services/cdnService.js
const AWS = require('aws-sdk');

class CDNService {
  constructor() {
    this.cloudFront = new AWS.CloudFront();
    this.s3 = new AWS.S3();
  }

  // Upload file to CDN
  async uploadToCDN(file, key) {
    try {
      const uploadParams = {
        Bucket: process.env.CDN_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000', // 1 year
        ACL: 'public-read'
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      // Invalidate CDN cache for new files
      await this.invalidateCache(`/${key}`);
      
      return result.Location;
    } catch (error) {
      console.error('CDN upload error:', error);
      throw error;
    }
  }

  // Invalidate CDN cache
  async invalidateCache(paths) {
    try {
      const params = {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      };

      await this.cloudFront.createInvalidation(params).promise();
    } catch (error) {
      console.error('CDN invalidation error:', error);
    }
  }

  // Get CDN URL
  getCDNUrl(key) {
    return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  }
}

module.exports = new CDNService();
```

### 3. Monitoring and Alerting

#### Performance Monitoring
```javascript
// monitoring/performanceMonitor.js
const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      responseTimes: [],
      errorRates: []
    };
  }

  // Monitor system resources
  startSystemMonitoring() {
    setInterval(() => {
      const cpuUsage = os.loadavg()[0];
      const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
      
      this.metrics.cpu.push({
        timestamp: Date.now(),
        value: cpuUsage
      });
      
      this.metrics.memory.push({
        timestamp: Date.now(),
        value: memoryUsage
      });
      
      // Keep only last 1000 measurements
      if (this.metrics.cpu.length > 1000) {
        this.metrics.cpu.shift();
        this.metrics.memory.shift();
      }
    }, 5000); // Every 5 seconds
  }

  // Monitor API response times
  monitorResponseTime(req, res, next) {
    const start = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - start;
      
      this.metrics.responseTimes.push({
        timestamp: Date.now(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: duration
      });
      
      // Keep only last 1000 measurements
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.shift();
      }
    });
    
    next();
  }

  // Get performance metrics
  getMetrics() {
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    
    const recentResponseTimes = this.metrics.responseTimes.filter(
      m => m.timestamp > last5Minutes
    );
    
    const recentCPU = this.metrics.cpu.filter(
      m => m.timestamp > last5Minutes
    );
    
    const recentMemory = this.metrics.memory.filter(
      m => m.timestamp > last5Minutes
    );
    
    return {
      averageResponseTime: recentResponseTimes.length > 0 
        ? recentResponseTimes.reduce((sum, m) => sum + m.duration, 0) / recentResponseTimes.length 
        : 0,
      averageCPU: recentCPU.length > 0 
        ? recentCPU.reduce((sum, m) => sum + m.value, 0) / recentCPU.length 
        : 0,
      averageMemory: recentMemory.length > 0 
        ? recentMemory.reduce((sum, m) => sum + m.value, 0) / recentMemory.length 
        : 0,
      requestCount: recentResponseTimes.length,
      errorCount: recentResponseTimes.filter(m => m.statusCode >= 400).length
    };
  }
}

module.exports = new PerformanceMonitor();
```

## 📊 Performance Testing

### 1. Load Testing

#### Artillery Load Testing
```javascript
// load-testing/artillery-config.yml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  defaults:
    headers:
      Authorization: 'Bearer {{ $randomString() }}'

scenarios:
  - name: "API Endpoints"
    weight: 70
    requests:
      - get:
          url: "/api/training-sessions"
      - post:
          url: "/api/training-sessions"
          json:
            sessionType: "pitch"
            title: "Test Session"
      - get:
          url: "/api/content-projects"
      - post:
          url: "/api/content-projects"
          json:
            title: "Test Content"
            type: "social"

  - name: "Frontend Pages"
    weight: 30
    requests:
      - get:
          url: "/"
      - get:
          url: "/dashboard"
      - get:
          url: "/sales-training"
      - get:
          url: "/content-creator"
```

### 2. Performance Benchmarks

#### Benchmark Scripts
```javascript
// benchmarks/apiBenchmarks.js
const axios = require('axios');
const { performance } = require('perf_hooks');

class APIBenchmark {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.results = [];
  }

  async benchmarkEndpoint(endpoint, method = 'GET', data = null) {
    const start = performance.now();
    
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_TOKEN}`
        }
      });
      
      const duration = performance.now() - start;
      
      this.results.push({
        endpoint,
        method,
        statusCode: response.status,
        duration,
        success: true
      });
      
      return { success: true, duration, statusCode: response.status };
    } catch (error) {
      const duration = performance.now() - start;
      
      this.results.push({
        endpoint,
        method,
        statusCode: error.response?.status || 0,
        duration,
        success: false,
        error: error.message
      });
      
      return { success: false, duration, error: error.message };
    }
  }

  async runBenchmarks() {
    const endpoints = [
      { path: '/api/training-sessions', method: 'GET' },
      { path: '/api/training-sessions', method: 'POST', data: { sessionType: 'pitch', title: 'Benchmark Test' } },
      { path: '/api/content-projects', method: 'GET' },
      { path: '/api/content-projects', method: 'POST', data: { title: 'Benchmark Content', type: 'social' } },
      { path: '/api/users/profile', method: 'GET' },
      { path: '/api/analytics/dashboard', method: 'GET' }
    ];

    console.log('Starting API benchmarks...');
    
    for (const endpoint of endpoints) {
      await this.benchmarkEndpoint(endpoint.path, endpoint.method, endpoint.data);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n=== API Benchmark Results ===');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    if (successful.length > 0) {
      const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const minDuration = Math.min(...successful.map(r => r.duration));
      const maxDuration = Math.max(...successful.map(r => r.duration));
      
      console.log(`Successful requests: ${successful.length}/${this.results.length}`);
      console.log(`Average response time: ${avgDuration.toFixed(2)}ms`);
      console.log(`Min response time: ${minDuration.toFixed(2)}ms`);
      console.log(`Max response time: ${maxDuration.toFixed(2)}ms`);
    }
    
    if (failed.length > 0) {
      console.log(`Failed requests: ${failed.length}`);
      failed.forEach(f => {
        console.log(`  ${f.method} ${f.endpoint}: ${f.error}`);
      });
    }
  }
}

module.exports = APIBenchmark;
```

---

*This performance optimization guide provides comprehensive strategies for optimizing the Car Sales AI Assistant platform across all layers of the application stack.*
