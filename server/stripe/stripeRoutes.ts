import { Express } from 'express';
import { billingService } from './billingService';
import { getStripePublishableKey, getUncachableStripeClient } from './stripeClient';
import { db } from '../db';
import { brands, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function registerStripeRoutes(app: Express, isAuthenticated: any, requireBrand?: any) {
  // Get Stripe publishable key
  app.get('/api/stripe/config', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error('[Stripe] Error getting config:', error);
      res.status(500).json({ message: 'Failed to get Stripe config' });
    }
  });

  // Helper: verify the authenticated user has access to the requested brand
  const verifyBrandAccess = async (req: any, res: any): Promise<boolean> => {
    const { brandId } = req.params;
    const userId = req.user?.id;
    if (!userId || !brandId) {
      res.status(400).json({ message: "Missing user or brand context" });
      return false;
    }
    // Check if user has a brand membership for this brand
    try {
      const membership = await db.query.brandMemberships?.findFirst({
        where: (bm: any, { and, eq }: any) => and(eq(bm.userId, userId), eq(bm.brandId, brandId)),
      });
      if (!membership) {
        // Fallback: check if user owns the brand directly
        const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
        if (!brand || brand.userId !== userId) {
          res.status(403).json({ message: "Access denied to this brand" });
          return false;
        }
      }
    } catch {
      // If brand_memberships query fails, fall back to brand ownership check
      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
      if (!brand || brand.userId !== userId) {
        res.status(403).json({ message: "Access denied to this brand" });
        return false;
      }
    }
    return true;
  };

  // Get billing summary for a brand
  app.get('/api/billing/:brandId', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await verifyBrandAccess(req, res))) return;
      const { brandId } = req.params;
      const summary = await billingService.getBillingSummary(brandId);
      res.json(summary);
    } catch (error) {
      console.error('[Billing] Error getting summary:', error);
      res.status(500).json({ message: 'Failed to get billing summary' });
    }
  });

  // Check if brand can generate images
  app.get('/api/billing/:brandId/can-generate', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const result = await billingService.canGenerateImages(brandId);
      res.json(result);
    } catch (error) {
      console.error('[Billing] Error checking generation ability:', error);
      res.status(500).json({ message: 'Failed to check generation ability' });
    }
  });

  // Create or get Stripe customer for a brand
  app.post('/api/billing/:brandId/customer', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const userId = req.user.id;

      // Get brand and user info
      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!brand) {
        return res.status(404).json({ message: 'Brand not found' });
      }

      const billing = await billingService.getOrCreateBrandBilling(brandId);

      // If already has customer, return it
      if (billing.stripeCustomerId) {
        return res.json({ customerId: billing.stripeCustomerId });
      }

      // Create new customer
      const customer = await billingService.createStripeCustomer(
        brandId,
        user?.email || `brand-${brandId}@campaigner.app`,
        brand.name
      );

      res.json({ customerId: customer.id });
    } catch (error) {
      console.error('[Billing] Error creating customer:', error);
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });

  // Create setup intent for adding payment method
  app.post('/api/billing/:brandId/setup-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const userId = req.user.id;

      // Ensure customer exists first
      const billing = await billingService.getOrCreateBrandBilling(brandId);
      
      if (!billing.stripeCustomerId) {
        // Get brand and user info to create customer
        const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!brand) {
          return res.status(404).json({ message: 'Brand not found' });
        }

        await billingService.createStripeCustomer(
          brandId,
          user?.email || `brand-${brandId}@campaigner.app`,
          brand.name
        );
      }

      const setupIntent = await billingService.createSetupIntent(brandId);
      
      res.json({ 
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id 
      });
    } catch (error) {
      console.error('[Billing] Error creating setup intent:', error);
      res.status(500).json({ message: 'Failed to create setup intent' });
    }
  });

  // Confirm payment method was added
  app.post('/api/billing/:brandId/confirm-payment-method', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      
      await billingService.updatePaymentMethodStatus(brandId, true);
      
      res.json({ success: true });
    } catch (error) {
      console.error('[Billing] Error confirming payment method:', error);
      res.status(500).json({ message: 'Failed to confirm payment method' });
    }
  });

  // Create checkout session for inbox subscription ($99/month)
  app.post('/api/billing/:brandId/subscribe-inbox', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const userId = req.user.id;

      // Get or create customer
      let billing = await billingService.getOrCreateBrandBilling(brandId);
      
      if (!billing.stripeCustomerId) {
        const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!brand) {
          return res.status(404).json({ message: 'Brand not found' });
        }

        await billingService.createStripeCustomer(
          brandId,
          user?.email || `brand-${brandId}@campaigner.app`,
          brand.name
        );
        
        billing = await billingService.getOrCreateBrandBilling(brandId);
      }

      const stripe = await getUncachableStripeClient();

      // Create a Checkout Session for the subscription
      const session = await stripe.checkout.sessions.create({
        customer: billing.stripeCustomerId!,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 9900, // $99.00
              recurring: { interval: 'month' },
              product_data: {
                name: 'CampAIgner Inbox',
                description: 'Unified inbox for Instagram, Facebook, and WhatsApp messaging',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/inbox?subscription=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/inbox?subscription=canceled`,
        metadata: { brandId, type: 'inbox' },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error('[Billing] Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  // Check inbox access
  app.get('/api/billing/:brandId/inbox-access', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const hasAccess = await billingService.hasInboxAccess(brandId);
      res.json({ hasAccess });
    } catch (error) {
      console.error('[Billing] Error checking inbox access:', error);
      res.status(500).json({ message: 'Failed to check inbox access' });
    }
  });

  // Get payment methods for a brand
  app.get('/api/billing/:brandId/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const billing = await billingService.getOrCreateBrandBilling(brandId);

      if (!billing.stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }

      const stripe = await getUncachableStripeClient();
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: billing.stripeCustomerId,
        type: 'card',
      });

      const methods = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month?.toString() || '',
        expYear: pm.card?.exp_year?.toString().slice(-2) || '',
        isDefault: pm.id === billing.stripeCustomerId, // Simplified - could check customer's default_payment_method
      }));

      res.json({ paymentMethods: methods });
    } catch (error) {
      console.error('[Billing] Error getting payment methods:', error);
      res.status(500).json({ message: 'Failed to get payment methods' });
    }
  });

  // Delete a payment method
  app.delete('/api/billing/:brandId/payment-methods/:paymentMethodId', isAuthenticated, async (req: any, res) => {
    try {
      if (!(await verifyBrandAccess(req, res))) return;
      const { paymentMethodId } = req.params;
      
      const stripe = await getUncachableStripeClient();
      await stripe.paymentMethods.detach(paymentMethodId);

      res.json({ success: true });
    } catch (error) {
      console.error('[Billing] Error deleting payment method:', error);
      res.status(500).json({ message: 'Failed to delete payment method' });
    }
  });

  // Create customer portal session for managing subscription
  app.post('/api/billing/:brandId/portal', isAuthenticated, async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const billing = await billingService.getOrCreateBrandBilling(brandId);

      if (!billing.stripeCustomerId) {
        return res.status(400).json({ message: 'No billing account found' });
      }

      const stripe = await getUncachableStripeClient();

      const session = await stripe.billingPortal.sessions.create({
        customer: billing.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/settings`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('[Billing] Error creating portal session:', error);
      res.status(500).json({ message: 'Failed to create portal session' });
    }
  });
}
