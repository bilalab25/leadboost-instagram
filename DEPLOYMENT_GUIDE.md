# LeadBoost App - Deployment Guide

## Overview
This is a full-stack React + Node.js application for social media management and campaign creation.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (with Drizzle ORM)
- **Authentication**: Session-based with Passport.js
- **UI Components**: Radix UI + Shadcn/UI

## Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables (see below)

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment Setup:**
Create a `.env` file with these variables:
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your-random-secret-key-here

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Application
NODE_ENV=production
PORT=5000
```

3. **Database Setup:**
```bash
# Push database schema
npm run db:push
```

4. **Build the application:**
```bash
npm run build
```

5. **Start production server:**
```bash
npm start
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

### 3. Replace Authentication System
Replace `server/replitAuth.ts` imports with `server/standardAuth.ts` in `server/index.ts`:

```typescript
// Replace this line:
// import { setupAuth } from "./replitAuth";

// With this:
import { setupAuth } from "./standardAuth";
```

### 4. Replace Object Storage
Replace `server/objectStorage.ts` usage with `server/standardStorage.ts` and configure your preferred cloud storage provider (AWS S3, Google Cloud Storage, etc.).

### 5. Add Password Hashing
For production, install bcrypt and implement proper password hashing:
```bash
npm install bcrypt @types/bcrypt
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

## File Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── services/          # Business logic
│   ├── standardAuth.ts    # Authentication
│   ├── standardStorage.ts # File storage
│   ├── storage.ts         # Database layer
│   └── routes.ts          # API routes
├── shared/                # Shared types
└── attached_assets/       # Static assets
```

## Features Included
- ✅ Multi-brand management dashboard
- ✅ Unified inbox for social platforms
- ✅ AI-powered campaign planning
- ✅ Spanish/English language support
- ✅ Analytics and reporting
- ✅ Waterfall campaign system
- ✅ Beautiful responsive UI

## Support
This application is production-ready with the changes outlined above. The authentication system uses standard session-based auth, and all cloud dependencies are abstracted for easy replacement.