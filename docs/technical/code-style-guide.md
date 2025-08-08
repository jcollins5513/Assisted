# 📝 Code Documentation & Style Guide

## 📋 Overview

This document establishes coding standards, best practices, and documentation requirements for the Car Sales AI Assistant project to ensure code quality, maintainability, and consistency across the development team.

## 🎯 Code Quality Standards

### 1. Code Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] Functions and variables have meaningful names
- [ ] Code is properly documented with JSDoc comments
- [ ] Error handling is implemented appropriately
- [ ] Security best practices are followed
- [ ] Performance considerations are addressed
- [ ] Tests are written for new functionality
- [ ] No console.log statements in production code
- [ ] No hardcoded values or secrets
- [ ] Code is properly formatted and linted

### 2. Performance Standards
- **Response Time:** API endpoints should respond within 500ms
- **Bundle Size:** Frontend bundles should be under 2MB
- **Database Queries:** Should use indexes and be optimized
- **Memory Usage:** Should not exceed 80% of allocated memory
- **Error Rate:** Should be below 1% for production systems

## 🏗️ Project Structure

### 1. Directory Organization
```
car-sales-ai/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and external services
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── docs/                # Frontend-specific documentation
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   └── docs/                # Backend-specific documentation
├── shared/                   # Shared code and types
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utility functions
├── docs/                     # Project documentation
├── scripts/                  # Build and deployment scripts
└── tests/                    # End-to-end tests
```

### 2. File Naming Conventions

#### Frontend Files
```typescript
// Components: PascalCase
VoiceRecorder.tsx
ContentGenerator.tsx
DashboardLayout.tsx

// Hooks: camelCase with 'use' prefix
useAuth.ts
useVoiceRecorder.ts
useApi.ts

// Services: camelCase
api.ts
auth.ts
audioStreamService.ts

// Utils: camelCase
errorHandler.ts
performance.ts
validation.ts

// Types: PascalCase
User.ts
TrainingSession.ts
ContentProject.ts
```

#### Backend Files
```javascript
// Controllers: camelCase
authController.js
trainingController.js
contentController.js

// Models: PascalCase
User.js
TrainingSession.js
ContentProject.js

// Services: camelCase
authService.js
apiService.js
remoteExecutionService.js

// Middleware: camelCase
auth.js
errorHandler.js
rateLimiter.js
```

## 📝 Documentation Standards

### 1. JSDoc Documentation

#### Function Documentation
```javascript
/**
 * Creates a new training session for the user
 * @param {string} userId - The ID of the user creating the session
 * @param {Object} sessionData - The session configuration data
 * @param {string} sessionData.sessionType - Type of training session (pitch, objection, closing)
 * @param {string} sessionData.title - Title of the training session
 * @param {string} [sessionData.description] - Optional description of the session
 * @param {Object} [sessionData.settings] - Optional session settings
 * @returns {Promise<Object>} The created training session object
 * @throws {Error} When user is not found or session creation fails
 * @example
 * const session = await createTrainingSession('user123', {
 *   sessionType: 'pitch',
 *   title: 'Product Presentation',
 *   description: 'Practice product presentation skills'
 * });
 */
async function createTrainingSession(userId, sessionData) {
  // Implementation
}
```

#### Class Documentation
```javascript
/**
 * Service for handling voice recording and analysis
 * @class VoiceRecorderService
 * @description Provides real-time voice recording, analysis, and feedback
 * @example
 * const voiceService = new VoiceRecorderService();
 * await voiceService.startRecording();
 * const analysis = await voiceService.analyzeRecording();
 */
class VoiceRecorderService {
  /**
   * Creates a new VoiceRecorderService instance
   * @param {Object} config - Configuration options
   * @param {number} config.sampleRate - Audio sample rate (default: 44100)
   * @param {number} config.channels - Number of audio channels (default: 1)
   * @param {string} config.audioFormat - Audio format (default: 'wav')
   */
  constructor(config = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.channels = config.channels || 1;
    this.audioFormat = config.audioFormat || 'wav';
    this.isRecording = false;
  }

  /**
   * Starts voice recording
   * @returns {Promise<void>} Resolves when recording starts
   * @throws {Error} When recording cannot be started
   */
  async startRecording() {
    // Implementation
  }

  /**
   * Stops voice recording and returns the recorded audio
   * @returns {Promise<Blob>} The recorded audio blob
   * @throws {Error} When no recording is active
   */
  async stopRecording() {
    // Implementation
  }
}
```

