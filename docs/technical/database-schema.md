# 🗄️ Database Schema Documentation

## 📋 Overview

The Car Sales AI Assistant uses MongoDB as its primary database, with Mongoose ODM for schema management and data validation. The database is designed to support real-time sales training, content creation, and remote image processing workflows.

## 🏗️ Database Architecture

### Connection Configuration
```javascript
// Database connection with connection pooling
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

## 📊 Collections Schema

### 1. Users Collection

**Purpose:** Store user account information, authentication details, and preferences.

```javascript
// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'salesperson'],
    default: 'salesperson'
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dealership: {
      type: String,
      trim: true,
      maxlength: 100
    },
    avatar: {
      type: String,
      default: null
    }
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'es', 'fr'],
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    features: [{
      type: String,
      enum: ['voice_training', 'content_creation', 'remote_execution', 'analytics', 'api_access']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.dealership': 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ isActive: 1 });
```

### 2. Training Sessions Collection

**Purpose:** Store real-time training session data, metrics, and feedback.

```javascript
// Training Session Schema
const trainingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['pitch', 'objection', 'closing', 'product_knowledge', 'negotiation'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  metrics: {
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    clarity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    pace: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    volume: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engagement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  transcript: {
    type: String,
    maxlength: 10000
  },
  audioUrl: {
    type: String
  },
  feedback: [{
    timestamp: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['suggestion', 'correction', 'praise', 'warning'],
      required: true
    },
    category: {
      type: String,
      enum: ['voice', 'content', 'technique', 'engagement'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actionRequired: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'comment', 'edit'],
      default: 'view'
    }
  }]
}, {
  timestamps: true
});

// Indexes
trainingSessionSchema.index({ userId: 1, startTime: -1 });
trainingSessionSchema.index({ sessionType: 1 });
trainingSessionSchema.index({ status: 1 });
trainingSessionSchema.index({ 'metrics.overallScore': -1 });
trainingSessionSchema.index({ tags: 1 });
```

### 3. Content Projects Collection

**Purpose:** Store content creation projects, templates, and publishing data.

```javascript
// Content Project Schema
const contentProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['social', 'email', 'print', 'video', 'web', 'presentation'],
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'email', 'website', 'print'],
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 5000
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String,
        trim: true
      },
      position: {
        x: Number,
        y: Number
      },
      size: {
        width: Number,
        height: Number
      }
    }],
    videos: [{
      url: {
        type: String,
        required: true
      },
      duration: Number,
      thumbnail: String
    }],
    templates: [{
      name: String,
      id: String,
      category: String
    }],
    aiGenerated: {
      type: Boolean,
      default: false
    },
    aiPrompt: {
      type: String,
      maxlength: 1000
    }
  },
  settings: {
    targetAudience: {
      type: String,
      enum: ['prospects', 'customers', 'dealers', 'general'],
      default: 'general'
    },
    tone: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'formal', 'enthusiastic'],
      default: 'professional'
    },
    language: {
      type: String,
      default: 'en'
    },
    tags: [{
      type: String,
      trim: true
    }],
    scheduledDate: {
      type: Date
    },
    publishSettings: {
      autoPublish: {
        type: Boolean,
        default: false
      },
      platforms: [{
        name: String,
        enabled: Boolean,
        credentials: Object
      }]
    }
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  parentProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentProject'
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
contentProjectSchema.index({ userId: 1, createdAt: -1 });
contentProjectSchema.index({ type: 1 });
contentProjectSchema.index({ platform: 1 });
contentProjectSchema.index({ status: 1 });
contentProjectSchema.index({ 'settings.tags': 1 });
contentProjectSchema.index({ 'settings.scheduledDate': 1 });
```

### 4. Processing Jobs Collection

**Purpose:** Track background processing jobs for image and content processing.

```javascript
// Processing Job Schema
const processingJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobType: {
    type: String,
    enum: ['background_removal', 'image_enhancement', 'content_generation', 'video_processing'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  inputFiles: [{
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number
    }
  }],
  outputFiles: [{
    url: {
      type: String
    },
    size: {
      type: Number
    },
    mimeType: {
      type: String
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number
    }
  }],
  settings: {
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'medium'
    },
    format: {
      type: String,
      enum: ['jpg', 'png', 'webp', 'tiff', 'mp4', 'mov'],
      default: 'png'
    },
    options: {
      removeBackground: {
        type: Boolean,
        default: false
      },
      enhanceQuality: {
        type: Boolean,
        default: false
      },
      resize: {
        width: Number,
        height: Number,
        maintainAspectRatio: {
          type: Boolean,
          default: true
        }
      },
      filters: [{
        type: String,
        enum: ['brightness', 'contrast', 'saturation', 'blur', 'sharpen']
      }]
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  error: {
    code: String,
    message: String,
    details: Object
  },
  processingTime: {
    type: Number // in seconds
  },
  resourceUsage: {
    cpu: Number,
    memory: Number,
    storage: Number
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
processingJobSchema.index({ userId: 1, createdAt: -1 });
processingJobSchema.index({ jobType: 1 });
processingJobSchema.index({ status: 1 });
processingJobSchema.index({ priority: 1 });
processingJobSchema.index({ scheduledAt: 1 });
processingJobSchema.index({ 'settings.quality': 1 });
```

### 5. Analytics Collection

**Purpose:** Store user analytics, performance metrics, and usage statistics.

```javascript
// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['session_start', 'session_end', 'content_created', 'job_completed', 'feature_used', 'error_occurred'],
    required: true
  },
  module: {
    type: String,
    enum: ['sales_training', 'content_creator', 'remote_execution', 'dashboard', 'settings'],
    required: true
  },
  eventData: {
    sessionId: mongoose.Schema.Types.ObjectId,
    contentId: mongoose.Schema.Types.ObjectId,
    jobId: mongoose.Schema.Types.ObjectId,
    feature: String,
    duration: Number,
    metadata: Object
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  location: {
    country: String,
    region: String,
    city: String
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1 });
analyticsSchema.index({ module: 1 });
analyticsSchema.index({ timestamp: -1 });
```

## 🔗 Relationships

### 1. User Relationships
```javascript
// User has many Training Sessions
userSchema.virtual('trainingSessions', {
  ref: 'TrainingSession',
  localField: '_id',
  foreignField: 'userId'
});

// User has many Content Projects
userSchema.virtual('contentProjects', {
  ref: 'ContentProject',
  localField: '_id',
  foreignField: 'userId'
});

// User has many Processing Jobs
userSchema.virtual('processingJobs', {
  ref: 'ProcessingJob',
  localField: '_id',
  foreignField: 'userId'
});
```

### 2. Training Session Relationships
```javascript
// Training Session belongs to User
trainingSessionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});
```

### 3. Content Project Relationships
```javascript
// Content Project belongs to User
contentProjectSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Content Project can have parent/child relationships
contentProjectSchema.virtual('parent', {
  ref: 'ContentProject',
  localField: 'parentProject',
  foreignField: '_id',
  justOne: true
});

