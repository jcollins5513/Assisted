# 🔒 Security & Compliance Documentation

## 📋 Overview

This document outlines the comprehensive security measures, compliance standards, and best practices implemented in the Car Sales AI Assistant platform to ensure data protection, user privacy, and system integrity.

## 🛡️ Security Architecture

### 1. Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                        │
├─────────────────────────────────────────────────────────────┤
│  Network Security (Firewalls, VPN, DDoS Protection)      │
├─────────────────────────────────────────────────────────────┤
│  Application Security (Authentication, Authorization)      │
├─────────────────────────────────────────────────────────────┤
│  Data Security (Encryption, Access Controls)              │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Security (Hardening, Monitoring)          │
├─────────────────────────────────────────────────────────────┤
│  Operational Security (Policies, Procedures, Training)    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Security Principles

- **Zero Trust Architecture:** Verify every request, never trust by default
- **Principle of Least Privilege:** Grant minimum necessary access
- **Defense in Depth:** Multiple layers of security controls
- **Security by Design:** Security integrated from the start
- **Continuous Monitoring:** Real-time threat detection and response

## 🔐 Authentication & Authorization

### 1. Multi-Factor Authentication (MFA)

```javascript
// MFA Implementation
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAService {
  // Generate TOTP secret
  static generateSecret(userId) {
    const secret = speakeasy.generateSecret({
      name: `Car Sales AI (${userId})`,
      issuer: 'Car Sales AI Assistant'
    });
    
    return {
      secret: secret.base32,
      qrCode: await QRCode.toDataURL(secret.otpauth_url)
    };
  }

  // Verify TOTP token
  static verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps for clock skew
    });
  }

  // Generate backup codes
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
```

### 2. JWT Token Security

```javascript
// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '7d',
  issuer: 'car-sales-ai',
  audience: 'car-sales-ai-users',
  algorithm: 'HS256'
};

// Token generation with enhanced security
const generateToken = (user) => {
  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex') // Unique token ID
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm
  });
};

// Token validation with blacklist checking
const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm]
    });

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### 3. Role-Based Access Control (RBAC)

```javascript
// RBAC Implementation
const roles = {
  admin: {
    permissions: ['*'],
    description: 'Full system access'
  },
  manager: {
    permissions: [
      'users:read',
      'users:update',
      'sessions:read',
      'sessions:create',
      'content:read',
      'content:create',
      'content:update',
      'analytics:read'
    ],
    description: 'Management level access'
  },
  salesperson: {
    permissions: [
      'sessions:read',
      'sessions:create',
      'content:read',
      'content:create',
      'profile:read',
      'profile:update'
    ],
    description: 'Standard user access'
  }
};

// Permission checking middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = roles[userRole]?.permissions || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        userRole: userRole
      });
    }
  };
};
```

## 🔒 Data Protection

### 1. Data Encryption

#### At Rest Encryption
```javascript
// Database encryption configuration
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Enable encryption at rest
      ssl: true,
      sslValidate: true,
      // Additional security options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// File encryption for uploads
const crypto = require('crypto');
const fs = require('fs');

class FileEncryption {
  static algorithm = 'aes-256-gcm';
  static keyLength = 32;
  static ivLength = 16;
  static saltLength = 64;
  static tagLength = 16;

  static async encryptFile(inputPath, outputPath, password) {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);
    const key = crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
    
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('car-sales-ai-file', 'utf8'));
    
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    
    output.write(salt);
    output.write(iv);
    
    input.pipe(cipher).pipe(output);
    
    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });
  }

  static async decryptFile(inputPath, outputPath, password) {
    const input = fs.createReadStream(inputPath);
    const salt = input.read(this.saltLength);
    const iv = input.read(this.ivLength);
    
    const key = crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('car-sales-ai-file', 'utf8'));
    
    const output = fs.createWriteStream(outputPath);
    
    input.pipe(decipher).pipe(output);
    
    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });
  }
}
```

#### In Transit Encryption
```javascript
// HTTPS/TLS Configuration
const https = require('https');
const fs = require('fs');

