import { db } from '../db';
import { brandBilling, imageUsage } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUncachableStripeClient } from './stripeClient';

const GEMINI_IMAGE_COST_CENTS = 4; // Approximate cost per image generation
const IMAGE_PRICE_MULTIPLIER = 3; // Charge 3x the cost
const IMAGE_PRICE_CENTS = GEMINI_IMAGE_COST_CENTS * IMAGE_PRICE_MULTIPLIER; // 12 cents per image

export class BillingService {
  // Get or create billing record for a brand
  async getOrCreateBrandBilling(brandId: string) {
    const existing = await db.select()
      .from(brandBilling)
      .where(eq(brandBilling.brandId, brandId))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [newBilling] = await db.insert(brandBilling)
      .values({ brandId })
      .returning();
    
    return newBilling;
  }

  // Check if brand can generate images (has free credits or payment method)
  async canGenerateImages(brandId: string): Promise<{ 
    allowed: boolean; 
    freeRemaining: number; 
    hasPaymentMethod: boolean;
    requiresPayment: boolean;
  }> {
    const billing = await this.getOrCreateBrandBilling(brandId);
    
    const freeRemaining = billing.freeImagesRemaining ?? 10;
    let hasPaymentMethod = billing.hasPaymentMethod ?? false;
    
    // If we think they have a payment method but no free credits,
    // verify the Stripe customer actually has a valid payment method
    if (freeRemaining <= 0 && hasPaymentMethod && billing.stripeCustomerId) {
      try {
        const hasValidMethod = await this.verifyStripePaymentMethod(billing.stripeCustomerId);
        if (!hasValidMethod) {
          // Update our record to reflect reality
          await this.updatePaymentMethodStatus(brandId, false);
          hasPaymentMethod = false;
        }
      } catch (error) {
        console.error(`[Billing] Error verifying payment method for brand ${brandId}:`, error);
        // Fail open for free credits, fail closed for paid
        hasPaymentMethod = false;
      }
    }
    
    // Can generate if has free credits OR has verified payment method
    const allowed = freeRemaining > 0 || hasPaymentMethod;
    const requiresPayment = freeRemaining <= 0 && !hasPaymentMethod;

    return { allowed, freeRemaining, hasPaymentMethod, requiresPayment };
  }

  // Verify that a Stripe customer has a valid default payment method
  private async verifyStripePaymentMethod(stripeCustomerId: string): Promise<boolean> {
    const stripe = await getUncachableStripeClient();
    
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted) return false;
    
    // Check if customer has a default payment method
    if (customer.invoice_settings?.default_payment_method) {
      return true;
    }
    