contentProjectSchema.virtual('children', {
  ref: 'ContentProject',
  localField: '_id',
  foreignField: 'parentProject'
});
```

## 📈 Performance Optimization

### Indexing Strategy
```javascript
// Compound indexes for common queries
// Users by role and active status
userSchema.index({ role: 1, isActive: 1 });

// Training sessions by user and date range
trainingSessionSchema.index({ userId: 1, startTime: -1, status: 1 });

// Content projects by user and status
contentProjectSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Processing jobs by status and priority
processingJobSchema.index({ status: 1, priority: 1, scheduledAt: 1 });

// Analytics by user and event type
analyticsSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
```

### Query Optimization
```javascript
// Efficient aggregation for user dashboard
const userStats = await TrainingSession.aggregate([
  { $match: { userId: userId, startTime: { $gte: startDate } } },
  { $group: {
    _id: null,
    totalSessions: { $sum: 1 },
    avgScore: { $avg: '$metrics.overallScore' },
    totalDuration: { $sum: '$duration' }
  }}
]);

// Content project analytics
const contentStats = await ContentProject.aggregate([
  { $match: { userId: userId, status: 'published' } },
  { $group: {
    _id: '$type',
    count: { $sum: 1 },
    totalViews: { $sum: '$analytics.views' },
    totalEngagement: { $sum: '$analytics.engagement' }
  }}
]);
```

## 🔒 Data Security

### Encryption
```javascript
// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

### Data Validation
```javascript
// Custom validators
userSchema.path('email').validate(async function(value) {
  if (!this.isModified('email')) return true;
  
  const user = await this.constructor.findOne({ email: value });
  return !user;
}, 'Email already exists');

// File size validation
processingJobSchema.path('inputFiles').validate(function(files) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return totalSize <= maxSize;
}, 'Total file size exceeds 50MB limit');
```

## 📊 Data Migration

### Version Management
```javascript
// Schema version tracking
const schemaVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  description: String,
  changes: [String]
});

// Migration script example
const migrateToV2 = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Add new fields to existing documents
    await User.updateMany(
      { preferences: { $exists: false } },
      { $set: { preferences: { language: 'en', theme: 'light', notifications: { email: true, push: true, sms: false } } } }
    );
    
    // Update schema version
    await SchemaVersion.create({ version: 2, description: 'Added user preferences' });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

## 🔄 Backup and Recovery

### Backup Strategy
```javascript
// Automated backup configuration
const backupConfig = {
  schedule: '0 2 * * *', // Daily at 2 AM
  retention: 30, // Keep 30 days of backups
  compression: true,
  encryption: true,
  locations: ['local', 'cloud']
};

// Backup script
const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.gz`;
  
  // MongoDB dump command
  const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${filename}" --gzip`;
  
  // Execute backup
  await exec(command);
  
  // Upload to cloud storage
  await uploadToCloud(filename);
  
  // Clean up old backups
  await cleanupOldBackups();
};
```

---

*This database schema documentation provides comprehensive details about the data structure, relationships, and optimization strategies for the Car Sales AI Assistant platform.*
