# LeadBoost CampAIgner Platform

A comprehensive social media management platform that unifies customer communications across multiple channels and leverages AI to generate intelligent content strategies.

## Features

- **CampAIgner Tool**: Transform one campaign idea into optimized content for 21+ platforms
- **Unified Inbox**: Manage messages from Instagram, WhatsApp, Email, TikTok in one place  
- **AI-Powered Content Planning**: Monthly content strategy generation using OpenAI GPT-4o
- **Campaign Management**: Multi-platform publishing with automated scheduling
- **Analytics Dashboard**: Performance tracking and revenue impact analysis
- **Brand Studio**: Professional design tools with Canva integration
- **Bilingual Support**: Full Spanish/English translation coverage

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/UI** component library
- **TanStack React Query** for state management
- **Wouter** for routing
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **OpenAI API** for AI features
- **Express Sessions** for authentication
- **WebSockets** for real-time features

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and translations
│   │   └── App.tsx      # Main app component
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database layer
│   └── index.ts         # Server entry point
├── shared/              # Shared TypeScript types
│   └── schema.ts        # Database schema
└── attached_assets/     # Static assets and images
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Authentication (configure your own OIDC provider)
ISSUER_URL=your_auth_provider_url
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# Session
SESSION_SECRET=your_random_session_secret

# Environment
NODE_ENV=development
```

### 2. Database Setup

The project uses PostgreSQL with Drizzle ORM. 

1. Set up a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run database migrations:

```bash
npm run db:push
```

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server  
npm start
```

### 4. Authentication Setup

The current authentication system uses OpenID Connect. You'll need to:

1. Replace the authentication provider in `server/replitAuth.ts`
2. Configure your OIDC provider details in the environment variables
3. Update the authentication flow as needed for your provider

## Key Features Implementation

### CampAIgner Tool
- Located in `client/src/pages/waterfall.tsx`
- Uses OpenAI API to generate platform-specific content
- Supports 21+ social media platforms with proper formatting

### Translation System
- Comprehensive bilingual support (Spanish/English)
- Translation files in `client/src/lib/translations.ts`
- Language switching in `client/src/hooks/useLanguage.ts`

### AI Integration
- OpenAI GPT-4o integration for content generation
- Monthly content planning with business intelligence input
- Sentiment analysis for message prioritization

### Dashboard & Analytics
- Real-time metrics and KPI tracking
- Revenue impact visualization with interactive toggles
- Activity monitoring and engagement analytics

## Deployment Notes

### Database Migrations
- Use `npm run db:push` for schema changes
- Never write manual SQL migrations
- The ORM handles schema synchronization

### Environment Configuration
- Ensure all environment variables are properly set
- Configure your own authentication provider
- Set up PostgreSQL database connection
- Add OpenAI API key for AI features

### Assets
- Static assets are in the `attached_assets/` directory
- Images use the `@assets` import alias
- Ensure proper file serving for production deployment

## API Endpoints

- `GET /api/auth/user` - Get current user
- `POST /api/campaigns` - Create new campaign  
- `GET /api/messages` - Fetch messages
- `GET /api/dashboard/stats` - Dashboard metrics
- `POST /api/ai/generate-content` - AI content generation

## Browser Support

- Modern browsers with ES2020+ support
- Responsive design for mobile and desktop
- Progressive enhancement for offline functionality

## Contributing

1. Follow the existing code structure and patterns
2. Maintain TypeScript strict mode compliance
3. Use the established component library (Shadcn/UI)
4. Ensure bilingual translation coverage for new features
5. Test both English and Spanish language modes

---

**Note**: This project is a comprehensive social media management platform with advanced AI capabilities. The codebase is production-ready and follows modern development best practices.