    // Check for any attached payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
      limit: 1,
    });
    
    return paymentMethods.data.length > 0;
  }

  // Record image generation and deduct free credits if applicable
  async recordImageGeneration(brandId: string, endpoint: string, imageCount: number = 1) {
    const billing = await this.getOrCreateBrandBilling(brandId);
    const freeRemaining = billing.freeImagesRemaining ?? 10;
    
    let freeUsed = 0;
    let paidCount = 0;

    if (freeRemaining >= imageCount) {
      // All images are free
      freeUsed = imageCount;
    } else if (freeRemaining > 0) {
      // Some free, some paid
      freeUsed = freeRemaining;
      paidCount = imageCount - freeRemaining;
    } else {
      // All paid
      paidCount = imageCount;
    }

    // Deduct free credits
    if (freeUsed > 0) {
      await db.update(brandBilling)
        .set({ 
          freeImagesRemaining: sql`GREATEST(0, ${brandBilling.freeImagesRemaining} - ${freeUsed})`,
          updatedAt: new Date()
        })
        .where(eq(brandBilling.brandId, brandId));

      // Record free usage
      await db.insert(imageUsage).values({
        brandId,
        endpoint,
        imageCount: freeUsed,
        costCents: 0,
        wasFree: true,
        billed: true, // Free images are already "billed" (no charge)
      });
    }

    // Record paid usage (to be billed later)
    if (paidCount > 0) {
      await db.insert(imageUsage).values({
        brandId,
        endpoint,
        imageCount: paidCount,
        costCents: paidCount * IMAGE_PRICE_CENTS,
        wasFree: false,
        billed: false,
      });
    }

    return { freeUsed, paidCount, costCents: paidCount * IMAGE_PRICE_CENTS };
  }

  // Get unbilled usage for a brand
  async getUnbilledUsage(brandId: string) {
    const result = await db.select({
      totalImages: sql<number>`COALESCE(SUM(${imageUsage.imageCount}), 0)`,
      totalCents: sql<number>`COALESCE(SUM(${imageUsage.costCents}), 0)`,
    })
      .from(imageUsage)
      .where(and(
        eq(imageUsage.brandId, brandId),
        eq(imageUsage.billed, false),
        eq(imageUsage.wasFree, false)
      ));
    
    return {
      totalImages: Number(result[0]?.totalImages ?? 0),
      totalCents: Number(result[0]?.totalCents ?? 0),
    };
  }

  // Get all unbilled usage across all brands (for batch billing)
  async getAllUnbilledUsage() {
    const result = await db.select({
      brandId: imageUsage.brandId,
      totalImages: sql<number>`COALESCE(SUM(${imageUsage.imageCount}), 0)`,
      totalCents: sql<number>`COALESCE(SUM(${imageUsage.costCents}), 0)`,
    })
      .from(imageUsage)
      .where(and(
        eq(imageUsage.billed, false),
        eq(imageUsage.wasFree, false)
      ))
      .groupBy(imageUsage.brandId);
    
    return result.map(r => ({
      brandId: r.brandId,
      totalImages: Number(r.totalImages),
      totalCents: Number(r.totalCents),
    }));
  }

  // Mark usage as billed
  async markUsageAsBilled(brandId: string, stripePaymentIntentId: string) {
    await db.update(imageUsage)
      .set({ 
        billed: true, 
        billedAt: new Date(),
        stripePaymentIntentId 
      })
      .where(and(
        eq(imageUsage.brandId, brandId),
        eq(imageUsage.billed, false)
      ));
  }

  // Create Stripe customer for a brand
  async createStripeCustomer(brandId: string, email: string, brandName: string) {
    const stripe = await getUncachableStripeClient();
    
    const customer = await stripe.customers.create({
      email,
      name: brandName,
      metadata: { brandId },
    });

    await db.update(brandBilling)
      .set({ 
        stripeCustomerId: customer.id,
        updatedAt: new Date()
      })
      .where(eq(brandBilling.brandId, brandId));

    return customer;
  }

  // Create setup intent for adding payment method
  async createSetupIntent(brandId: string) {
    const billing = await this.getOrCreateBrandBilling(brandId);
    
    if (!billing.stripeCustomerId) {
      throw new Error('Brand does not have a Stripe customer');
    }

    const stripe = await getUncachableStripeClient();
    
    const setupIntent = await stripe.setupIntents.create({
      customer: billing.stripeCustomerId,
      payment_method_types: ['card'],
      metadata: { brandId },
    });

    return setupIntent;
  }

  // Update payment method status after successful setup
  async updatePaymentMethodStatus(brandId: string, hasPaymentMethod: boolean) {
    await db.update(brandBilling)
      .set({ 
        hasPaymentMethod,
        updatedAt: new Date()
      })
      .where(eq(brandBilling.brandId, brandId));
  }

  // Create subscription for inbox ($99/month)
  async createInboxSubscription(brandId: string, priceId: string) {
    const billing = await this.getOrCreateBrandBilling(brandId);
    
    if (!billing.stripeCustomerId) {
      throw new Error('Brand does not have a Stripe customer');
    }

    const stripe = await getUncachableStripeClient();

    const subscription = await stripe.subscriptions.create({
      customer: billing.stripeCustomerId,
      items: [{ price: priceId }],
      metadata: { brandId, type: 'inbox' },
    });

    await db.update(brandBilling)
      .set({ 
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        inboxSubscriptionActive: subscription.status === 'active',
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(brandBilling.brandId, brandId));

    return subscription;
  }

  // Update subscription status (called from webhook)
  async updateSubscriptionStatus(subscriptionId: string, status: string, currentPeriodEnd?: number) {
    const updateData: any = { 
      subscriptionStatus: status,
      inboxSubscriptionActive: status === 'active',
      updatedAt: new Date()
    };

    if (currentPeriodEnd) {
      updateData.subscriptionCurrentPeriodEnd = new Date(currentPeriodEnd * 1000);
    }

    await db.update(brandBilling)
      .set(updateData)
      .where(eq(brandBilling.stripeSubscriptionId, subscriptionId));
  }

  // Charge accumulated usage for a brand
  async chargeAccumulatedUsage(brandId: string) {
    const billing = await this.getOrCreateBrandBilling(brandId);
    
    if (!billing.stripeCustomerId || !billing.hasPaymentMethod) {
      console.log(`[Billing] Brand ${brandId} has no payment method, skipping charge`);
      return null;
    }

    const usage = await this.getUnbilledUsage(brandId);
    
    if (usage.totalCents <= 0) {
      console.log(`[Billing] Brand ${brandId} has no unbilled usage`);
      return null;
    }

    const stripe = await getUncachableStripeClient();

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: usage.totalCents,
        currency: 'usd',
        customer: billing.stripeCustomerId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: { 
          brandId, 
          type: 'image_usage',
          imageCount: usage.totalImages.toString(),
        },
        description: `Image generation usage: ${usage.totalImages} images`,
      });

      if (paymentIntent.status === 'succeeded') {
        await this.markUsageAsBilled(brandId, paymentIntent.id);
        console.log(`[Billing] Charged brand ${brandId} $${(usage.totalCents / 100).toFixed(2)} for ${usage.totalImages} images`);
      }

      return paymentIntent;
    } catch (error) {
      console.error(`[Billing] Failed to charge brand ${brandId}:`, error);
      throw error;
    }
  }

  // Check if brand has active inbox subscription
  async hasInboxAccess(brandId: string): Promise<boolean> {
    const billing = await this.getOrCreateBrandBilling(brandId);
    return billing.inboxSubscriptionActive ?? false;
  }

  // Get billing summary for a brand
  async getBillingSummary(brandId: string) {
    const billing = await this.getOrCreateBrandBilling(brandId);
    const unbilledUsage = await this.getUnbilledUsage(brandId);

    return {
      freeImagesRemaining: billing.freeImagesRemaining ?? 10,
      hasPaymentMethod: billing.hasPaymentMethod ?? false,
      inboxSubscriptionActive: billing.inboxSubscriptionActive ?? false,
      subscriptionStatus: billing.subscriptionStatus,
      unbilledImages: unbilledUsage.totalImages,
      unbilledAmountCents: unbilledUsage.totalCents,
    };
  }
}

export const billingService = new BillingService();
