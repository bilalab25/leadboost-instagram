# LeadBoost Platform - Production Deployment Guide

## Quick Start

This is a production-ready React/Node.js application with full bilingual support and AI-powered features.

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Environment Setup

Create `.env` file:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENAI_API_KEY=sk-your-key-here
SESSION_SECRET=random-secret-key
NODE_ENV=production
ISSUER_URL=https://your-auth-provider.com
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
```

### Deployment Steps

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:push

# 3. Build application
npm run build

# 4. Start production server
npm start
```

## Authentication Configuration

The current auth system uses OpenID Connect. To replace with your own:

1. **Update `server/replitAuth.ts`** - Replace OIDC configuration
2. **Modify routes** - Update auth endpoints in `server/routes.ts`
3. **Frontend updates** - Adjust login flow in components

### Example Auth Replacement

Replace the OIDC setup with your preferred authentication:

```typescript
// Example: Replace with custom JWT auth
import jwt from 'jsonwebtoken';

// Replace the current passport configuration
// with your authentication method
```

## Required Changes for Production

### 1. Update package.json
Remove these development dependencies:
```json
"@replit/vite-plugin-cartographer": "^0.3.0",
"@replit/vite-plugin-runtime-error-modal": "^0.0.3",
```

### 2. Update vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

## Database Schema

The app uses Drizzle ORM with PostgreSQL. Key tables:

- `users` - User management
- `campaigns` - Campaign data
- `messages` - Customer communications  
- `social_accounts` - Platform integrations
- `activity` - Audit logs

## Features Overview

### Core Platform Features
- ✅ Complete bilingual UI (Spanish/English)
- ✅ CampAIgner: 1 idea → 21+ platforms
- ✅ Unified inbox for all customer messages
- ✅ AI content planning with OpenAI GPT-4o
- ✅ Analytics dashboard with revenue tracking
- ✅ Brand Studio integration
- ✅ Campaign management system

### Technical Features
- ✅ React 18 with TypeScript
- ✅ Responsive Tailwind CSS design
- ✅ Real-time WebSocket connections
- ✅ Database ORM with migrations
- ✅ Session-based authentication
- ✅ API-first architecture

## API Integration

### OpenAI Integration
- Monthly content strategy generation
- Campaign content creation
- Message sentiment analysis
- Platform-specific content optimization

### Social Media APIs (Ready for Integration)
- Instagram Business API
- Facebook Graph API  
- WhatsApp Business API
- TikTok Marketing API
- LinkedIn Marketing API
- YouTube Data API
- Twitter API v2

## Performance Optimizations

- Code splitting with Vite
- Component lazy loading
- Image optimization
- Database query optimization
- Session management
- Caching strategies

## Security Features

- CSRF protection
- Session security
- Input validation with Zod
- SQL injection prevention
- Environment variable protection

## File Structure

```
├── client/                 # Frontend React app
├── server/                 # Backend Express API
├── shared/                 # Shared TypeScript types
├── attached_assets/        # Static assets
├── dist/                   # Built application
├── package.json           # Dependencies
└── README.md              # Documentation
```

## Deployment Options

### Option 1: Digital Ocean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard

### Option 3: Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy with one click

### Option 4: AWS/Google Cloud
1. Use Docker or direct deployment
2. Set up load balancer and SSL
3. Configure environment variables

## Monitoring & Logs

The application includes:
- Request logging
- Error tracking
- Performance monitoring
- User activity logging
- Database query logging

## Scaling Considerations

### Database
- Connection pooling configured
- Query optimization implemented
- Migration system in place

### Application
- Stateless server design
- Session store externalization
- API rate limiting ready
- Caching layer prepared

## Support & Maintenance

### Regular Tasks
- Database backup
- Log rotation  
- Security updates
- Performance monitoring
- User analytics review

### Troubleshooting
- Check environment variables
- Verify database connection
- Monitor API rate limits
- Review application logs
- Test authentication flow

---

**This platform is production-ready with enterprise-grade features and bilingual support. The codebase follows industry best practices and can be deployed to any modern hosting platform.**