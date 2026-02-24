# CampAIgner - AI-Powered Social Media Management Platform

## Overview

CampAIgner is a comprehensive social media management platform designed to unify customer communications across multiple channels (Instagram, WhatsApp, Email, TikTok) and leverage AI for intelligent content strategies. The platform provides a centralized dashboard for managing messages, creating content plans, running campaigns, and analyzing performance. Its vision is to empower brands with AI-driven insights for enhanced social media engagement and efficient communication, offering significant market potential for streamlined digital marketing.

Key capabilities include multi-tenant brand management with role-based access, a unified inbox for concurrent message aggregation and real-time communication across platforms, AI-powered content planning and generation, visual automation flow building, brand-specific asset and design management, and integrated analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a component-based UI built with React, utilizing Shadcn/UI and Radix UI for a consistent design system. Styling is managed with Tailwind CSS, offering customizable themes through CSS variables. Key UI components include a BrandSwitcher for multi-tenant navigation, a visual Flow Builder powered by React Flow for interactive workflow design, and dedicated dashboards for inbox, campaigns, and analytics.

### Technical Implementations
**Frontend**: Developed with React and TypeScript, using Vite for fast builds, Wouter for routing, and TanStack React Query for state management.
**Backend**: Built on Node.js with Express.js and TypeScript, providing a RESTful API. It uses session-based authentication with OpenID Connect (OIDC) via Replit Auth and features centralized error handling.
**Database**: Utilizes Drizzle ORM with Neon serverless PostgreSQL, ensuring type-safe schema definitions and automatic migration support. Core tables manage users, social accounts, integrations, messages, conversations, content plans, campaigns, and brand-specific assets/designs.
**Real-time Communication**: Implemented with Socket.IO for instant message delivery and live inbox updates.
**Multi-Platform Inbox**: Features a hybrid synchronization strategy, combining historical data sync with webhook-based real-time updates, ensuring duplicate prevention and seamless merging of local and remote messages. Includes real-time search, platform filters, and read/unread status tracking.
**Brand Management**: Incorporates a robust multi-tenant system with role-based access control, secure invitation flows, and dedicated UI for brand and member management. All brand-specific data (designs, assets, posting frequencies, conversation history) is isolated and secured.
**Automation Flows**: Features a visual drag-and-drop Flow Builder with custom nodes (Message, Action, Condition), advanced condition logic, and a flow execution simulator.
**AI Integration**: Leverages OpenAI GPT-4o for generating monthly content strategies, campaign content, and message sentiment analysis. Uses Google Gemini (gemini-2.5-flash for text, gemini-2.5-flash-image "Nano Banana" for images) for AI-powered post generation with brand-specific content and custom images. The PostGeneratorService (server/services/postGenerator.ts) handles asynchronous job processing, fetching Meta insights for optimal posting times.