const httpsOptions = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  ca: fs.readFileSync('/path/to/ca-bundle.pem'),
  // Security settings
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256'
  ].join(':'),
  honorCipherOrder: true,
  requestCert: false,
  rejectUnauthorized: true
};

// API Security Headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' wss: https:;"
};
```

### 2. Data Masking and Anonymization

```javascript
// Data anonymization for analytics
class DataAnonymizer {
  static anonymizeUser(user) {
    return {
      id: this.hashId(user._id.toString()),
      role: user.role,
      region: this.generalizeLocation(user.profile?.region),
      ageGroup: this.categorizeAge(user.profile?.birthDate),
      experienceLevel: this.categorizeExperience(user.profile?.experienceYears),
      // Remove PII
      email: null,
      phone: null,
      firstName: null,
      lastName: null
    };
  }

  static hashId(id) {
    return crypto.createHash('sha256').update(id + process.env.HASH_SALT).digest('hex');
  }

  static generalizeLocation(location) {
    if (!location) return 'unknown';
    // Generalize to region level
    return location.split(',')[0].trim();
  }

  static categorizeAge(birthDate) {
    if (!birthDate) return 'unknown';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }
}
```

## 🛡️ Network Security

### 1. Firewall Configuration

```bash
# UFW Firewall Rules
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific application ports
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend

# Rate limiting
sudo ufw limit ssh

# Enable firewall
sudo ufw enable
```

### 2. DDoS Protection

```javascript
// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false
});

// Specific limiters for sensitive endpoints
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'login-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.'
  }
});

const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'upload-limit:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.'
  }
});
```

### 3. VPN and Secure Connections

```javascript
// VPN connection validation
const validateVPNConnection = (req, res, next) => {
  const allowedIPs = process.env.VPN_ALLOWED_IPS?.split(',') || [];
  const clientIP = req.ip;
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      error: 'Access denied. VPN connection required.'
    });
  }
  
  next();
};

// Secure WebSocket connections
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: false,
  pingTimeout: 60000,
  pingInterval: 25000
});

// WebSocket authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.sub;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});
```

## 🔍 Security Monitoring

### 1. Intrusion Detection

```javascript
// Security event logging
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security event tracking
class SecurityMonitor {
  static logSecurityEvent(event) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details,
      severity: event.severity || 'medium'
    };
    
    securityLogger.info('Security Event', securityEvent);
    
    // Alert on high severity events
    if (event.severity === 'high') {
      this.sendSecurityAlert(securityEvent);
    }
  }

  static async sendSecurityAlert(event) {
    // Send email/SMS alert
    await emailService.sendSecurityAlert(event);
    
    // Log to external security monitoring service
    if (process.env.SECURITY_WEBHOOK_URL) {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    }
  }
}

// Security middleware
const securityMiddleware = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i
  ];
  
  const userInput = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userInput)) {
      SecurityMonitor.logSecurityEvent({
        type: 'suspicious_input',
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { pattern: pattern.source, input: userInput },
        severity: 'high'
      });
      
      return res.status(400).json({
        error: 'Invalid input detected'
      });
    }
  }
  
  next();
};
```

### 2. Audit Logging

```javascript
// Comprehensive audit logging
class AuditLogger {
  static async logAction(action) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: action.userId,
      action: action.type,
      resource: action.resource,
      resourceId: action.resourceId,
      details: action.details,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      sessionId: action.sessionId
    };
    
    // Store in database
    await AuditLog.create(auditEntry);
    
    // Store in secure log file
    securityLogger.info('Audit Log', auditEntry);
  }

  static async logDataAccess(userId, resource, resourceId, details) {
    await this.logAction({
      type: 'data_access',
      userId,
      resource,
      resourceId,
      details,
      timestamp: new Date()
    });
  }

  static async logDataModification(userId, resource, resourceId, details) {
    await this.logAction({
      type: 'data_modification',
      userId,
      resource,
      resourceId,
      details,
      timestamp: new Date()
    });
  }

  static async logAuthentication(userId, success, details) {
    await this.logAction({
      type: success ? 'login_success' : 'login_failure',
      userId,
      details,
      timestamp: new Date()
    });
  }
}
```

## 📋 Compliance Standards

### 1. GDPR Compliance

```javascript
// GDPR Data Processing
class GDPRCompliance {
  // Data minimization
  static minimizeData(userData) {
    return {
      id: userData._id,
      email: userData.email,
      role: userData.role,
      // Only include necessary fields
      profile: {
        firstName: userData.profile.firstName,
        lastName: userData.profile.lastName
      }
    };
  }