#### API Route Documentation
```javascript
/**
 * @route POST /api/training-sessions
 * @description Create a new training session
 * @access Private
 * @param {Object} req.body - Request body
 * @param {string} req.body.sessionType - Type of training session
 * @param {string} req.body.title - Session title
 * @param {string} [req.body.description] - Session description
 * @returns {Object} 201 - Created session object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 */
router.post('/training-sessions', auth, async (req, res) => {
  try {
    const session = await createTrainingSession(req.user.id, req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. README Documentation

#### Component README
```markdown
# VoiceRecorder Component

## Overview
Real-time voice recording component with live analysis and feedback.

## Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onRecordingComplete | function | Yes | - | Callback when recording finishes |
| settings | object | No | {} | Recording configuration |
| disabled | boolean | No | false | Disable recording functionality |

## Usage
```jsx
import VoiceRecorder from '@/components/VoiceRecorder';

function TrainingPage() {
  const handleRecordingComplete = (audioBlob, analysis) => {
    console.log('Recording completed:', analysis);
  };

  return (
    <VoiceRecorder
      onRecordingComplete={handleRecordingComplete}
      settings={{ sampleRate: 44100, channels: 1 }}
    />
  );
}
```

## Features
- Real-time voice recording
- Live audio analysis
- Performance metrics tracking
- Automatic feedback generation

## Dependencies
- `react-hooks`: Custom hooks for state management
- `audio-context`: Web Audio API wrapper
- `speech-recognition`: Browser speech recognition API
```

#### Service README
```markdown
# AuthService

## Overview
Handles user authentication, authorization, and session management.

## Methods

### `login(email, password)`
Authenticates a user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** Promise<Object>
- `token` (string): JWT authentication token
- `user` (Object): User profile data

**Throws:** Error when authentication fails

### `register(userData)`
Registers a new user account.

**Parameters:**
- `userData` (Object): User registration data
  - `email` (string): User's email address
  - `password` (string): User's password
  - `firstName` (string): User's first name
  - `lastName` (string): User's last name

**Returns:** Promise<Object>
- `token` (string): JWT authentication token
- `user` (Object): Created user profile

**Throws:** Error when registration fails

## Usage
```javascript
import AuthService from '@/services/auth';

// Login
const { token, user } = await AuthService.login('user@example.com', 'password');

// Register
const { token, user } = await AuthService.register({
  email: 'newuser@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
});
```

## Error Handling
The service throws descriptive errors for various failure scenarios:
- `ValidationError`: Invalid input data
- `AuthenticationError`: Invalid credentials
- `UserExistsError`: Email already registered
- `NetworkError`: Connection issues
```

## 🎨 Code Style Guidelines

### 1. JavaScript/TypeScript Style

#### Variable and Function Naming
```javascript
// ✅ Good: Descriptive variable names
const userTrainingSessions = await getTrainingSessions(userId);
const isRecordingActive = voiceRecorder.isRecording;
const handleRecordingStart = () => { /* ... */ };

// ❌ Bad: Unclear or abbreviated names
const sessions = await getSessions(uid);
const recording = voiceRecorder.rec;
const start = () => { /* ... */ };

// ✅ Good: Boolean variables with 'is', 'has', 'can' prefixes
const isAuthenticated = user.token !== null;
const hasPermission = user.role === 'admin';
const canEditContent = user.permissions.includes('edit');

