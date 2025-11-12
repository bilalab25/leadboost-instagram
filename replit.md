# CampAIgner - AI-Powered Social Media Management Platform

## Overview

CampAIgner is a comprehensive social media management platform that unifies customer communications across multiple channels (Instagram, WhatsApp, Email, TikTok) and leverages AI to generate intelligent content strategies. The application provides a centralized dashboard for managing messages, creating content plans, running campaigns, and analyzing performance metrics.

Key features include:
- **Multi-Tenant Brand Management** with:
  - Brand memberships with role-based access (owner/admin/editor/viewer)
  - Brand invitation system with secure invite codes
  - Onboarding flow for creating or joining brands
  - Brand context provider for managing active brand state
  - Authorization middleware for brand-scoped API access
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
- 30-Day Planner with AI-suggested posting frequency scheduler

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