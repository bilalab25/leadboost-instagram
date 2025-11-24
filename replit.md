# CampAIgner - AI-Powered Social Media Management Platform

## Overview

CampAIgner is a comprehensive social media management platform that unifies customer communications across multiple channels (Instagram, WhatsApp, Email, TikTok) and leverages AI to generate intelligent content strategies. The application provides a centralized dashboard for managing messages, creating content plans, running campaigns, and analyzing performance metrics.

Key features include:
- **Multi-Tenant Brand Management** (FULLY IMPLEMENTED) with:
  - **Database Schema**: brand_memberships and brand_invitations tables with proper foreign keys and unique constraints
  - **Brand Memberships**: Role-based access control (owner/admin/editor/viewer) with hierarchical permissions
  - **Invitation System**: Secure nanoid-based invite codes with 7-day expiration, optional email pre-assignment
  - **Onboarding Flow**: Public route with "Create Brand" or "Join Brand" options, no auto-creation
  - **BrandContext Provider**: Manages active brand state with localStorage persistence, auto-selection, validation
  - **BrandSwitcher Component**: Navbar dropdown showing enriched memberships (brandName, brandColor) with role badges
  - **Authorization Middleware**: requireBrand and requireRole for API route protection with last-owner safety
  - **Brand Management UI**: Settings tab with full member management (invite generation, role changes, member removal)
  - **Storage Layer**: Enriched getBrandMemberships with JOIN returning BrandMembershipWithBrand type
  - **Backend Endpoints**: 
    - GET /api/brand-memberships (enriched with brand metadata)
    - GET /api/brands/:brandId/members
    - POST /api/brand-invitations (admin+ only)
    - PATCH /api/brand-memberships/:id/role (owner only, last-owner protected)
    - DELETE /api/brand-memberships/:id (admin+, last-owner protected)
    - POST /api/brand-invitations/:id/expire (admin+)
  - **Security Features**: Last owner protection, role-based endpoint access, transactional invite acceptance
- **Multi-Platform Unified Inbox** with:
  - Concurrent message aggregation from Facebook, Instagram, Threads, and WhatsApp
  - **Hybrid Synchronization Strategy**:
    - WhatsApp: Local storage only (webhook-based, required by Meta)
    - Messenger/Instagram: Initial historical sync (last 50 conversations × 50 messages) + local database + webhook storage
    - Automatic duplicate prevention via unique metaMessageId constraint
    - Seamless merge of local and remote messages
  - **Real-Time Messaging via Socket.IO**:
    - Instant message delivery without page refresh
    - Live inbox updates when new messages arrive
    - Real-time conversation thread updates
    - Toast notifications for new messages
    - Automatic unread badge increments
    - Works for WhatsApp, Messenger, and Instagram
  - **Search Functionality**:
    - Real-time search across conversations
    - Searches both contact names and message content
    - Case-insensitive partial matching
    - Clear button for quick reset
    - Works in conjunction with platform and flag filters
  - Platform-specific fetch helpers with normalized message format
  - Universal GET endpoint supporting all connected providers
  - Diagnostic logging for request/response tracking
  - Conversation ID preservation for seamless detail view navigation
  - Platform badges and filters in the UI
  - Contact name extraction and display (WhatsApp profile names)
  - Read/unread status tracking with numeric unread badges
  - Optimistic UI updates for instant badge clearing
- AI-powered content planning and generation using OpenAI GPT-4o
- Campaign management with multi-platform publishing
- Analytics and performance tracking
- Real-time sentiment analysis of customer messages
- Professional Brand Studio with Canva integration
- "Meet CampAIgner" for automated campaign creation across 21+ platforms
- **Automation Flows System** with:
  - Flows Dashboard for managing all workflows
  - Visual Flow Builder powered by React Flow with:
    - Interactive drag-to-connect functionality between nodes
    - Custom node types: Message, Action, and Condition nodes
    - Multiple output handles for condition nodes (True/False paths)
    - Connection validation (prevents duplicates and circular loops)
    - Zoom, pan, and minimap controls
  - Advanced Condition Logic Builder with:
    - Multiple condition rules with AND/OR logic
    - 12 operators (equals, contains, startsWith, greaterThan, etc.)
    - Dynamic add/remove rules
    - Variable/operator/value configuration per rule
  - Node editing panel for message/action/condition configuration
  - Flow execution simulator with visual animation
  - localStorage persistence (database-ready architecture)
- **Brand Studio** (Brand-Based Architecture):
  - **Database Schema**: brand_designs and brand_assets tables with brandId foreign keys
  - **Migration**: Successfully migrated from user-based to brand-based architecture (Nov 2025)
  - **Brand Designs**: Each brand has independent design settings (colors, fonts, logos)
  - **Brand Assets**: Cloudinary-based asset management per brand with category organization
  - **Authorization**: All routes protected with requireBrand middleware
  - **React Query Security**: All queries include activeBrandId in queryKeys with enabled guards
  - **Cache Invalidation**: Proper queryClient.invalidateQueries patterns for real-time UI updates
  - **Middleware Fix**: requireBrand now sets both req.brandMembership and req.brandId
  - **Mapper Functions**: Handle brandId correctly in mapToDb and mapPartialToDb
