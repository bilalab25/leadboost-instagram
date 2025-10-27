# CampAIgner - AI-Powered Social Media Management Platform

## Overview

CampAIgner is a comprehensive social media management platform that unifies customer communications across multiple channels (Instagram, WhatsApp, Email, TikTok) and leverages AI to generate intelligent content strategies. The application provides a centralized dashboard for managing messages, creating content plans, running campaigns, and analyzing performance metrics.

Key features include:
- Unified inbox for multi-platform message management
- AI-powered content planning and generation using OpenAI GPT-4o
- Campaign management with multi-platform publishing
- Analytics and performance tracking
- Real-time sentiment analysis of customer messages
- Professional Brand Studio with Canva integration
- "Meet CampAIgner" for automated campaign creation across 21+ platforms
- Visual Flow Builder for creating automation workflows with drag-and-drop interface
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
- Messages with metadata and sentiment analysis
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
- **Drag and Drop**: react-draggable for flow builder node manipulation
- **Component Library**: Radix UI primitives via Shadcn/UI
- **Styling**: Tailwind CSS with PostCSS
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date formatting and manipulation

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