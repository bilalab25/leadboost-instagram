import crypto from 'crypto';
import { PosIntegration, Product, SalesTransaction, CampaignTrigger } from '@shared/schema';

// Encryption key for sensitive data (use environment variable in production)
const ENCRYPTION_KEY = process.env.POS_ENCRYPTION_KEY || 'default-32-char-key-for-development';

/**
 * POS Integration Service
 * Handles connections to various POS systems like Square, Shopify, Stripe, WooCommerce
 */
export class PosIntegrationService {
  
  /**
   * Encrypt sensitive data like API keys and tokens
   */
  private encryptData(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
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
      console.error(`Error validating ${provider} credentials:`, error);
      return { valid: false, error: 'Failed to validate credentials' };
    }
  }

  /**
   * Square API validation
   */
  private async validateSquareCredentials(credentials: { accessToken: string; applicationId?: string }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    // Mock validation for demo - replace with real Square API call
    console.log('Validating Square credentials');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful validation
    return {
      valid: true,
      storeInfo: {
        businessName: 'Demo Coffee Shop',
        locationId: 'L1234567890',
        merchantId: 'M1234567890',
        currency: 'USD',
        timezone: 'America/New_York',
      }
    };
  }

  /**
   * Shopify API validation
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
    // Mock validation for demo - replace with real Shopify API call
    console.log('Validating Shopify credentials for:', credentials.storeUrl);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      valid: true,
      storeInfo: {
        shopName: 'Demo Boutique',
        domain: credentials.storeUrl,
        email: 'owner@demoboutique.com',
        currency: 'USD',
        timezone: '(GMT-05:00) Eastern Time (US & Canada)',
        planName: 'basic',
      }
    };
  }

  /**
   * Stripe API validation
   */
  private async validateStripeCredentials(credentials: { secretKey: string; publishableKey: string }): Promise<{
    valid: boolean;
    storeInfo?: any;
    error?: string;
  }> {
    // Mock validation for demo - replace with real Stripe API call
    console.log('Validating Stripe credentials');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      valid: true,
      storeInfo: {
        accountId: 'acct_1234567890',
        businessName: 'Demo Restaurant',
        country: 'US',
        currency: 'USD',
        payoutsEnabled: true,
      }
    };
  }

  /**
   * WooCommerce API validation
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
    // Mock validation for demo - replace with real WooCommerce API call
    console.log('Validating WooCommerce credentials for:', credentials.siteUrl);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      valid: true,
      storeInfo: {
        siteName: 'Demo Electronics Store',
        siteUrl: credentials.siteUrl,
        version: '8.5.2',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
      }
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
      console.error(`Error syncing products from ${integration.provider}:`, error);
      return [];
    }
  }

  /**
   * Sync Square products
   */
  private async syncSquareProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    // Mock product sync - replace with real Square API calls
    console.log('Syncing products from Square');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'demo-product-1',
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: 'sq_item_123',
        name: 'Premium Coffee Blend',
        description: 'Our signature coffee blend with notes of chocolate and caramel',
        price: 1299, // $12.99 in cents
        currency: 'USD',
        sku: 'COFFEE-PREMIUM-001',
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
        isActive: true,
        stockQuantity: 50,
        metadata: {
          squareItemId: 'sq_item_123',
          variations: ['12oz', '16oz', '20oz'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'demo-product-2',
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: 'sq_item_456',
        name: 'Artisan Croissant',
        description: 'Freshly baked buttery croissant made with premium French butter',
        price: 695, // $6.95 in cents
        currency: 'USD',
        sku: 'PASTRY-CROISSANT-001',
        category: 'Pastries',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab794f0f5768?w=400',
        isActive: true,
        stockQuantity: 25,
        metadata: {
          squareItemId: 'sq_item_456',
          allergens: ['gluten', 'dairy'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  /**
   * Sync Shopify products
   */
  private async syncShopifyProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    // Mock product sync - replace with real Shopify API calls
    console.log('Syncing products from Shopify');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'demo-product-3',
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: 'shopify_prod_789',
        name: 'Designer Handbag',
        description: 'Elegant leather handbag perfect for any occasion',
        price: 24999, // $249.99 in cents
        currency: 'USD',
        sku: 'HANDBAG-LEATHER-001',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        isActive: true,
        stockQuantity: 15,
        metadata: {
          shopifyProductId: 'shopify_prod_789',
          vendor: 'Premium Accessories Co',
          productType: 'Handbag',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  /**
   * Sync Stripe products
   */
  private async syncStripeProducts(accessToken: string, integration: PosIntegration): Promise<Product[]> {
    // Mock product sync - replace with real Stripe API calls
    console.log('Syncing products from Stripe');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'demo-product-4',
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: 'stripe_prod_101',
        name: 'Monthly Subscription',
        description: 'Premium monthly subscription service',
        price: 2999, // $29.99 in cents
        currency: 'USD',
        sku: 'SUB-MONTHLY-001',
        category: 'Subscriptions',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        isActive: true,
        stockQuantity: null, // Unlimited for subscriptions
        metadata: {
          stripeProductId: 'stripe_prod_101',
          billingInterval: 'month',
          trialPeriod: 7,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  /**
   * Sync WooCommerce products
   */
  private async syncWooCommerceProducts(integration: PosIntegration): Promise<Product[]> {
    // Mock product sync - replace with real WooCommerce API calls
    console.log('Syncing products from WooCommerce');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'demo-product-5',
        posIntegrationId: integration.id,
        userId: integration.userId,
        externalProductId: 'wc_prod_555',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 19999, // $199.99 in cents
        currency: 'USD',
        sku: 'HEADPHONES-WIRELESS-001',
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        isActive: true,
        stockQuantity: 30,
        metadata: {
          wooCommerceId: 'wc_prod_555',
          weight: '0.5',
          dimensions: '20x15x8',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
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
      console.error(`Error processing ${provider} webhook:`, error);
      return { processed: false, error: 'Failed to process webhook' };
    }
  }

  /**
   * Process Square webhook
   */
  private async processSquareWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    console.log('Processing Square webhook:', payload.type);
    
    // Mock webhook processing
    if (payload.type === 'payment.created' || payload.type === 'order.created') {
      return {
        processed: true,
        transactionId: payload.data?.object?.id || 'demo_transaction_square',
      };
    }
    
    return { processed: true };
  }

  /**
   * Process Shopify webhook
   */
  private async processShopifyWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    console.log('Processing Shopify webhook');
    
    // Mock webhook processing
    if (payload.id) {
      return {
        processed: true,
        transactionId: `shopify_${payload.id}`,
      };
    }
    
    return { processed: true };
  }

  /**
   * Process Stripe webhook
   */
  private async processStripeWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    console.log('Processing Stripe webhook:', payload.type);
    
    // Mock webhook processing
    if (payload.type?.includes('payment_intent') || payload.type?.includes('charge')) {
      return {
        processed: true,
        transactionId: payload.data?.object?.id || 'demo_transaction_stripe',
      };
    }
    
    return { processed: true };
  }

  /**
   * Process WooCommerce webhook
   */
  private async processWooCommerceWebhook(payload: any, signature?: string): Promise<{
    processed: boolean;
    transactionId?: string;
    error?: string;
  }> {
    console.log('Processing WooCommerce webhook');
    
    // Mock webhook processing
    if (payload.id) {
      return {
        processed: true,
        transactionId: `wc_order_${payload.id}`,
      };
    }
    
    return { processed: true };
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(integrationId: string): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    topProducts: any[];
    recentTransactions: number;
  }> {
    // Mock statistics - replace with real database queries
    return {
      totalSales: 127500, // $1,275.00 in cents
      totalTransactions: 45,
      averageOrderValue: 2833, // $28.33 in cents
      topProducts: [
        { name: 'Premium Coffee Blend', sales: 25 },
        { name: 'Artisan Croissant', sales: 18 },
        { name: 'Designer Handbag', sales: 2 },
      ],
      recentTransactions: 3,
    };
  }

  /**
   * Check if campaign trigger conditions are met
   */
  async checkTriggerConditions(trigger: CampaignTrigger, transaction?: SalesTransaction): Promise<boolean> {
    try {
      const conditions = trigger.conditions as any;
      
      switch (trigger.triggerType) {
        case 'purchase_milestone':
          // Trigger when total purchases reach a milestone
          return this.checkPurchaseMilestone(conditions, trigger.userId);
          
        case 'low_stock':
          // Trigger when product stock is low
          return this.checkLowStock(conditions, trigger.userId);
          
        case 'new_customer':
          // Trigger for first-time customers
          return this.checkNewCustomer(conditions, transaction);
          
        case 'abandoned_cart':
          // Trigger for abandoned carts (mock for now)
          return this.checkAbandonedCart(conditions, trigger.userId);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking trigger conditions:', error);
      return false;
    }
  }

  private async checkPurchaseMilestone(conditions: any, userId: string): Promise<boolean> {
    // Mock milestone check - replace with real database query
    const totalSales = 127500; // Mock total in cents
    const milestone = conditions.amount * 100; // Convert to cents
    return totalSales >= milestone;
  }

  private async checkLowStock(conditions: any, userId: string): Promise<boolean> {
    // Mock stock check - replace with real database query
    const lowStockThreshold = conditions.threshold || 10;
    // Assume we have products with low stock
    return true; // Mock: always trigger for demo
  }

  private async checkNewCustomer(conditions: any, transaction?: SalesTransaction): Promise<boolean> {
    if (!transaction?.customerEmail) return false;
    
    // Mock new customer check - replace with real database query
    // Check if this is the customer's first transaction
    return true; // Mock: always trigger for demo
  }

  private async checkAbandonedCart(conditions: any, userId: string): Promise<boolean> {
    // Mock abandoned cart check
    const hoursThreshold = conditions.hours || 24;
    return Math.random() > 0.7; // 30% chance for demo
  }
}

export const posIntegrationService = new PosIntegrationService();