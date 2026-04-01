import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logStartup } from "./diagnostic";
import { postScheduler } from "./services/postScheduler";
import { instagramTokenRefresh } from "./services/instagramTokenRefresh";
import { instagramInsights } from "./services/instagramInsights";
import { getStripeSync } from './stripe/stripeClient';
import { WebhookHandlers } from './stripe/webhookHandlers';
import { startBillingCron } from './stripe/billingCron';

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// ============================================================
// 1. HEALTH CHECK — before any middleware (for load balancers)
// ============================================================
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: Date.now() });
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: Date.now() });
});

// ============================================================
// 2. STRIPE WEBHOOK — must be before express.json() (needs raw body)
// ============================================================
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('[Stripe Webhook] req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[Stripe Webhook] Error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// ============================================================
// 3. SECURITY HEADERS — helmet protects against common attacks
// ============================================================
app.use(
  helmet({
    // Relax CSP for development (Vite HMR needs inline scripts)
    contentSecurityPolicy: isProduction
      ? undefined // Use helmet defaults in production
      : false, // Disable in development for Vite HMR
    // Allow cross-origin for embedded resources (Cloudinary images, Google Fonts, etc.)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ============================================================
// 4. CORS — restrict to allowed origins
// ============================================================
const allowedOrigins = process.env.APP_URL
  ? [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS?.split(",") || [])]
  : ["http://localhost:5000", "http://localhost:3000"];

app.use(
  cors({
    origin: isProduction
      ? allowedOrigins
      : true, // Allow all origins in development
    credentials: true, // Required for session cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ============================================================
// 5. RESPONSE COMPRESSION — gzip for production performance
// ============================================================
app.use(compression());

// ============================================================
// 6. BODY PARSING — with reasonable limits
// ============================================================
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    // Store raw body for webhook signature verification (Meta, etc.)
    if (req.url?.startsWith('/api/webhooks/')) {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ============================================================
// 7. REQUEST LOGGING — safe for production (no response bodies)
// ============================================================
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// ============================================================
// STRIPE INITIALIZATION
// ============================================================
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[Stripe] DATABASE_URL not found, skipping Stripe initialization');
    return;
  }

  const hasDirectKey = !!process.env.STRIPE_SECRET_KEY;
  const hasReplitConnectors = !!(process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));

  if (!hasDirectKey && !hasReplitConnectors) {
    console.warn('[Stripe] No Stripe credentials configured. Billing features disabled. Set STRIPE_SECRET_KEY in .env');
    return;
  }

  try {
    const stripeSync = await getStripeSync();

    if (stripeSync) {
      try {
        const { runMigrations } = await import('stripe-replit-sync');
        console.log('[Stripe] Running schema migrations...');
        await runMigrations({ databaseUrl, schema: 'stripe' } as any);
        console.log('[Stripe] Schema ready');
      } catch (migrationErr) {
        console.warn('[Stripe] Schema migration skipped:', (migrationErr as Error).message);
      }

      if (process.env.REPLIT_DOMAINS) {
        try {
          const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
          const { webhook } = await stripeSync.findOrCreateManagedWebhook(
            `${webhookBaseUrl}/api/stripe/webhook`
          );
          console.log(`[Stripe] Webhook configured: ${webhook.url}`);
        } catch (webhookErr) {
          console.warn('[Stripe] Managed webhook setup skipped:', (webhookErr as Error).message);
        }
      }

      stripeSync.syncBackfill()
        .then(() => console.log('[Stripe] Data synced'))
        .catch((err: any) => console.warn('[Stripe] Background sync skipped:', err.message));
    } else {
      console.log('[Stripe] Running in standalone mode');
    }

    console.log('[Stripe] Initialization complete');
  } catch (error) {
    console.error('[Stripe] Initialization failed:', (error as Error).message);
  }
}

// ============================================================
// SERVER STARTUP
// ============================================================
(async () => {
  await initStripe();

  const server = await registerRoutes(app);

  // ============================================================
  // GLOBAL ERROR HANDLER — safe for production
  // ============================================================
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // In production, don't expose internal error messages
    const message = isProduction && status === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

    console.error(`[Error] ${status}: ${err.message || err}${err.stack ? '\n' + err.stack : ''}`);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Static files / Vite dev server
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
    logStartup();
    postScheduler.start();
    instagramTokenRefresh.start();
    instagramInsights.start();
    startBillingCron();
  });

  // ============================================================
  // GRACEFUL SHUTDOWN — drain connections before exit
  // ============================================================
  const shutdown = (signal: string) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);

    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds if connections don't drain
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
