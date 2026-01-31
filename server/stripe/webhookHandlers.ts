import { getStripeSync, getUncachableStripeClient, getWebhookSecret } from './stripeClient';
import { billingService } from './billingService';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Process with stripe-replit-sync for database sync
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Verify and parse the event using Stripe's signature verification
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = await getWebhookSecret();
      
      if (!webhookSecret) {
        console.log('[Stripe Webhook] No webhook secret configured, skipping custom handlers');
        return;
      }

      // Use Stripe's constructEvent to verify signature (security critical!)
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (verifyError: any) {
        console.error('[Stripe Webhook] Signature verification failed:', verifyError.message);
        throw new Error('Webhook signature verification failed');
      }

      // Handle subscription events with verified event data
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

        case 'payment_intent.succeeded':
          console.log('[Stripe Webhook] Payment succeeded:', (event.data.object as Stripe.PaymentIntent).id);
          break;

        case 'payment_intent.payment_failed':
          console.log('[Stripe Webhook] Payment failed:', (event.data.object as Stripe.PaymentIntent).id);
          break;
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error handling custom event:', error);
      // Re-throw signature verification errors
      if (error instanceof Error && error.message.includes('signature')) {
        throw error;
      }
      // Don't throw other errors - we still want to return 200 to Stripe
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
  }
}

async function handleSetupIntentSucceeded(setupIntent: any) {
  const brandId = setupIntent.metadata?.brandId;
  if (!brandId) return;

  console.log(`[Stripe Webhook] Setup intent succeeded for brand ${brandId}`);
  
  await billingService.updatePaymentMethodStatus(brandId, true);
}