// ✅ Good: Constants in UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.carsalesai.com';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_TIMEOUT = 5000;
```

#### Function Structure
```javascript
// ✅ Good: Clear function structure with early returns
async function processTrainingSession(sessionData) {
  // Validate input
  if (!sessionData.userId) {
    throw new Error('User ID is required');
  }

  if (!sessionData.sessionType) {
    throw new Error('Session type is required');
  }

  // Process session
  const session = await createSession(sessionData);
  
  // Start analysis
  const analysis = await analyzeSession(session);
  
  // Return result
  return {
    session,
    analysis,
    timestamp: new Date().toISOString()
  };
}

// ❌ Bad: Nested conditions and unclear flow
async function processTrainingSession(sessionData) {
  if (sessionData.userId) {
    if (sessionData.sessionType) {
      const session = await createSession(sessionData);
      const analysis = await analyzeSession(session);
      return {
        session,
        analysis,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Session type is required');
    }
  } else {
    throw new Error('User ID is required');
  }
}
```

#### Error Handling
```javascript
// ✅ Good: Proper error handling with specific error types
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

async function validateUserData(userData) {
  try {
    if (!userData.email) {
      throw new ValidationError('Email is required', 'email');
    }

    if (!userData.email.includes('@')) {
      throw new ValidationError('Invalid email format', 'email');
    }

    if (!userData.password || userData.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', 'password');
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error('Validation failed');
  }
}

// Usage with proper error handling
try {
  await validateUserData(userData);
  const user = await createUser(userData);
  res.json(user);
} catch (error) {
  if (error instanceof ValidationError) {
    res.status(400).json({
      error: error.message,
      field: error.field
    });
  } else {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}
```

### 2. React Component Style

#### Component Structure
```typescript
// ✅ Good: Well-structured React component
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { TrainingAnalytics } from '@/components/TrainingAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import type { TrainingSession, SessionAnalysis } from '@/types';

interface TrainingDashboardProps {
  userId: string;
  onSessionComplete?: (session: TrainingSession) => void;
}

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({
  userId,
  onSessionComplete
}) => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  
  // Custom hooks
  const { user } = useAuth();
  const { sessions, loading, error, createSession } = useTrainingSessions(userId);
  
  // Memoized values
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 5);
  }, [sessions]);
  
  // Event handlers
  const handleRecordingStart = useCallback(async () => {
    try {
      setIsRecording(true);
      const session = await createSession({
        sessionType: 'pitch',
        title: 'New Training Session'
      });
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [createSession]);
  
  const handleRecordingComplete = useCallback((analysis: SessionAnalysis) => {
    setIsRecording(false);
    setCurrentSession(null);
    
    if (onSessionComplete && currentSession) {
      onSessionComplete({
        ...currentSession,
        analysis
      });
    }
  }, [currentSession, onSessionComplete]);
  
  // Effects
  useEffect(() => {
    if (error) {
      console.error('Training sessions error:', error);
    }
  }, [error]);
  
  // Render
  if (loading) {
    return <div>Loading training sessions...</div>;
  }
  
  return (
    <div className="training-dashboard">
      <header className="dashboard-header">
        <h1>Training Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
      </header>
      
      <main className="dashboard-content">
        <section className="recording-section">
          <VoiceRecorder
            isRecording={isRecording}
            onRecordingStart={handleRecordingStart}
            onRecordingComplete={handleRecordingComplete}
            disabled={!user}
          />
        </section>
        
        <section className="analytics-section">
          <TrainingAnalytics sessions={recentSessions} />
        </section>
      </main>
    </div>
  );
};
```

#### Custom Hooks
```typescript
// ✅ Good: Well-structured custom hook
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import type { TrainingSession, CreateSessionData } from '@/types';

interface UseTrainingSessionsOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseTrainingSessionsReturn {
  sessions: TrainingSession[];
  loading: boolean;
  error: Error | null;
  createSession: (data: CreateSessionData) => Promise<TrainingSession>;
  updateSession: (id: string, data: Partial<TrainingSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTrainingSessions = ({
  userId,
  autoRefresh = false,
  refreshInterval = 30000
}: UseTrainingSessionsOptions): UseTrainingSessionsReturn => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/training-sessions?userId=${userId}`);
      setSessions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  const createSession = useCallback(async (data: CreateSessionData) => {
    try {
      const response = await api.post('/training-sessions', {
        ...data,
        userId
      });
      
      const newSession = response.data;
      setSessions(prev => [newSession, ...prev]);
      
      return newSession;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create session');
    }
  }, [userId]);
  
  const updateSession = useCallback(async (id: string, data: Partial<TrainingSession>) => {
    try {
      await api.put(`/training-sessions/${id}`, data);
      
      setSessions(prev => prev.map(session =>
        session.id === id ? { ...session, ...data } : session
      ));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update session');
    }
  }, []);
  
  const deleteSession = useCallback(async (id: string) => {
    try {
      await api.delete(`/training-sessions/${id}`);
      
      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete session');
    }
  }, []);
  
  // Auto-refresh effect
  useEffect(() => {
    fetchSessions();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSessions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSessions, autoRefresh, refreshInterval]);
  
  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refresh: fetchSessions
  };
};
```

### 3. CSS/Styling Guidelines

#### CSS Class Naming (BEM Methodology)
```css
/* ✅ Good: BEM naming convention */
.training-dashboard {
  padding: 2rem;
  background-color: var(--bg-primary);
}

.training-dashboard__header {
  margin-bottom: 2rem;
}

.training-dashboard__title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
}

.training-dashboard__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.training-dashboard__section {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--bg-secondary);
}

.training-dashboard__section--recording {
  border-left: 4px solid var(--accent-primary);
}

.training-dashboard__section--analytics {
  border-left: 4px solid var(--accent-secondary);
}

/* ❌ Bad: Inconsistent naming */
.dashboard {
  padding: 2rem;
}

.dashboardHeader {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: 2rem;
}
```

#### CSS Variables and Theming
```css
/* ✅ Good: CSS custom properties for theming */
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Typography */
  --font-family-primary: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Dark theme */
[data-theme="dark"] {
  --color-primary: #3b82f6;
  --color-secondary: #94a3b8;
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
}
```

## 🔧 Development Tools

### 1. ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    
    // React rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off', // Using TypeScript
    
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
```

### 2. Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 3. TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🧪 Testing Standards

### 1. Unit Testing
```typescript
// components/__tests__/VoiceRecorder.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceRecorder } from '../VoiceRecorder';

describe('VoiceRecorder', () => {
  const mockOnRecordingComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render recording button when not recording', () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        isRecording={false}
      />
    );
    
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });
  
  it('should render stop button when recording', () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        isRecording={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
  });
  
  it('should call onRecordingStart when start button is clicked', () => {
    const mockOnRecordingStart = jest.fn();
    
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        isRecording={false}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));
    
    expect(mockOnRecordingStart).toHaveBeenCalledTimes(1);
  });
  
  it('should show recording indicator when recording', () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        isRecording={true}
      />
    );
    
    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing
```typescript
// services/__tests__/authService.test.ts
import { AuthService } from '../authService';
import { api } from '../api';

// Mock the API module
jest.mock('../api');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('login', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };
      
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await AuthService.login('test@example.com', 'password123');
      
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw error with invalid credentials', async () => {
      const mockError = new Error('Invalid credentials');
      (api.post as jest.Mock).mockRejectedValue(mockError);
      
      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('register', () => {
    it('should successfully register new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
      };
      
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user456',
            ...userData
          }
        }
      };
      
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await AuthService.register(userData);
      
      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

## 📊 Code Metrics

### 1. Quality Metrics
- **Cyclomatic Complexity:** < 10 per function
- **Lines of Code:** < 50 per function, < 500 per file
- **Code Coverage:** > 80% for critical paths
- **Technical Debt:** < 5% of codebase
- **Bug Density:** < 1 bug per 1000 lines of code

### 2. Performance Metrics
- **Bundle Size:** < 2MB for main bundle
- **First Contentful Paint:** < 1.5 seconds
- **Largest Contentful Paint:** < 2.5 seconds
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

---

*This code style guide ensures consistent, maintainable, and high-quality code across the Car Sales AI Assistant project.*
