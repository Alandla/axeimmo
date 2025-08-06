# 🚀 Hoox API Implementation

This document provides an overview of the complete Hoox API implementation with all the features requested.

## ✅ Implemented Features

### 🔑 API Key System
- **Model**: Integrated in `src/models/Space.ts` - API key embedded in Space schema
- **DAO**: `src/dao/apiKeyDao.ts` - Database operations with secure key generation
- **Authentication**: `src/lib/api-auth.ts` - Middleware for API authentication
- **UI Component**: `src/components/api-key-management.tsx` - React component for managing keys
- **API Routes**: `src/app/api/space/[id]/api-key/route.ts` - CRUD operations for API keys

### 🌐 Public API Routes
All routes are under `/api/public/v1/` with full authentication and rate limiting:

#### Video Generation
- `POST /generation/start` - Start video generation
- `GET /generation/status/{jobId}` - Check generation status

#### Video Export  
- `POST /export/start` - Start video export
- `GET /export/status/{jobId}` - Check export status

#### Resources
- `GET /resources/voices` - List available voices (filtered by plan)
- `GET /resources/avatars` - List available avatars

### 🔄 Rate Limiting & Redis
- **Redis Setup**: Added to `docker-compose.yml` for local development
- **Rate Limiting**: `src/lib/rate-limiting.ts` - Redis-based rate limiting
- **Headers**: Proper rate limit headers in all responses

### 🎯 Enhanced Video Generation
- **New Parameters**: Added `use_space_media` and `save_media_to_space` controls
- **Media Transformation**: `src/lib/media-transformer.ts` - Convert URLs to IMedia objects
- **Script Generation**: `src/lib/script-generation.ts` - Extracted from AI chat component
- **Webhook Support**: Real-time notifications when jobs complete

### 📚 Complete Mintlify Documentation
- **Configuration**: `docs/mint.json` - Mintlify setup
- **Getting Started**: Introduction, Quick Start, Authentication, Error Handling
- **Guides**: Video Generation Overview, Webhooks Overview
- **API Reference**: Complete OpenAPI-style documentation for all endpoints

### 🔔 Webhook System
- **Implementation**: `src/lib/webhooks.ts` - Webhook delivery with retry logic
- **Integration**: Added to `generate-video.ts` and export tasks
- **Security**: Proper headers and validation
- **Documentation**: Complete webhook guide with examples

## 🛠️ Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```bash
# Redis for rate limiting
REDIS_URL=redis://localhost:6379

# API Base URL (for documentation)
API_BASE_URL=https://api.hoox.video/v1
```

### 2. Start Redis (Local Development)
```bash
docker-compose up redis -d
```

### 3. Install Dependencies
```bash
npm install ioredis bcryptjs
npm install @types/bcryptjs --save-dev
```

### 4. Database Migration
The API key is now embedded in the Space model. No migration needed - existing spaces will get the apiKey field when they first generate a key.

**Performance Optimization**: The system automatically creates a MongoDB index on `apiKey.keyPrefix` and `apiKey.isActive` for ultra-fast API key validation (O(1) lookup instead of O(n) scan).

## 🔐 API Key Management

### For Users (Enterprise Plan Required)
1. Go to **Settings** > **API** in the dashboard
2. Click **Generate API Key**
3. Copy and save the key (shown only once)
4. Use in API calls: `Authorization: Bearer hx_live_your_key_here`

### For Developers
```javascript
// Generate a new API key
const { apiKey, plainKey } = await createApiKey(spaceId, "My API Key");

// Validate an API key
const result = await validateApiKey(plainKey);
if (result) {
  const { space, apiKey } = result;
  // Key is valid, proceed with request
}
```

## 📡 API Usage Examples

### Start Video Generation
```bash
curl -X POST "https://api.hoox.video/v1/generation/start" \
  -H "Authorization: Bearer hx_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a video about AI",
    "voice_id": "en-US-JennyNeural",
    "format": "vertical",
    "webSearch": {
      "script": true,
      "images": true
    },
    "webhook_url": "https://your-app.com/webhook"
  }'
```

### Check Status
```bash
curl -X GET "https://api.hoox.video/v1/generation/status/run_123" \
  -H "Authorization: Bearer hx_live_your_api_key_here"
```

### Export Video
```bash
curl -X POST "https://api.hoox.video/v1/export/start" \
  -H "Authorization: Bearer hx_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "video_456",
    "format": "square"
  }'
```

## 🎛️ New Generation Parameters

### Media Control
```json
{
  "use_space_media": false,      // Don't use workspace media
  "save_media_to_space": false   // Don't save generated media to workspace
}
```

### Animation Control
```json
{
  "animate_image": true,
  "animate_mode": "pro",         // or "standard"
  "animate_image_max": 3         // Limit animations for cost control
}
```

### Web Search
```json
{
  "webSearch": {
    "script": true,              // Enhance script with web research
    "images": true               // Find relevant images
  }
}
```

## 🔍 Error Handling

All API errors follow a consistent format:
```json
{
  "error": "Brief description",
  "details": [
    {
      "code": "specific_error_code",
      "message": "Detailed message",
      "field": "field_name"
    }
  ]
}
```

Common error codes:
- `invalid_api_key` (401) - Invalid or missing API key
- `plan_required` (403) - Enterprise plan required
- `insufficient_credits` (402) - Not enough credits
- `rate_limit_exceeded` (429) - Too many requests

## 📊 Rate Limiting

- **Enterprise Plan**: 100 requests per minute
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Redis-based**: Distributed rate limiting with automatic cleanup

## 🔔 Webhooks

Configure webhooks to receive real-time notifications:

```json
{
  "job_id": "run_123",
  "status": "completed",
  "result": {
    "video_id": "video_456",
    "cost": 5,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## 📖 Documentation

The complete API documentation is available at:
- **Local**: `http://localhost:3000/docs` (when running Mintlify)
- **Production**: `https://docs.hoox.video`

To run documentation locally:
```bash
cd docs
npx @mintlify/cli dev
```

## 🧪 Testing

### Test API Key Generation
```javascript
const { createApiKey } = require('./src/dao/apiKeyDao');

// Test key generation
const result = await createApiKey('space_id_here', 'Test Key');
console.log('Generated key:', result.plainKey);
```

### Test Rate Limiting
```javascript
const { checkRateLimit } = require('./src/lib/rate-limiting');

// Test rate limiting
const result = await checkRateLimit('space_id_here', 100);
console.log('Rate limit result:', result);
```

## 🚀 Deployment Notes

### Production Checklist
- [ ] Set up Redis cluster for high availability
- [ ] Configure proper CORS headers for API routes
- [ ] Set up monitoring for webhook delivery failures
- [ ] Configure log aggregation for API usage
- [ ] Set up alerts for rate limit violations
- [ ] Document API key rotation procedures

### Security Considerations
- API keys are hashed with bcrypt (cost 12)
- Rate limiting prevents abuse
- Webhook URLs are validated
- Enterprise plan required for API access
- Proper error messages without sensitive data exposure

## 📞 Support

For API support:
- **Email**: support@hoox.video
- **Discord**: https://discord.gg/hoox
- **Documentation**: https://docs.hoox.video

---

🎉 **The Hoox API is now complete and ready for Enterprise customers!**