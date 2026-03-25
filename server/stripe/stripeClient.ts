import Stripe from 'stripe';

// Stripe API version - update when upgrading Stripe SDK
const STRIPE_API_VERSION = '2024-12-18.acacia' as Stripe.LatestApiVersion;

let cachedStripeClient: Stripe | null = null;
let cachedPublishableKey: string | null = null;
let cachedSecretKey: string | null = null;
let cachedWebhookSecret: string | null = null;
let connectionSettings: any = null;

/**
 * Check if running inside Replit with connectors available.
 */
function isReplitEnvironment(): boolean {
  return !!(
    process.env.REPLIT_CONNECTORS_HOSTNAME &&
    (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL)
  );
}

/**
 * Fetch Stripe credentials from Replit Connectors API.
 * Only used when running on Replit.
 */
async function getReplitCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit connector tokens not available');
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken,
    },
  });

  const data = await response.json();
  connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.publishable || !connectionSettings?.settings?.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found in Replit connectors`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

/**
 * Get Stripe credentials - tries env vars first, then Replit connectors.
 */
async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  // Cache hit
  if (cachedSecretKey && cachedPublishableKey) {
    return { publishableKey: cachedPublishableKey, secretKey: cachedSecretKey };
  }

  // Priority 1: Direct environment variables (standalone deployment)
  if (process.env.STRIPE_SECRET_KEY) {
    cachedSecretKey = process.env.STRIPE_SECRET_KEY;
    cachedPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    console.log('[Stripe] Using credentials from environment variables');
    return { publishableKey: cachedPublishableKey, secretKey: cachedSecretKey };
  }

  // Priority 2: Replit Connectors (Replit deployment)
  if (isReplitEnvironment()) {
    const creds = await getReplitCredentials();
    cachedSecretKey = creds.secretKey;
    cachedPublishableKey = creds.publishableKey;
    console.log('[Stripe] Using credentials from Replit connectors');
    return creds;
  }

  // No credentials available
  throw new Error(
    'Stripe credentials not configured. Set STRIPE_SECRET_KEY in .env or use Replit connectors. See .env.example.',
  );
}

/**
 * Get a Stripe client instance (cached).
 */
export async function getStripeClient(): Promise<Stripe> {
  if (cachedStripeClient) return cachedStripeClient;

  const { secretKey } = await getCredentials();
  cachedStripeClient = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  return cachedStripeClient;
}

// Backward-compatible alias
export const getUncachableStripeClient = getStripeClient;

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

/**
 * Get the webhook signing secret.
 * Priority: STRIPE_WEBHOOK_SECRET env var > Replit connector settings
 */
export async function getWebhookSecret(): Promise<string | null> {
  if (cachedWebhookSecret) return cachedWebhookSecret;

  // Priority 1: Environment variable (standalone deployment)
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    cachedWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return cachedWebhookSecret;
  }

  // Priority 2: Replit connector settings
  if (isReplitEnvironment()) {
    if (!connectionSettings) {
      try {
        await getReplitCredentials();
      } catch {
        // Connector not available
      }
    }
    if (connectionSettings?.settings?.webhook_secret) {
      cachedWebhookSecret = connectionSettings.settings.webhook_secret;
      return cachedWebhookSecret;
    }
  }

  console.warn('[Stripe] No webhook secret configured. Set STRIPE_WEBHOOK_SECRET in .env');
  return null;
}

/**
 * Get StripeSync instance (Replit-specific).
 * Returns null if stripe-replit-sync is not available.
 */
let stripeSync: any = null;

export async function getStripeSync(): Promise<any> {
  if (stripeSync) return stripeSync;

  try {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
    return stripeSync;
  } catch (error) {
    console.warn('[Stripe] stripe-replit-sync not available. Using standalone Stripe mode.');
    return null;
  }
}
