# 🔌 API Reference - Car Sales AI Assistant

## Overview

The Car Sales AI Assistant API provides programmatic access to all platform features. This RESTful API allows you to integrate the platform with your existing systems and build custom applications.

---

## 🔐 Authentication

### API Keys
All API requests require authentication using API keys.

```bash
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key
1. Log into your account
2. Navigate to Settings > API Keys
3. Generate a new API key
4. Store it securely

### Rate Limiting
- **Standard Plan**: 1,000 requests per hour
- **Professional Plan**: 10,000 requests per hour
- **Enterprise Plan**: 100,000 requests per hour

---

## 📡 Base URL

```
Production: https://api.carsalesai.com/v1
Staging: https://api-staging.carsalesai.com/v1
```

---

## 🎯 Sales Training API

### Start Training Session

**POST** `/training/sessions`

Start a new sales training session.

#### Request Body
```json
{
  "session_type": "live" | "practice" | "review",
  "training_focus": "negotiation" | "product_knowledge" | "objection_handling" | "closing",
  "customer_profile": {
    "type": "first_time" | "returning" | "comparison_shopper",
    "budget_range": "low" | "medium" | "high",
    "preferences": ["suv", "sedan", "electric"]
  },
  "goals": {
    "target_score": 85,
    "focus_areas": ["objection_handling", "closing_techniques"]
  }
}
```

#### Response
```json
{
  "session_id": "sess_123456789",
  "status": "active",
  "websocket_url": "wss://api.carsalesai.com/ws/training/sess_123456789",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Session Analysis

**GET** `/training/sessions/{session_id}/analysis`

Retrieve analysis results for a completed session.

#### Response
```json
{
  "session_id": "sess_123456789",
  "overall_score": 87,
  "duration_minutes": 25,
  "metrics": {
    "conversation_quality": 85,
    "objection_resolution_rate": 90,
    "closing_attempts": 3,
    "customer_engagement": 88
  },
  "feedback": [
    {
      "timestamp": "2024-01-15T10:32:15Z",
      "type": "positive",
      "message": "Excellent objection handling",
      "category": "objection_handling"
    }
  ],
  "improvement_areas": [
    {
      "category": "closing_techniques",
      "suggestion": "Try assumptive closing more frequently",
      "priority": "high"
    }
  ]
}
```

### List Training Sessions

**GET** `/training/sessions`

Retrieve a list of training sessions.

#### Query Parameters
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (active, completed, archived)
- `date_from` (string): Filter from date (ISO 8601)
- `date_to` (string): Filter to date (ISO 8601)

#### Response
```json
{
  "sessions": [
    {
      "session_id": "sess_123456789",
      "session_type": "live",
      "training_focus": "negotiation",
      "overall_score": 87,
      "duration_minutes": 25,
      "created_at": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🎨 Content Creator API

### Create Content

**POST** `/content/create`

Generate new marketing content.

#### Request Body
```json
{
  "content_type": "social_media" | "email" | "print" | "video",
  "platform": "facebook" | "instagram" | "linkedin" | "email",
  "template_id": "template_123",
  "content_data": {
    "headline": "Amazing Deal on SUVs!",
    "body_text": "Limited time offer on our best-selling SUVs",
    "call_to_action": "Schedule Test Drive",
    "vehicle_info": {
      "make": "Toyota",
      "model": "RAV4",
      "year": 2024,
      "price": 35000
    }
  },
  "brand_settings": {
    "colors": ["#FF6B35", "#004E89"],
    "logo_url": "https://example.com/logo.png",
    "font_family": "Arial"
  }
}
```

#### Response
```json
{
  "content_id": "cont_123456789",
  "status": "generated",
  "preview_url": "https://api.carsalesai.com/preview/cont_123456789",
  "download_url": "https://api.carsalesai.com/download/cont_123456789",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Publish Content

**POST** `/content/{content_id}/publish`

Publish content to connected social media platforms.

#### Request Body
```json
{
  "platforms": ["facebook", "instagram"],
  "scheduled_time": "2024-01-15T15:00:00Z",
  "publish_settings": {
    "caption": "Check out this amazing deal!",
    "hashtags": ["#carsale", "#dealership", "#suv"],
    "location": "Downtown Auto Sales"
  }
}
```

#### Response
```json
{
  "publish_id": "pub_123456789",
  "status": "scheduled",
  "platform_posts": [
    {
      "platform": "facebook",
      "post_id": "fb_123456789",
      "status": "scheduled",
      "scheduled_time": "2024-01-15T15:00:00Z"
    }
  ]
}
```

### List Templates

**GET** `/content/templates`

Retrieve available content templates.

#### Query Parameters
- `category` (string): Filter by category
- `platform` (string): Filter by platform
- `format` (string): Filter by format

#### Response
```json
{
  "templates": [
    {
      "template_id": "template_123",
      "name": "Vehicle Showcase",
      "category": "social_media",
      "platform": "facebook",
      "format": "1200x630",
      "preview_url": "https://api.carsalesai.com/templates/template_123/preview",
      "customizable_fields": ["headline", "body_text", "image", "cta"]
    }
  ]
}
```

---

## 🔧 Remote Execution API

### Upload Image for Processing

**POST** `/remote-execution/upload`

Upload an image for background removal processing.

#### Request Body (Multipart Form)
```
image: [file] - Image file (JPG, PNG, TIFF, WebP)
quality: "fast" | "standard" | "high" | "ultra"
output_format: "png" | "jpeg" | "tiff" | "webp"
```

#### Response
```json
{
  "job_id": "job_123456789",
  "status": "uploaded",
  "file_size": 2048576,
  "original_format": "jpg",
  "estimated_processing_time": 120
}
```

### Get Processing Status

**GET** `/remote-execution/jobs/{job_id}`

Check the status of a processing job.

#### Response
```json
{
  "job_id": "job_123456789",
  "status": "processing",
  "progress": 65,
  "estimated_completion": "2024-01-15T10:35:00Z",
  "file_info": {
    "original_size": 2048576,
    "processed_size": 1856320,
    "format": "png"
  }
}
```

### Download Processed Image

**GET** `/remote-execution/jobs/{job_id}/download`

Download the processed image.

#### Response
- **Success**: File download with appropriate headers
- **Error**: JSON error response

```json
{
  "error": "Job not completed",
  "status": "processing",
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

### Batch Processing

**POST** `/remote-execution/batch`

Process multiple images in batch.

#### Request Body
```json
{
  "images": [
    {
      "file_id": "file_123",
      "quality": "standard",
      "output_format": "png"
    }
  ],
  "priority": "normal" | "high",
  "callback_url": "https://your-domain.com/webhook"
}
```

#### Response
```json
{
  "batch_id": "batch_123456789",
  "total_jobs": 5,
  "status": "queued",
  "estimated_completion": "2024-01-15T11:00:00Z"
}
```

---

## 👥 User Management API

### Get User Profile

**GET** `/users/profile`

Retrieve current user profile information.

#### Response
```json
{
  "user_id": "user_123456789",
  "email": "john@dealership.com",
  "first_name": "John",
  "last_name": "Smith",
  "role": "sales_representative",
  "dealership": {
    "name": "Downtown Auto Sales",
    "location": "New York, NY"
  },
  "subscription": {
    "plan": "professional",
    "status": "active",
    "expires_at": "2024-12-31T23:59:59Z"
  },
  "preferences": {
    "training_focus": ["negotiation", "closing"],
    "content_templates": ["vehicle_showcase", "promotional"],
    "notification_settings": {
      "email": true,
      "push": false,
      "sms": false
    }
  }
}
```

### Update User Profile

**PUT** `/users/profile`

Update user profile information.

#### Request Body
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "preferences": {
    "training_focus": ["negotiation", "product_knowledge"],
    "notification_settings": {
      "email": true,
      "push": true
    }
  }
}
```

### Get User Analytics

**GET** `/users/analytics`

Retrieve user performance analytics.

#### Query Parameters
- `period` (string): Time period (week, month, quarter, year)
- `metrics` (string): Comma-separated list of metrics

#### Response
```json
{
  "period": "month",
  "training_sessions": {
    "total": 45,
    "average_score": 84,
    "improvement": 12
  },
  "content_created": {
    "total": 23,
    "published": 18,
    "engagement_rate": 4.2
  },
  "remote_processing": {
    "images_processed": 156,
    "average_quality": 92,
    "processing_time": 180
  }
}
```

---

## 📊 Analytics API

### Get Performance Metrics

**GET** `/analytics/performance`

Retrieve overall performance metrics.

#### Query Parameters
- `date_from` (string): Start date (ISO 8601)
- `date_to` (string): End date (ISO 8601)
- `group_by` (string): Grouping (day, week, month)

#### Response
```json
{
  "period": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-31T23:59:59Z"
  },
  "training_metrics": {
    "sessions_completed": 150,
    "average_score": 82,
    "top_performers": [
      {
        "user_id": "user_123",
        "name": "John Smith",
        "average_score": 89
      }
    ]
  },
  "content_metrics": {
    "content_created": 89,
    "engagement_rate": 4.1,
    "top_performing_content": [
      {
        "content_id": "cont_123",
        "type": "social_media",
        "engagement": 156
      }
    ]
  },
  "processing_metrics": {
    "images_processed": 1200,
    "average_quality": 91,
    "processing_time": 165
  }
}
```

### Get Usage Statistics

**GET** `/analytics/usage`

Retrieve platform usage statistics.

#### Response
```json
{
  "active_users": 45,
  "daily_active_users": 32,
  "feature_usage": {
    "training_module": {
      "active_sessions": 8,
      "sessions_today": 23
    },
    "content_creator": {
      "content_created_today": 12,
      "published_today": 8
    },
    "remote_execution": {
      "jobs_processing": 5,
      "jobs_completed_today": 45
    }
  },
  "system_health": {
    "uptime": 99.9,
    "response_time": 245,
    "error_rate": 0.1
  }
}
```

---

## 🔔 Webhooks

### Webhook Configuration

**POST** `/webhooks`

Configure webhook endpoints.

#### Request Body
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["training.completed", "content.published", "processing.completed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

#### Training Session Completed
```json
{
  "event": "training.completed",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "session_id": "sess_123456789",
    "user_id": "user_123",
    "overall_score": 87,
    "duration_minutes": 25
  }
}
```

#### Content Published
```json
{
  "event": "content.published",
  "timestamp": "2024-01-15T15:00:00Z",
  "data": {
    "content_id": "cont_123456789",
    "platform": "facebook",
    "post_id": "fb_123456789",
    "published_at": "2024-01-15T15:00:00Z"
  }
}
```

#### Processing Completed
```json
{
  "event": "processing.completed",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "job_id": "job_123456789",
    "status": "completed",
    "download_url": "https://api.carsalesai.com/download/job_123456789"
  }
}
```

---

## ❌ Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Common Error Codes
- `INVALID_REQUEST`: Invalid request parameters
- `UNAUTHORIZED`: Invalid or missing API key
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error

---

## 📚 SDK Libraries

### JavaScript/TypeScript
```bash
npm install @carsalesai/sdk
```

```javascript
import { CarSalesAI } from '@carsalesai/sdk';

const client = new CarSalesAI('YOUR_API_KEY');

// Start training session
const session = await client.training.startSession({
  session_type: 'live',
  training_focus: 'negotiation'
});

// Create content
const content = await client.content.create({
  content_type: 'social_media',
  platform: 'facebook',
  template_id: 'template_123'
});
```

### Python
```bash
pip install carsalesai-sdk
```

```python
from carsalesai import CarSalesAI

client = CarSalesAI('YOUR_API_KEY')

# Start training session
session = client.training.start_session(
    session_type='live',
    training_focus='negotiation'
)

# Create content
content = client.content.create(
    content_type='social_media',
    platform='facebook',
    template_id='template_123'
)
```

---

## 🔧 Rate Limits

### Standard Plan
- **Training API**: 100 requests/hour
- **Content API**: 200 requests/hour
- **Remote Execution**: 50 requests/hour

### Professional Plan
- **Training API**: 1,000 requests/hour
- **Content API**: 2,000 requests/hour
- **Remote Execution**: 500 requests/hour

### Enterprise Plan
- **Training API**: 10,000 requests/hour
- **Content API**: 20,000 requests/hour
- **Remote Execution**: 5,000 requests/hour

---

## 📞 Support

For API support:
- **Email**: api-support@carsalesai.com
- **Documentation**: https://docs.carsalesai.com/api
- **Status Page**: https://status.carsalesai.com
- **Community**: https://community.carsalesai.com

---

*This API reference covers the core endpoints. For additional endpoints and advanced features, refer to the complete API documentation.*