### Feature Specifications
- **Multi-Tenant Brand Management**: Role-based access (owner/admin/editor/viewer), secure invitation system, and a BrandContext for managing active brand state.
- **Unified Inbox**: Aggregates messages from multiple platforms, provides real-time updates via Socket.IO, search functionality, and platform-specific filters.
- **AI-Powered Content Generation**: Utilizes OpenAI for content strategies and sentiment analysis. Features an "AI Posts" tab in AI Planner (/ai-planner) for generating complete social media posts with Gemini AI. Requirements: brand design + Facebook/Instagram integration. Supports async job processing with status polling, post accept/reject workflow, and custom AI-generated images. Uses brand's preferred language (set during onboarding) for all AI-generated content.
- **Sample Posts for New Users**: When users complete onboarding without connecting any integrations, the platform automatically generates 3 sample posts (Instagram, Facebook, WhatsApp) using Gemini AI. These demo posts showcase the platform's capabilities and are marked with an orange "Sample/Muestra" badge in the AI Planner. Sample posts use brand design colors, logo, and any uploaded assets. The `isSample` flag in `ai_generated_posts` table identifies demo content.
- **Preferred Language Selection**: Set during onboarding (Step 1) before Website Link field. Users can select English or Spanish as their preferred language for AI-generated posts. Stored in `brandDesigns.preferredLanguage` field. Includes info alert explaining that AI content will be created in the selected language.
- **Boosty AI Assistant with Image Generation**: Located on /waterfall page in "Strategize with Boosty" tab. Features:
  - Full brand context awareness (design, colors, sales data, integrations, conversations, image assets)
  - Automatic image request detection via regex patterns in Spanish/English
  - Image generation using Gemini gemini-2.5-flash-image model with brand-specific styling
  - Uses brand logo and assets as visual references (same pattern as postGenerator.ts)
  - pickVisualReferenceAssets() helper selects best images by category (products, locations, templates)
  - Only image assets are used (videos/documents filtered out via assetType === "image")
  - Conversation history memory - last 6 messages passed to AI for context-aware responses
  - Automatic caption and hashtag generation for social media posts
  - Animated UI with gradient styling (teal-cyan theme)
  - Bilingual support (English/Spanish) via useLanguage hook
  - **Editorial Mode** (Premium Feature):
    - Generates luxury magazine-quality base photos WITHOUT text/logos for frontend text overlay
    - Three presets: luxury_minimal (default), warm_romantic (Valentine's/couples), modern_clinical (medical aesthetics)
    - detectEditorialMode() function determines mode based on brand style and user request
    - Only triggers for explicit editorial/premium keywords or premium brand styles (NOT promotions alone)
    - Flyer/poster requests bypass editorial mode and allow text in images
    - Returns structured layoutPlan for frontend overlay: headline (max 4 words), subhead (max 6 words), cta, alignment, theme
    - sanitizePrompt() and sanitizeLayoutPlan() guardrails prevent flyer-style outputs
    - pickVisualReferenceAssets() limits to 0-2 reference images in editorial mode
    - ChatResponse includes layoutPlan and editorialMode fields for frontend consumption
- **Brand Image Generation with Tinder-Style Carousel**: Located on Calendar page. "Generate Images" button triggers batch generation of 6 AI images using Gemini gemini-2.5-flash-image model. Images are presented in a Tinder-style swipe carousel (ImageSwipeCarousel.tsx) where users swipe right to approve or left to reject. Uses brand design, logo, and Cloudinary assets as visual references. Service: brandImageGenerator.ts. API: POST `/api/brands/:brandId/generate-images`.
- **Automation Flows**: Visual builder for custom workflows with various node types and advanced condition logic.
- **Brand Studio**: Brand-specific designs and Cloudinary-based asset management with category organization. Includes PDF upload in brand description that uses Gemini AI to auto-generate a summary paragraph (POST `/api/brands/:brandId/pdf-summary`).
- **Posting Frequency Management**: Brand-specific scheduling with AI suggestions. Integrated into onboarding as Step 5 (conditional - only appears when social media accounts are connected). Features:
  - AI-suggested posting schedules based on industry best practices
  - Customizable days-of-week selection per platform
  - Supports Facebook, Instagram, WhatsApp, TikTok, YouTube
  - Saves to database via `/api/posting-frequency` endpoint
- **WhatsApp Templates**: Full Meta Graph API integration for fetching templates and sending template messages with variable substitution. Supports HEADER, BODY, and BUTTON parameters following Meta's component schema.
- **Integrations Page**: Standalone page at `/integrations` for managing OAuth platform connections (Facebook, Instagram, WhatsApp, etc.). Features popup-based OAuth flow with session state persistence.
- **Instagram Direct Integration**: Separate OAuth flow for Instagram Business accounts (not via Facebook). Uses Instagram's standalone OAuth with scopes for messaging, content publishing, comments, and insights. Environment variables: `IG_APP_ID`, `IG_APP_SECRET`.
- **Settings Page**: 4-tab layout (Account, Brands, Payment Methods, Notifications) for user account management. Integrations moved to dedicated page.
- **Brand Image Generation (Async)**: Image generation runs as a background job with polling. Users can navigate away and return to find the Tinder carousel ready. Job state persisted via localStorage. Approved images automatically become calendar posts with AI-generated captions via Gemini. API: POST `/api/brands/:brandId/generate-images` (returns jobId), GET `.../status/:jobId` for polling.
- **Content Gallery**: Calendar "Gallery" tab shows AI-generated and user-uploaded content images. Upload button saves images to Cloudinary as brand assets (category: "content"). Each image has a "Schedule" action that opens a dialog to create a calendar post with platform, title, caption, hashtags, and optional date. APIs: POST `/api/brands/:brandId/images-to-posts`, POST `/api/brands/:brandId/schedule-content`.
- **Create Post from Calendar**: Calendar sidebar features a "Create Post" button (visible when a date is selected). Opens a two-step dialog: 1) Pick an image from the brand asset gallery or upload a new one, 2) Fill in post details (platform, title, caption, hashtags, publish date). Pre-fills the date with the selected calendar date at 10:00 AM. Uses the same `/api/brands/:brandId/schedule-content` endpoint. Bilingual (English/Spanish).

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OIDC provider
- **AI Services**: OpenAI API (GPT-4o), Google Gemini (gemini-2.5-flash, gemini-2.5-flash-image)

### Frontend Dependencies
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Components**: Shadcn/UI, Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form, Zod
- **Date Utilities**: date-fns
- **Unique IDs**: nanoid
- **Flow Builder**: @xyflow/react (React Flow)

### Backend Dependencies
- **Web Framework**: Express.js
- **ORM**: Drizzle ORM (PostgreSQL adapter)
- **Authentication**: Passport.js (OpenID Connect strategy)
- **Session Storage**: connect-pg-simple
- **TypeScript Runtime**: tsx
- **Build Tool**: esbuild

### Platform Integrations
- **Social Media APIs**: Meta Graph API (Instagram, Messenger, WhatsApp, Threads), TikTok API (planned)
- **Cloud Storage**: Cloudinary (for brand assets)
- **POS Integration**: Lightspeed Retail X-Series

### Lightspeed POS Integration
The platform integrates with Lightspeed Retail X-Series as the single source of truth for customer and sales data.

**Sync Strategy (Sales-First Approach)**:
1. Fetch sales from the current month using `/api/2.0/search?type=sales`
2. For each sale with `customer_id`:
   - Check if customer already exists in our database
   - Check session cache (already fetched this sync)
   - If not found, fetch customer from Lightspeed using `/api/2.0/search?type=customers&customer_id=UUID`
   - Create customer in our database if found
   - Link sale to customer

**Key Design Decisions**:
- Only creates customers that are linked to sales (not all customers from Lightspeed)
- Uses session cache to prevent duplicate API calls during one sync
- Handles ID aliasing: `sale.customer_id` may differ from `customer.id` returned by search endpoint
- Both IDs are mapped to the same customer record to prevent duplicates
- Lightspeed is the single source of truth - no local customer creation