# 🚗 Car Sales AI Assistant - Setup Guide

## 📋 Prerequisites

Before setting up the Car Sales AI Assistant, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v5 or higher)
- **Redis** (optional, for caching)
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd car-sales-ai-assistant
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Copy the environment example file and configure your variables:

```bash
cp env.example .env
```

## 🔧 Environment Variables Setup

### Required Variables (Minimum Setup)

```bash
# Application Configuration
NODE_ENV=development
PORT=3001

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME="Car Sales AI Assistant"

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/car-sales-ai

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Voice Recognition & AI Services

For voice assistant features, you'll need one of these services:

#### Option 1: Google Cloud Speech-to-Text
```bash
GOOGLE_CLOUD_SPEECH_API_KEY=your-google-cloud-speech-api-key
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Speech-to-Text API
4. Create a service account and download JSON key
5. Set the API key in your environment

#### Option 2: Azure Speech Services
```bash
AZURE_SPEECH_SERVICE_KEY=your-azure-speech-service-key
AZURE_SPEECH_SERVICE_REGION=your-azure-region
```

**Setup Instructions:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Speech Service resource
3. Get the key and region from the resource
4. Set both variables in your environment

### Content Generation Services

For AI-powered content generation:

#### OpenAI (Recommended)
```bash
OPENAI_API_KEY=your-openai-api-key
```

**Setup Instructions:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add billing information
4. Set the API key in your environment

#### Alternative: Anthropic Claude
```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Social Media Integration

For publishing content to social media platforms:

#### Facebook
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

**Setup Instructions:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Get App ID and App Secret
5. Configure OAuth redirect URIs

#### Twitter/X
```bash
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret
```

**Setup Instructions:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate access tokens
4. Set all four variables in your environment

### Remote Execution & Background Removal

For the background removal feature:

```bash
REMOTE_EXECUTION_ENABLED=true
BACKGROUND_REMOVAL_MODEL=u2net
PYTHON_PATH=/path/to/python/environment
BACKGROUND_REMOVAL_SCRIPT_PATH=/path/to/backgroundremover-cli.ps1
PROCESSING_INPUT_PATH=/path/to/processing/input
PROCESSING_OUTPUT_PATH=/path/to/processing/output
```

**Setup Instructions:**
1. Install Python 3.8+ on your remote server
2. Install backgroundremover: `pip install backgroundremover`
3. Create input/output directories
4. Update the paths in your environment

### Quality Assessment

For automatic quality assessment of processed images:

```bash
QUALITY_ASSESSMENT_ENABLED=true
QUALITY_THRESHOLD=70
AUTO_APPROVAL_THRESHOLD=90
```

### Real-time Communication

For real-time voice analysis and feedback:

```bash
SOCKET_IO_ENABLED=true
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

## 🗄️ Database Setup

### MongoDB Setup

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # macOS
   brew install mongodb-community
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongodb
   
   # macOS
   brew services start mongodb-community
   
   # Windows
   # Start MongoDB service
   ```

3. **Create Database:**
   ```bash
   mongo
   use car-sales-ai
   db.createUser({
     user: "admin",
     pwd: "password",
     roles: ["readWrite"]
   })
   ```

### Redis Setup (Optional)

For caching and session management:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

### Production Mode

1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

## 🔐 Authentication Setup

The application uses JWT-based authentication. Default admin credentials:

- **Email:** admin@carsalesai.com
- **Password:** admin123

**Important:** Change these credentials in production!

## 📊 Monitoring & Analytics

### Sentry (Error Tracking)
```bash
SENTRY_DSN=your-sentry-dsn
```

**Setup Instructions:**
1. Go to [Sentry](https://sentry.io/)
2. Create a new project
3. Get the DSN from project settings
4. Set in your environment

### Google Analytics
```bash
GOOGLE_ANALYTICS_ID=your-ga-id
```

**Setup Instructions:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property
3. Get the Measurement ID
4. Set in your environment

## 🔧 Advanced Configuration

### Docker Deployment

1. **Build Images:**
   ```bash
   docker-compose build
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Kubernetes Deployment

1. **Apply ConfigMaps:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

2. **Apply Secrets:**
   ```bash
   kubectl apply -f k8s/secrets.yaml
   ```

3. **Deploy Application:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network access

2. **Voice Recognition Not Working:**
   - Verify API keys are set correctly
   - Check browser microphone permissions
   - Ensure HTTPS in production

3. **Background Removal Fails:**
   - Verify Python environment path
   - Check script permissions
   - Ensure input/output directories exist

4. **Social Media Publishing Fails:**
   - Verify app credentials
   - Check OAuth redirect URIs
   - Ensure proper permissions

### Logs

Check logs for debugging:

```bash
# Backend logs
cd backend
npm run logs

# Frontend logs
cd frontend
npm run logs
```

## 📞 Support

For additional support:

1. Check the [Documentation](./docs/)
2. Review [Troubleshooting Guide](./docs/user-manual/troubleshooting.md)
3. Create an issue on GitHub
4. Contact support team

## 🔄 Updates

To update the application:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart services
npm run restart
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
