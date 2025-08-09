// Global test setup
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Global test variables
global.mongod = undefined;

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Set test JWT secrets
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  
  // Disable console logs during tests unless DEBUG is set
  if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
  
  // Start in-memory MongoDB instance
  global.mongod = await MongoMemoryServer.create();
  const uri = global.mongod.getUri();
  process.env.TEST_DATABASE_URL = uri;
  
  // Set longer timeout for database operations
  jest.setTimeout(30000);
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Stop in-memory MongoDB
  if (global.mongod) {
    await global.mongod.stop();
  }
});

// Setup before each test
beforeEach(async () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Reset all mocks
  jest.resetAllMocks();
});

// Cleanup after each test
afterEach(async () => {
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Clean up any test data if needed
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Add custom matchers
expect.extend({
  toBeValidObjectId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
  
  toHaveValidationError(received, field) {
    const hasError = received.errors && received.errors[field];
    
    if (hasError) {
      return {
        message: () => `expected validation error for field ${field} not to exist`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected validation error for field ${field} to exist`,
        pass: false,
      };
    }
  }
});

// Mock external services for testing
jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue(true),
  sendVerificationCode: jest.fn().mockResolvedValue(true),
}));

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('mock file content'),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock Socket.IO for testing
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

// Mock external API clients
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mock AI response'
            }
          }]
        })
      }
    }
  }))
}));

// Helper functions for tests
global.createTestUser = async (userData = {}) => {
  const { User } = require('../src/models/User');
  
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  
  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

global.createTestConversation = async (userId, conversationData = {}) => {
  const { Conversation } = require('../src/models/Conversation');
  
  const defaultConversation = {
    userId,
    status: 'active',
    analysis: {
      tone: 'neutral',
      confidence: 0.8,
      keyTopics: [],
      objections: [],
      closingAttempts: 0,
      negotiationPhases: [],
      overallScore: 75,
      feedback: [],
      salesTechniques: [],
      scenarioProgress: 0,
      customerEngagement: 60
    }
  };
  
  const conversation = new Conversation({ ...defaultConversation, ...conversationData });
  await conversation.save();
  return conversation;
};

// Mock authentication token generation
global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Database helpers
global.clearDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

global.closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