- **Posting Frequency Management** (Brand-Based):
  - **Database Schema**: social_posting_frequency table with brandId foreign key (nullable for backward compatibility)
  - **Multi-Layer Validation**: Route-level, storage-level, and payload-level brandId validation prevents data leakage
  - **Storage Layer**: getSocialPostingFrequenciesByBrand and saveSocialPostingFrequencies methods with explicit brandId guards
  - **API Routes**: GET/POST /api/posting-frequency protected with requireBrand middleware
  - **Frontend**: PostingFrequencyModal uses useBrand hook with brand-scoped React Query keys
  - **Data Integrity**: New records MUST have brandId (enforced by runtime validation), legacy records remain isolated
  - **AI Suggestions**: Integrated with n8n for AI-powered posting frequency recommendations based on Meta engagement data
- **Conversation History** (Brand-Based):
  - **Database Schema**: conversation_history table with uuid primary key and brandId/userId foreign keys
  - **Fields**: role (user/agent), contentType (text/image), content (message or image URL), metadata (JSON)
  - **Indexes**: Optimized with indexes on brandId, userId, and createdAt for efficient queries
  - **Storage Layer**: saveConversationHistory, getConversationHistoryByBrand, deleteConversationHistory methods
  - **API Routes**: POST/GET/DELETE /api/conversation-history with requireBrand middleware
  - **Security**: Multi-layer validation prevents cross-tenant data access - DELETE enforces both id AND brandId match
  - **Data Retrieval**: Configurable limit parameter (default 100) for conversation history pagination
- **AI Post Generator Integration** (Brand-Based):
  - **Webhook Endpoint**: POST /api/post-generator/:brandId sends comprehensive brand data to n8n for AI-powered post generation
  - **Authorization**: Protected with isAuthenticated + requireBrand middleware (all roles: owner/admin/editor/viewer)
  - **Data Aggregation**: Fetches and combines brands, brand_designs, brand_assets, content_plans, posting_frequencies
  - **JSON Payload Structure**:
    - nombre_brand: Brand name
    - brand_description: Brand description
    - Insights: Array of content plans and posting frequencies
    - Brand_assets: Array of Cloudinary URLs with categories
    - Brand_design: Array containing logo, colors, and fonts
  - **Storage Layer**: getBrandByIdOnly() for safe brand fetching after requireBrand validation
  - **Environment Variables**: N8N_POST_GENERATOR_WEBHOOK_URL for webhook integration
  - **Security**: Multi-layer brand validation, collaborator access enabled, prevents cross-brand data leakage
- 30-Day Planner with brand-specific AI-suggested posting frequency scheduler

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Authentication**: Session-based authentication with redirect handling

The frontend follows a component-based architecture with shared UI components, custom hooks for data fetching, and page-specific components organized in a clear directory structure.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with route-based organization
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: OpenID Connect (OIDC) integration with Replit Auth
- **Error Handling**: Centralized error middleware with structured error responses

The backend uses a layered architecture with separate concerns for routing, business logic (services), and data access (storage layer).

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Type-safe schema definitions with automatic migration support
- **Connection**: Neon serverless PostgreSQL with connection pooling

Key tables include:
- Users and session management for authentication
- Social accounts for platform integrations
- Integrations with hasFetchedHistory flag for hybrid sync tracking
- Messages with:
  - Composite UNIQUE constraint on (integration_id, meta_message_id) for duplicate prevention per integration
  - contactName for WhatsApp profile names
  - isRead for read/unread status tracking
  - direction for inbound/outbound message routing
  - conversationId (nullable FK) linking messages to conversations
- **Conversations** for organizing messages into threads:
  - UNIQUE constraint on (integrationId, metaConversationId) to prevent duplicates per integration
  - Fields: platform, contactName, lastMessage, lastMessageAt, unreadCount, flag
  - Atomic getOrCreateConversation() using INSERT...ON CONFLICT DO UPDATE for thread-safe upserts
  - Metadata tracking (latest message, timestamp, contact name) updated during webhook/sync
  - One-to-many relationship with messages via conversationId
  - API endpoints: GET /api/conversations (list all), GET /api/conversations/:id/messages (get messages)
  - Integration with webhooks: conversations created before messages for proper relationship
  - Performance optimized: batch creation during initial sync, incremental updates via webhooks
- Content plans with AI-generated strategies
- Campaigns with multi-platform publishing
- Analytics for performance tracking
- Activity logs for audit trails

### AI Integration
- **Provider**: OpenAI GPT-4o for content generation and analysis
- **Features**: 
  - Monthly content strategy generation based on business data
  - Campaign content creation with platform-specific variations
  - Message sentiment analysis for priority routing
  - Visual content suggestions and hashtag recommendations

The AI service is designed with flexible business data input and structured output for consistent content planning.

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OIDC provider
- **AI Services**: OpenAI API for GPT-4o model access

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript
- **Build Tool**: Vite with React plugin
- **Node-Based UI**: @xyflow/react (React Flow) for interactive flow builder with drag-to-connect
- **Component Library**: Radix UI primitives via Shadcn/UI
- **Styling**: Tailwind CSS with PostCSS
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date formatting and manipulation
- **Unique IDs**: nanoid for generating short unique identifiers

### Backend Dependencies
- **Web Framework**: Express.js with middleware ecosystem
- **Database ORM**: Drizzle ORM with PostgreSQL adapter
- **Authentication**: Passport.js with OpenID Connect strategy
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Security**: CORS, helmet (implied for production use)
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development and Deployment
- **Package Manager**: npm with package-lock for consistent installs
- **TypeScript**: Strict configuration with path mapping
- **Build Process**: Separate frontend and backend build processes
- **Environment**: Replit-specific development tools and banners
- **Database Migrations**: Drizzle Kit for schema management

The architecture supports both development and production environments with appropriate tooling and build processes for each stage.