  // Right to be forgotten
  static async deleteUserData(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Anonymize user data instead of deletion
      await User.findByIdAndUpdate(userId, {
        $set: {
          'profile.firstName': 'DELETED',
          'profile.lastName': 'DELETED',
          'profile.email': `deleted_${userId}@deleted.com`,
          'profile.phone': null,
          isActive: false,
          deletedAt: new Date()
        }
      });
      
      // Anonymize related data
      await TrainingSession.updateMany(
        { userId },
        { $set: { 'transcript': 'DELETED', 'audioUrl': null } }
      );
      
      await ContentProject.updateMany(
        { userId },
        { $set: { 'content.text': 'DELETED', 'content.images': [] } }
      );
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Data portability
  static async exportUserData(userId) {
    const user = await User.findById(userId);
    const sessions = await TrainingSession.find({ userId });
    const projects = await ContentProject.find({ userId });
    
    return {
      user: this.minimizeData(user),
      sessions: sessions.map(s => ({
        id: s._id,
        sessionType: s.sessionType,
        startTime: s.startTime,
        duration: s.duration,
        metrics: s.metrics
      })),
      projects: projects.map(p => ({
        id: p._id,
        title: p.title,
        type: p.type,
        createdAt: p.createdAt
      }))
    };
  }
}
```

### 2. SOC 2 Compliance

```javascript
// SOC 2 Control Framework
class SOC2Controls {
  // Access Control
  static async validateAccess(userId, resource, action) {
    const user = await User.findById(userId);
    const hasPermission = await this.checkPermission(user.role, resource, action);
    
    if (!hasPermission) {
      await AuditLogger.logAction({
        type: 'access_denied',
        userId,
        resource,
        details: { action, userRole: user.role }
      });
      
      return false;
    }
    
    await AuditLogger.logAction({
      type: 'access_granted',
      userId,
      resource,
      details: { action, userRole: user.role }
    });
    
    return true;
  }

  // Change Management
  static async logSystemChange(change) {
    await AuditLogger.logAction({
      type: 'system_change',
      userId: change.userId,
      resource: change.resource,
      details: {
        changeType: change.type,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: change.reason
      }
    });
  }

  // Backup and Recovery
  static async createBackup() {
    const timestamp = new Date().toISOString();
    const backupPath = `/backups/backup-${timestamp}.gz`;
    
    // Create encrypted backup
    await this.createEncryptedBackup(backupPath);
    
    // Verify backup integrity
    const isValid = await this.verifyBackupIntegrity(backupPath);
    
    if (isValid) {
      await AuditLogger.logAction({
        type: 'backup_created',
        details: { backupPath, timestamp }
      });
    }
    
    return { backupPath, timestamp, isValid };
  }
}
```

### 3. PCI DSS Compliance (if applicable)

```javascript
// PCI DSS Compliance for payment processing
class PCIDSSCompliance {
  // Card data masking
  static maskCardNumber(cardNumber) {
    if (!cardNumber) return null;
    const last4 = cardNumber.slice(-4);
    return `****-****-****-${last4}`;
  }

