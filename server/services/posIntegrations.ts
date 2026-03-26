import crypto from 'crypto';
import { PosIntegration, Product, SalesTransaction, CampaignTrigger } from '@shared/schema';
import { db } from '../db';
import { salesTransactions, products } from '@shared/schema';
import { eq, sql, and, desc } from 'drizzle-orm';

// Encryption key for sensitive data - MUST be set via environment variable in production
const ENCRYPTION_KEY = process.env.POS_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && process.env.NODE_ENV === "production") {
  throw new Error("POS_ENCRYPTION_KEY is required in production. See .env.example.");
}
const ENCRYPTION_KEY_SAFE = ENCRYPTION_KEY || "dev-only-insecure-key-32chars!!";

/**
 * POS Integration Service
 * Handles connections to various POS systems like Square, Shopify, Stripe, WooCommerce
 */
export class PosIntegrationService {

  /**
   * Encrypt sensitive data like API keys and tokens
   */
  private encryptData(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY_SAFE, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      if (!ivHex || !encrypted) return '';
      const iv = Buffer.from(ivHex, 'hex');
      const key = crypto.scryptSync(ENCRYPTION_KEY_SAFE, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return '';
    }
  }

  /**
   * Validate POS integration credentials
   */
  async validateCredentials(provider: string, credentials: any): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    try {
      switch (provider.toLowerCase()) {
        case 'square':
          return await this.validateSquareCredentials(credentials);
        case 'shopify':
          return await this.validateShopifyCredentials(credentials);
        case 'stripe':
          return await this.validateStripeCredentials(credentials);
        case 'woocommerce':
          return await this.validateWooCommerceCredentials(credentials);
        default:
          return { valid: false, error: 'Unsupported POS provider' };
      }
    } catch (error) {
      return { valid: false, error: 'Failed to validate credentials' };
    }
  }

  /**
   * Square API validation — calls GET /v2/merchants to verify the access token
   */
  private async validateSquareCredentials(credentials: { accessToken: string; applicationId?: string }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    const { accessToken } = credentials;
    if (!accessToken) return { valid: false, error: 'Access token is required' };

    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    const response = await fetch(`${baseUrl}/v2/merchants`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { valid: false, error: `Square API returned ${response.status}` };
    }

    const data = await response.json();
    const merchant = data.merchant?.[0] || data.merchant;

    if (!merchant) return { valid: false, error: 'No merchant found for this token' };

    return {
      valid: true,
      storeInfo: {
        businessName: merchant.business_name || 'Square Store',
        merchantId: merchant.id,
        country: merchant.country,
        currency: merchant.currency,
      },
    };
  }

  /**
   * Shopify API validation — calls GET /admin/api/2024-01/shop.json
   */
  private async validateShopifyCredentials(credentials: {
    storeUrl: string;
    accessToken: string;
    apiKey?: string;
  }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    const { storeUrl, accessToken } = credentials;
    if (!storeUrl || !accessToken) return { valid: false, error: 'Store URL and access token are required' };

    const cleanUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const response = await fetch(`https://${cleanUrl}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { valid: false, error: `Shopify API returned ${response.status}` };
    }

    const data = await response.json();
    const shop = data.shop;

    if (!shop) return { valid: false, error: 'Unable to fetch shop info' };

    return {
      valid: true,
      storeInfo: {
        shopName: shop.name,
        domain: shop.domain,
        email: shop.email,
        currency: shop.currency,
        timezone: shop.iana_timezone,
        planName: shop.plan_name,
      },
    };
  }

  /**
   * Stripe API validation — calls GET /v1/account
   */
  private async validateStripeCredentials(credentials: { secretKey: string; publishableKey: string }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    const { secretKey } = credentials;
    if (!secretKey) return { valid: false, error: 'Secret key is required' };

    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });

    if (!response.ok) {
      return { valid: false, error: `Stripe API returned ${response.status}` };
    }

    const account = await response.json();

    return {
      valid: true,
      storeInfo: {
        accountId: account.id,
        businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || 'Stripe Account',
        country: account.country,
        currency: account.default_currency,
        payoutsEnabled: account.payouts_enabled,
      },
    };
  }

  /**
   * WooCommerce API validation — calls GET /wp-json/wc/v3/system_status
   */
  private async validateWooCommerceCredentials(credentials: {
    siteUrl: string;
    consumerKey: string;
    consumerSecret: string;
  }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    const { siteUrl, consumerKey, consumerSecret } = credentials;
    if (!siteUrl || !consumerKey || !consumerSecret) {
      return { valid: false, error: 'Site URL, consumer key, and consumer secret are required' };
    }

    const cleanUrl = siteUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(`${cleanUrl}/wp-json/wc/v3/system_status`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { valid: false, error: `WooCommerce API returned ${response.status}` };
    }

    const data = await response.json();
    const env = data.environment || {};
    const settings = data.settings || {};

    return {
      valid: true,
      storeInfo: {
        siteName: env.site_title || 'WooCommerce Store',
        siteUrl: env.site_url || siteUrl,
        version: env.version || 'unknown',
        currency: settings.currency || 'USD',
        timezone: env.default_timezone || 'UTC',
      },
    };
  }

  /**
   * Sync products from POS system
   */
  async syncProducts(integration: PosIntegration): Promise<Product[]> {
    try {
      const accessToken = this.decryptData(integration.accessToken || '');

      switch (integration.provider.toLowerCase()) {
        case 'square':
          return await this.syncSquareProducts(accessToken, integration);
        case 'shopify':
          return await this.syncShopifyProducts(accessToken, integration);
        case 'stripe':
          return await this.syncStripeProducts(accessToken, integration);
        case 'woocommerce':
          return await this.syncWooCommerceProducts(integration);
        default:
          throw new Error('Unsupported POS provider');
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Sync Square products — calls GET /v2/catalog/list
   */
  private async syncSquareProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Square catalog API returned ${response.status}`);

    const data = await response.json();
    const items = data.objects || [];

    return items.map((item: any) => {
      const variation = item.item_data?.variations?.[0];
      const priceMoney = variation?.item_variation_data?.price_money;
      return {
        id: crypto.randomUUID(),
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: item.id,
        name: item.item_data?.name || 'Untitled',
        description: item.item_data?.description || null,
        price: priceMoney?.amount ? Number(priceMoney.amount) : 0,
        currency: priceMoney?.currency || 'USD',
        sku: variation?.item_variation_data?.sku || null,
        category: item.item_data?.category_id || null,
        imageUrl: null,
        isActive: !item.is_deleted,
        stockQuantity: null,
        metadata: { squareItemId: item.id },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Sync Shopify products — calls GET /admin/api/2024-01/products.json
   */
  private async syncShopifyProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    const storeUrl = (integration.storeUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

    const response = await fetch(`https://${storeUrl}/admin/api/2024-01/products.json?limit=250`, {
      headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Shopify products API returned ${response.status}`);

    const data = await response.json();
    const shopifyProducts = data.products || [];

    return shopifyProducts.map((p: any) => {
      const variant = p.variants?.[0];
      return {
        id: crypto.randomUUID(),
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: String(p.id),
        name: p.title,
        description: p.body_html?.replace(/<[^>]*>/g, '') || null,
        price: variant?.price ? Math.round(parseFloat(variant.price) * 100) : 0,
        currency: 'USD',
        sku: variant?.sku || null,
        category: p.product_type || null,
        imageUrl: p.image?.src || null,
        isActive: p.status === 'active',
        stockQuantity: variant?.inventory_quantity ?? null,
        metadata: { shopifyProductId: String(p.id), vendor: p.vendor },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Sync Stripe products — calls GET /v1/products
   */
  private async syncStripeProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    const response = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error(`Stripe products API returned ${response.status}`);

    const data = await response.json();
    const stripeProducts = data.data || [];

    // Fetch prices for each product
    const priceResponse = await fetch('https://api.stripe.com/v1/prices?limit=100&active=true', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const priceData = priceResponse.ok ? await priceResponse.json() : { data: [] };
    const priceMap = new Map<string, any>();
    for (const price of priceData.data || []) {
      if (!priceMap.has(price.product)) priceMap.set(price.product, price);
    }

    return stripeProducts.map((p: any) => {
      const price = priceMap.get(p.id);
      return {
        id: crypto.randomUUID(),
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: p.id,
        name: p.name,
        description: p.description || null,
        price: price?.unit_amount || 0,
        currency: price?.currency?.toUpperCase() || 'USD',
        sku: null,
        category: null,
        imageUrl: p.images?.[0] || null,
        isActive: p.active,
        stockQuantity: null,
        metadata: { stripeProductId: p.id, billingInterval: price?.recurring?.interval || null },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Sync WooCommerce products — calls GET /wp-json/wc/v3/products
   */
  private async syncWooCommerceProducts(integration: PosIntegration): Promise<Product[]> {
    const siteUrl = (integration.storeUrl || '').replace(/\/$/, '');
    const apiKey = this.decryptData(integration.apiKey || '');
    const accessToken = this.decryptData(integration.accessToken || '');
    const auth = Buffer.from(`${apiKey}:${accessToken}`).toString('base64');

    const response = await fetch(`${siteUrl}/wp-json/wc/v3/products?per_page=100`, {
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`WooCommerce products API returned ${response.status}`);

    const wcProducts = await response.json();

    return (wcProducts || []).map((p: any) => ({
      id: crypto.randomUUID(),
      posIntegrationId: integration.id,
      userId: integration.userId,
      externalProductId: String(p.id),
      name: p.name,
      description: p.short_description?.replace(/<[^>]*>/g, '') || null,
      price: p.price ? Math.round(parseFloat(p.price) * 100) : 0,
      currency: 'USD',
      sku: p.sku || null,
      category: p.categories?.[0]?.name || null,
      imageUrl: p.images?.[0]?.src || null,
      isActive: p.status === 'publish',
      stockQuantity: p.stock_quantity ?? null,
      metadata: { wooCommerceId: String(p.id) },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Process webhook from POS system
   */
  async processWebhook(provider: string, payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      switch (provider.toLowerCase()) {
        case 'square':
          return await this.processSquareWebhook(payload, signature);
        case 'shopify':
          return await this.processShopifyWebhook(payload, signature);
        case 'stripe':
          return await this.processStripeWebhook(payload, signature);
        case 'woocommerce':
          return await this.processWooCommerceWebhook(payload, signature);
        default:
          return { processed: false, error: 'Unsupported webhook provider' };
      }
    } catch (error) {
      return { processed: false, error: 'Failed to process webhook' };
    }
  }

  /**
   * Verify Square webhook signature
   */
  verifySquareSignature(body: string, signature: string): boolean {
    const secret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!secret) return false;
    const notificationUrl = `${process.env.APP_URL}/api/webhooks/square`;
    const payload = notificationUrl + body;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }

  /**
   * Verify Shopify webhook HMAC
   */
  verifyShopifySignature(body: string, signature: string): boolean {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expectedSig = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(expectedSig, 'base64'));
    } catch { return false; }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyStripeSignature(body: string, signature: string): boolean {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return false;
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
    const v1Sig = elements.find(e => e.startsWith('v1='))?.slice(3);
    if (!timestamp || !v1Sig) return false;
    const signedPayload = `${timestamp}.${body}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(v1Sig), Buffer.from(expectedSig));
    } catch { return false; }
  }

  private async processSquareWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    if (payload.type === 'payment.created' || payload.type === 'order.created') {
      const transactionId = payload.data?.object?.id;
      if (transactionId) {
        return { processed: true, transactionId };
      }
    }
    return { processed: true };
  }

  private async processShopifyWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    if (payload.id) {
      return { processed: true, transactionId: `shopify_${payload.id}` };
    }
    return { processed: true };
  }

  private async processStripeWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    if (payload.type?.includes('payment_intent') || payload.type?.includes('charge')) {
      const transactionId = payload.data?.object?.id;
      if (transactionId) {
        return { processed: true, transactionId };
      }
    }
    return { processed: true };
  }

  private async processWooCommerceWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    if (payload.id) {
      return { processed: true, transactionId: `wc_order_${payload.id}` };
    }
    return { processed: true };
  }

  /**
   * Get integration statistics from the database
   */
  async getIntegrationStats(integrationId: string): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    topProducts: any[];
    recentTransactions: number;
  }> {
    const txns = await db.query.salesTransactions.findMany({
      where: eq(salesTransactions.posIntegrationId, integrationId),
    });

    const totalSales = txns.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const totalTransactions = txns.length;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    // Recent transactions (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTransactions = txns.filter(t => t.transactionDate && new Date(t.transactionDate) >= sevenDaysAgo).length;

    // Top products from the products table
    const productsList = await db.query.products.findMany({
      where: eq(products.posIntegrationId, integrationId),
      limit: 5,
    });

    const topProducts = productsList.map(p => ({
      name: p.name,
      sales: 0, // Would need join with transaction line items for real counts
    }));

    return { totalSales, totalTransactions, averageOrderValue, topProducts, recentTransactions };
  }

  /**
   * Check if campaign trigger conditions are met
   */
  async checkTriggerConditions(trigger: CampaignTrigger, transaction?: SalesTransaction): Promise<boolean> {
    try {
      const conditions = trigger.conditions as any;

      switch (trigger.triggerType) {
        case 'purchase_milestone':
          return this.checkPurchaseMilestone(conditions, trigger.userId || '');
        case 'low_stock':
          return this.checkLowStock(conditions, trigger.userId || '');
        case 'new_customer':
          return this.checkNewCustomer(conditions, transaction);
        case 'abandoned_cart':
          return false; // Abandoned cart requires external event tracking, not polling
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private async checkPurchaseMilestone(conditions: any, userId: string): Promise<boolean> {
    const txns = await db.query.salesTransactions.findMany({
      where: eq(salesTransactions.userId, userId),
    });
    const totalSales = txns.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const milestone = (conditions.amount || 0) * 100; // Convert dollars to cents
    return totalSales >= milestone;
  }

  private async checkLowStock(conditions: any, userId: string): Promise<boolean> {
    const threshold = conditions.threshold || 10;
    const lowStockProducts = await db.query.products.findMany({
      where: eq(products.userId, userId),
    });
    return lowStockProducts.some(p => p.stockQuantity !== null && Number(p.stockQuantity) <= threshold);
  }

  private async checkNewCustomer(conditions: any, transaction?: SalesTransaction): Promise<boolean> {
    if (!transaction?.customerEmail) return false;

    // Check if this customer has previous transactions
    const previousTxns = await db.query.salesTransactions.findMany({
      where: and(
        eq(salesTransactions.userId, transaction.userId || ''),
        eq(salesTransactions.customerEmail, transaction.customerEmail),
      ),
    });

    // If only 1 transaction exists (the current one), it's a new customer
    return previousTxns.length <= 1;
  }
}

export const posIntegrationService = new PosIntegrationService();
