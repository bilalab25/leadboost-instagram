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
**AI Integration**: Leverages OpenAI GPT-4o for generating monthly content strategies, campaign content, message sentiment analysis, and visual content suggestions. Integrated with n8n for AI-powered posting frequency recommendations and post generation, securely transmitting comprehensive brand data.

### Feature Specifications
- **Multi-Tenant Brand Management**: Role-based access (owner/admin/editor/viewer), secure invitation system, and a BrandContext for managing active brand state.
- **Unified Inbox**: Aggregates messages from multiple platforms, provides real-time updates via Socket.IO, search functionality, and platform-specific filters.
- **AI-Powered Content Generation**: Utilizes OpenAI for content strategies, campaign content, and sentiment analysis.
- **Automation Flows**: Visual builder for custom workflows with various node types and advanced condition logic.
- **Brand Studio**: Brand-specific designs and Cloudinary-based asset management with category organization.
- **Posting Frequency Management**: Brand-specific scheduling with AI suggestions.
- **WhatsApp Templates**: Full Meta Graph API integration for fetching templates and sending template messages with variable substitution. Supports HEADER, BODY, and BUTTON parameters following Meta's component schema.
- **Integrations Page**: Standalone page at `/integrations` for managing OAuth platform connections (Facebook, Instagram, WhatsApp, etc.). Features popup-based OAuth flow with session state persistence.
- **Instagram Direct Integration**: Separate OAuth flow for Instagram Business accounts (not via Facebook). Uses Instagram's standalone OAuth with scopes for messaging, content publishing, comments, and insights. Environment variables: `IG_APP_ID`, `IG_APP_SECRET`.
- **Settings Page**: 4-tab layout (Account, Brands, Payment Methods, Notifications) for user account management. Integrations moved to dedicated page.

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit OIDC provider
- **AI Services**: OpenAI API (GPT-4o)
- **Workflow Automation**: n8n (for AI-powered suggestions and post generation)

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