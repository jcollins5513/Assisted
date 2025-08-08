# 🏗️ System Architecture Documentation

## 📋 Overview

The Car Sales AI Assistant is a comprehensive platform designed to enhance automotive sales training, content creation, and remote image processing. The system follows a modern microservices architecture with clear separation of concerns and scalable design patterns.

## 🏛️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React App     │    │ • Express API   │    │ • AI Services   │
│ • TypeScript    │    │ • TypeScript    │    │ • Cloud Storage │
│ • Tailwind CSS  │    │ • MongoDB       │    │ • Email Service │
│ • Real-time UI  │    │ • JWT Auth      │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Infrastructure │
                    │                 │
                    │ • Docker        │
                    │ • Nginx         │
                    │ • SSL/TLS       │
                    │ • Load Balancer │
                    └─────────────────┘
```

## 🧩 Core Components

### 1. Frontend Application (`frontend/`)

**Technology Stack:**
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + Context API
- **Real-time:** WebSocket connections for live updates

**Key Components:**
- `DashboardLayout.tsx` - Main application layout
- `Header.tsx` - Navigation and user controls
- `Sidebar.tsx` - Module navigation
- `VoiceRecorder.tsx` - Real-time voice analysis
- `ContentGenerator.tsx` - AI-powered content creation
- `ScriptExecutor.tsx` - Remote execution interface

### 2. Backend API (`backend/`)

**Technology Stack:**
- **Runtime:** Node.js with Express
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens
- **File Upload:** Multer with cloud storage
- **Real-time:** Socket.io for live communication

**Key Services:**
- `authService.ts` - Authentication and authorization
- `apiService.ts` - External API integrations
- `remoteExecutionService.ts` - Background removal processing
- `conversationAnalysisService.ts` - Voice analysis and feedback

### 3. Database Design

**Collections:**
```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  role: String, // 'admin', 'manager', 'salesperson'
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    dealership: String
  },
  preferences: {
    language: String,
    theme: String,
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// Training Sessions Collection
{
  _id: ObjectId,
  userId: ObjectId,
  sessionType: String, // 'pitch', 'objection', 'closing'
  startTime: Date,
  endTime: Date,
  duration: Number,
  metrics: {
    confidence: Number,
    clarity: Number,
    pace: Number,
    volume: Number
  },
  transcript: String,
  feedback: [{
    timestamp: Date,
    type: String, // 'suggestion', 'correction', 'praise'
    message: String,
    severity: String // 'low', 'medium', 'high'
  }],
  status: String // 'active', 'completed', 'paused'
}

// Content Projects Collection
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  type: String, // 'social', 'email', 'print', 'video'
  content: {
    text: String,
    images: [String], // URLs
    templates: [String]
  },
  settings: {
    platform: String,
    targetAudience: String,
    tone: String
  },
  status: String, // 'draft', 'review', 'published'
  createdAt: Date,
  updatedAt: Date
}

// Processing Jobs Collection
{
  _id: ObjectId,
  userId: ObjectId,
  jobType: String, // 'background_removal', 'image_enhancement'
  inputFiles: [String], // URLs
  outputFiles: [String], // URLs
  settings: {
    quality: String, // 'low', 'medium', 'high'
    format: String,
    options: Object
  },
  status: String, // 'pending', 'processing', 'completed', 'failed'
  progress: Number, // 0-100
  error: String,
  createdAt: Date,
  completedAt: Date
}
```

## 🔄 Data Flow

### 1. Authentication Flow
```
User Login → JWT Token Generation → Token Validation → Protected Routes
```

### 2. Real-time Training Flow
```
Voice Input → WebSocket → Backend Processing → AI Analysis → Real-time Feedback
```

### 3. Content Creation Flow
```
User Input → AI Processing → Content Generation → Preview → Publishing
```

### 4. Remote Execution Flow
```
File Upload → Job Queue → Remote Processing → Progress Updates → Download
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens:** Secure token-based authentication
- **Role-based Access:** Different permissions for different user roles
- **Session Management:** Automatic token refresh and session timeout
- **Multi-factor Authentication:** Optional 2FA for enhanced security