  // Secure payment processing
  static async processPayment(paymentData) {
    // Use PCI-compliant payment processor
    const paymentProcessor = new PaymentProcessor({
      apiKey: process.env.PAYMENT_API_KEY,
      environment: process.env.NODE_ENV
    });
    
    // Never store full card data
    const sanitizedData = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      // Only store masked card number
      cardNumber: this.maskCardNumber(paymentData.cardNumber)
    };
    
    const result = await paymentProcessor.charge(sanitizedData);
    
    // Log payment attempt (without sensitive data)
    await AuditLogger.logAction({
      type: 'payment_processed',
      userId: paymentData.userId,
      details: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        success: result.success,
        transactionId: result.transactionId
      }
    });
    
    return result;
  }
}
```

## 🔧 Security Testing

### 1. Automated Security Scans

```javascript
// Security testing utilities
class SecurityTester {
  // SQL Injection testing
  static async testSQLInjection(endpoint, payloads) {
    const results = [];
    
    for (const payload of payloads) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload })
        });
        
        results.push({
          payload,
          status: response.status,
          vulnerable: response.status === 500
        });
      } catch (error) {
        results.push({
          payload,
          error: error.message,
          vulnerable: false
        });
      }
    }
    
    return results;
  }

  // XSS testing
  static async testXSS(endpoint, payloads) {
    const results = [];
    
    for (const payload of payloads) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: payload })
        });
        
        const responseText = await response.text();
        const vulnerable = responseText.includes(payload);
        
        results.push({
          payload,
          vulnerable,
          responseLength: responseText.length
        });
      } catch (error) {
        results.push({
          payload,
          error: error.message,
          vulnerable: false
        });
      }
    }
    
    return results;
  }
}
```

### 2. Penetration Testing

```bash
# Automated penetration testing script
#!/bin/bash

# Run OWASP ZAP security scan
zap-cli quick-scan --self-contained \
  --spider http://localhost:3000 \
  --ajax-spider \
  --scan \
  --alert-level High \
  --output-format json \
  --output zap-report.json

# Run nmap security scan
nmap -sS -sV -O -p- localhost > nmap-report.txt

# Run Nikto web server scanner
nikto -h http://localhost:3000 -o nikto-report.txt

# Run SQLMap for SQL injection testing
sqlmap -u "http://localhost:3000/api/users" --batch --random-agent
```

## 📊 Security Metrics

### 1. Security Dashboard

```javascript
// Security metrics collection
class SecurityMetrics {
  static async getSecurityMetrics() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const metrics = {
      // Authentication metrics
      totalLogins: await AuditLog.countDocuments({
        action: 'login_success',
        timestamp: { $gte: last30Days }
      }),
      failedLogins: await AuditLog.countDocuments({
        action: 'login_failure',
        timestamp: { $gte: last30Days }
      }),
      
      // Security events
      securityEvents: await AuditLog.countDocuments({
        action: { $in: ['suspicious_input', 'access_denied', 'security_alert'] },
        timestamp: { $gte: last30Days }
      }),
      
      // Data access
      dataAccessEvents: await AuditLog.countDocuments({
        action: 'data_access',
        timestamp: { $gte: last30Days }
      }),
      
      // System changes
      systemChanges: await AuditLog.countDocuments({
        action: 'system_change',
        timestamp: { $gte: last30Days }
      })
    };
    
    // Calculate security scores
    metrics.loginSuccessRate = metrics.totalLogins / (metrics.totalLogins + metrics.failedLogins);
    metrics.securityScore = this.calculateSecurityScore(metrics);
    
    return metrics;
  }

  static calculateSecurityScore(metrics) {
    let score = 100;
    
    // Deduct points for security events
    score -= metrics.securityEvents * 5;
    
    // Deduct points for high failure rate
    if (metrics.loginSuccessRate < 0.95) {
      score -= (0.95 - metrics.loginSuccessRate) * 100;
    }
    
    return Math.max(0, score);
  }
}
```

---

*This security documentation provides comprehensive coverage of all security aspects, compliance requirements, and best practices for the Car Sales AI Assistant platform.*
