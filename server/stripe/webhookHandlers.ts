import { getStripeSync, getStripeClient, getWebhookSecret } from './stripeClient';
import { billingService } from './billingService';
import { triggerInitialSyncForBrand } from '../services/inboxSyncService';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    let event: Stripe.Event;

    // Try Replit sync first (if available), then fall back to direct Stripe verification
    const sync = await getStripeSync();

    if (sync) {
      // Replit mode: use stripe-replit-sync for signature verification + DB sync
      await sync.processWebhook(payload, signature);
      event = JSON.parse(payload.toString()) as Stripe.Event;
    } else {
      // Standalone mode: use Stripe SDK for signature verification
      const webhookSecret = await getWebhookSecret();
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification. Set it in .env');
      }

      const stripe = await getStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

    try {
      console.log(`[Stripe Webhook] Processing event: ${event.type}`);

      // Handle subscription events
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;

        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'setup_intent.succeeded':
          await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
          break;

        case 'payment_method.detached':
          await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
          break;

        case 'payment_intent.succeeded':
          console.log('[Stripe Webhook] Payment succeeded:', (event.data.object as Stripe.PaymentIntent).id);
          break;

        case 'payment_intent.payment_failed':
          console.log('[Stripe Webhook] Payment failed:', (event.data.object as Stripe.PaymentIntent).id);
          break;
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error handling custom event:', error);
      // Don't throw - we still want to return 200 to Stripe since stripe-replit-sync already processed it
    }
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const brandId = subscription.metadata?.brandId;
  if (!brandId) {
    console.log('[Stripe Webhook] Subscription update without brandId:', subscription.id);
    return;
  }

  console.log(`[Stripe Webhook] Subscription ${subscription.id} updated: ${subscription.status}`);
  
  await billingService.updateSubscriptionStatus(
    subscription.id,
    subscription.status,
    subscription.current_period_end
  );
}

async function handleSubscriptionCanceled(subscription: any) {
  const brandId = subscription.metadata?.brandId;
  if (!brandId) return;

  console.log(`[Stripe Webhook] Subscription ${subscription.id} canceled for brand ${brandId}`);
  
  await billingService.updateSubscriptionStatus(subscription.id, 'canceled');
}

async function handleCheckoutCompleted(session: any) {
  const brandId = session.metadata?.brandId;
  const type = session.metadata?.type;

  if (!brandId) {
    console.log('[Stripe Webhook] Checkout completed without brandId');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for brand ${brandId}, type: ${type}`);

  if (type === 'inbox' && session.subscription) {
    // Activate inbox subscription using brandId (not subscriptionId which isn't stored yet)
    await billingService.activateInboxSubscription(
      brandId,
      session.subscription
    );
    console.log(`[Stripe Webhook] Inbox activated for brand ${brandId}`);

    // Trigger initial sync for all brand integrations now that subscription is active
    // Run in background to not block webhook response
    triggerInitialSyncForBrand(brandId).catch((err) => {
      console.error(`[Stripe Webhook] Background sync failed for brand ${brandId}:`, err);
    });
    console.log(`[Stripe Webhook] Initial sync triggered for brand ${brandId}`);
  }
}

async function handleSetupIntentSucceeded(setupIntent: any) {
  const brandId = setupIntent.metadata?.brandId;
  if (!brandId) return;

  console.log(`[Stripe Webhook] Setup intent succeeded for brand ${brandId}`);
  
  await billingService.updatePaymentMethodStatus(brandId, true);
}

async function handlePaymentMethodDetached(paymentMethod: any) {
  const customerId = paymentMethod.customer;
  if (!customerId) {
    console.log('[Stripe Webhook] Payment method detached without customer ID');
    return;
  }

  console.log(`[Stripe Webhook] Payment method detached from customer ${customerId}`);

  // Check if customer still has any payment methods
  const stripe = await getStripeClient();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 1,
  });

  const hasRemainingMethods = paymentMethods.data.length > 0;
  
  // Only update to false if no payment methods remain
  if (!hasRemainingMethods) {
    await billingService.updatePaymentMethodStatusByStripeCustomer(customerId, false);
    console.log(`[Stripe Webhook] Customer ${customerId} no longer has payment methods`);
  }
}