### Data Protection
- **Encryption:** All sensitive data encrypted at rest and in transit
- **Input Validation:** Comprehensive input sanitization and validation
- **Rate Limiting:** API rate limiting to prevent abuse
- **CORS Configuration:** Proper cross-origin resource sharing setup

### Network Security
- **HTTPS/TLS:** All communications encrypted with TLS 1.3
- **API Security:** Secure API endpoints with proper authentication
- **File Upload Security:** Secure file upload with validation and scanning

## 📊 Performance Architecture

### Frontend Optimization
- **Code Splitting:** Dynamic imports for better loading performance
- **Image Optimization:** Next.js image optimization and lazy loading
- **Caching:** Browser caching and CDN integration
- **Bundle Optimization:** Tree shaking and minification

### Backend Optimization
- **Database Indexing:** Optimized MongoDB indexes for fast queries
- **Connection Pooling:** Efficient database connection management
- **Caching:** Redis caching for frequently accessed data
- **Load Balancing:** Horizontal scaling with load balancers

### Real-time Performance
- **WebSocket Optimization:** Efficient real-time communication
- **Streaming:** Audio streaming for real-time voice analysis
- **Queue Management:** Background job processing with queues

## 🔧 Deployment Architecture

### Containerization
```dockerfile
# Frontend Container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Backend Container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Infrastructure
- **Reverse Proxy:** Nginx for load balancing and SSL termination
- **Container Orchestration:** Docker Compose for local development
- **Cloud Deployment:** Kubernetes-ready for production scaling
- **Monitoring:** Application performance monitoring and logging

## 🔄 API Architecture

### RESTful Design
- **Resource-based URLs:** `/api/v1/users`, `/api/v1/sessions`
- **HTTP Methods:** GET, POST, PUT, DELETE for CRUD operations
- **Status Codes:** Proper HTTP status codes for responses
- **Pagination:** Offset and limit-based pagination

### Real-time Communication
- **WebSocket Events:** Real-time updates for training sessions
- **Event-driven Architecture:** Pub/sub pattern for scalability
- **Connection Management:** Automatic reconnection and heartbeat

## 🧪 Testing Architecture

### Testing Strategy
- **Unit Tests:** Individual component and function testing
- **Integration Tests:** API endpoint and database testing
- **E2E Tests:** Complete user workflow testing
- **Performance Tests:** Load testing and performance validation

### Test Coverage
- **Frontend:** React Testing Library and Jest
- **Backend:** Mocha and Chai for API testing
- **Database:** MongoDB memory server for testing
- **E2E:** Playwright for browser automation

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless Design:** No session state stored on servers
- **Load Balancing:** Multiple server instances
- **Database Sharding:** Horizontal database scaling
- **CDN Integration:** Global content delivery

### Vertical Scaling
- **Resource Optimization:** Efficient memory and CPU usage
- **Database Optimization:** Query optimization and indexing
- **Caching Strategy:** Multi-level caching implementation
- **Connection Pooling:** Efficient resource management

## 🔄 Monitoring & Logging

### Application Monitoring
- **Performance Metrics:** Response times, throughput, error rates
- **User Analytics:** Feature usage and user behavior tracking
- **System Health:** Server health and resource utilization
- **Error Tracking:** Comprehensive error logging and alerting

### Logging Strategy
- **Structured Logging:** JSON-formatted logs for easy parsing
- **Log Levels:** DEBUG, INFO, WARN, ERROR levels
- **Centralized Logging:** Central log aggregation and analysis
- **Audit Trail:** Complete audit trail for security compliance

## 🚀 Future Architecture Considerations

### Microservices Migration
- **Service Decomposition:** Breaking down into smaller services
- **API Gateway:** Centralized API management
- **Service Discovery:** Dynamic service registration and discovery
- **Event Sourcing:** Event-driven architecture for scalability

### Cloud-Native Features
- **Serverless Functions:** AWS Lambda for specific operations
- **Container Orchestration:** Kubernetes for production deployment
- **Service Mesh:** Istio for service-to-service communication
- **Observability:** Distributed tracing and monitoring

---

*This architecture documentation provides a comprehensive overview of the Car Sales AI Assistant system design, implementation details, and scalability considerations.*
