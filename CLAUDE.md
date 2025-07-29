# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint

### No Testing Framework
This project does not have automated tests configured. Manual testing should be done through the browser interface.

## Project Architecture

**Hoox** is an AI-powered video generation SaaS platform built with Next.js 14 that creates automated video content from text prompts. The architecture follows a multi-tenant workspace model with advanced AI integrations and background job processing.

### Core Technologies
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** + **shadcn/ui** components
- **NextAuth.js v5** with MongoDB adapter
- **MongoDB** with Mongoose ODM
- **Remotion** for video generation and rendering
- **Trigger.dev** for background job processing
- **Zustand** for client state management
- **next-intl** for internationalization

### Key Architecture Patterns

#### 1. Multi-Tenant Space System
Users can create multiple "spaces" (workspaces), each with isolated media libraries, videos, and settings. Space ownership and permissions are enforced at the API level.

#### 2. AI-First Video Pipeline
- Multi-provider AI integration (Anthropic, Groq, FAL.ai, WorkflowAI)
- Intelligent script generation and enhancement
- Automatic image extraction and video generation
- Text-to-speech with multiple voice providers

#### 3. Background Processing with Trigger.dev
All heavy operations (video generation, exports, media processing) run as background jobs with progress tracking and real-time updates.

#### 4. Professional Video Editor
- Sequence-based timeline editing interface
- Real-time preview using Remotion Player
- 6 different subtitle styling systems
- Asset management with AI-powered enhancement

### Directory Structure

#### `/src/app/api/` - API Routes (50+ endpoints)
Comprehensive REST API following standard patterns:
- AI services: script generation, image extraction, transcription
- Media processing: enhancement, analysis, video generation  
- User management and authentication
- Payment processing (Stripe)
- Export functionality

#### `/src/components/`
- `/ui/` - shadcn/ui design system components
- `/edit/` - Advanced video editing interface
- `/modal/` - Dialog and modal interfaces
- `/onboarding/` - Multi-step user onboarding

#### `/src/lib/`
Core libraries and integrations:
- AI service clients (FAL.ai, WorkflowAI, ElevenLabs)
- Media processing (FFmpeg wrapper, video analysis)  
- External API integrations (Google, Pexels, Storyblocks)
- Cloud services (AWS S3/R2, MongoDB connection)

#### `/src/remotion/` - Video Compositions
Three main composition types:
- `generateVideo` - Full video generation with sequences
- `generateAudio` - Audio-only compositions
- `previewSubtitle` - Subtitle preview and styling

#### `/src/models/` - MongoDB Models
Mongoose schemas with TypeScript interfaces:
- Core: User, Video, Media, Space, Export, Review
- Supporting: Avatar, Voice, Sequence, Word

#### `/src/store/` - Zustand State Management
Client-side state for asset management, video editing, filters, and caching.

#### `/src/trigger/` - Background Jobs
Asynchronous processing for video exports, audio generation, media thumbnails, and video analysis.

## Development Guidelines

### API Development
Always follow the established API patterns from `.cursor/rules/api-rules.mdc`:

**Server-side (API Routes):**
```typescript
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Log the API call
  console.log("POST /api/route/path by user: ", session.user.id);

  // 3. Get parameters
  const { param1, param2 } = await req.json();

  try {
    // 4. Business logic with DAO calls
    // 5. Return data wrapped in { data: result }
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}
```

**Client-side API Calls:**
Always use the methods from `src/lib/api.ts`:
```typescript
// POST requests
const result = await basicApiCall('/endpoint/path', { param1, param2 });

// GET requests  
const result = await basicApiGetCall('/endpoint/path');
```

### Internationalization (i18n)
All user-facing text must use next-intl with structured keys:

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('section-name');
  return <h1>{t('title')}</h1>;
}
```

- Add translations to both `messages/en.json` and `messages/fr.json`
- Structure keys hierarchically by feature/page
- Use dynamic values: `t('message', { name: userName })`

### Code Style
- Minimal comments - only when code is truly complex
- All comments in English, explain "why" not "what"
- No hard-coded user-facing text - use i18n keys
- Follow existing patterns and conventions

## Key Integration Points

### AI Services
- **FAL.ai**: Primary video generation (Kling 2.1 model)
- **Anthropic**: Script generation and content analysis
- **Groq**: Fast text processing
- **WorkflowAI**: Content workflow automation

### Media Processing
- **FFmpeg**: Audio/video processing via Trigger.dev jobs
- **Remotion**: Professional video composition and rendering
- **AWS S3**: Media storage and CDN delivery

### Payment & Analytics
- **Stripe**: Subscription and usage-based billing
- **Mixpanel**: User analytics and behavior tracking
- **Facebook/Google Pixel**: Conversion tracking

### External Content Sources
- **Pexels**: Stock photos and videos
- **Storyblocks**: Premium media assets
- **Google APIs**: Various integrations
- **ElevenLabs**: Text-to-speech voice generation

## Environment Setup

The application requires extensive environment configuration for AI services, database, cloud storage, payment processing, and external API integrations. Check `.env.local.example` for required variables.

## Premium Feature Architecture

The platform implements a sophisticated credit and subscription system:
- Free, Pro, and Business tiers with different limits
- Usage tracking for video generations, exports, and storage
- Real-time credit consumption monitoring
- Stripe webhook handling for subscription management