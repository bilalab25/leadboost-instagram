import { storage } from '../storage';
import { Server as SocketIOServer } from 'socket.io';
import { billingService } from '../stripe/billingService';

/**
 * Inbox Sync Service
 * Handles triggering initial sync for inbox integrations when subscription is activated
 */

// Import sync functions from routes (they will be exported)
let performInitialSync: any = null;
let performInstagramDirectSync: any = null;
let socketIo: SocketIOServer | null = null;

export function registerSyncFunctions(
  initialSync: (userId: string, integration: any, provider: string) => Promise<void>,
  instagramDirectSync: (userId: string, integration: any) => Promise<void>
) {
  performInitialSync = initialSync;
  performInstagramDirectSync = instagramDirectSync;
  console.log('[InboxSyncService] Sync functions registered');
}

export function registerSocketIO(io: SocketIOServer) {
  socketIo = io;
  console.log('[InboxSyncService] Socket.IO registered');
}

function emitSyncEvent(brandId: string, event: 'inbox_sync_started' | 'inbox_sync_completed', data?: any) {
  if (socketIo) {
    socketIo.to(`brand:${brandId}`).emit(event, { brandId, ...data });
    console.log(`📡 [InboxSyncService] Emitted ${event} for brand ${brandId}`);
  }
}

/**
 * Trigger initial sync for all integrations of a brand when inbox subscription is activated
 * This is called from the Stripe webhook when checkout is completed for inbox subscription
 */
export async function triggerInitialSyncForBrand(brandId: number | string): Promise<void> {
  const brandIdStr = String(brandId);
  if (!performInitialSync || !performInstagramDirectSync) {
    console.error('[InboxSyncService] Sync functions not registered yet');
    return;
  }

  console.log(`\n🔄 [InboxSyncService] Starting initial sync for brand ${brandIdStr} after subscription activation`);

  try {
    // Get all integrations for the brand
    const integrations = await storage.getIntegrationsByBrandId(brandIdStr);
    
    if (!integrations || integrations.length === 0) {
      console.log(`[InboxSyncService] No integrations found for brand ${brandId}`);
      return;
    }

    // Emit sync started event
    const integrationNames = integrations
      .filter(i => !i.hasFetchedHistory)
      .map(i => i.provider);
    
    if (integrationNames.length > 0) {
      emitSyncEvent(brandIdStr, 'inbox_sync_started', { 
        integrations: integrationNames,
        totalCount: integrationNames.length 
      });
    }

    // Get a userId from any integration (they all belong to the same brand)
    const userId = integrations[0].userId;

    for (const integration of integrations) {
      const provider = integration.provider;

      // Skip if already synced
      if (integration.hasFetchedHistory) {
        console.log(`[InboxSyncService] Skipping ${provider} - already synced`);
        continue;
      }

      try {
        // Sync for Meta platforms via Facebook API (Facebook, Instagram, Threads)
        if (provider === 'facebook' || provider === 'instagram' || provider === 'threads') {
          console.log(`[InboxSyncService] Starting sync for ${provider} (${integration.accountName})`);
          await performInitialSync(userId, integration, provider);
          await storage.markIntegrationAsFetched(integration.id);
          console.log(`✅ [InboxSyncService] Completed sync for ${provider}`);
        }

        // Sync for Instagram Direct (via Instagram Login API)
        if (provider === 'instagram_direct') {
          console.log(`[InboxSyncService] Starting sync for instagram_direct (${integration.accountName})`);
          await performInstagramDirectSync(userId, integration);
          await storage.markIntegrationAsFetched(integration.id);
          console.log(`✅ [InboxSyncService] Completed sync for instagram_direct`);
        }

        // Sync for WhatsApp
        if (provider === 'whatsapp') {
          console.log(`[InboxSyncService] WhatsApp sync triggered for ${integration.accountName}`);
          // WhatsApp typically doesn't have historical sync, just mark as fetched
          await storage.markIntegrationAsFetched(integration.id);
          console.log(`✅ [InboxSyncService] Completed setup for whatsapp`);
        }
      } catch (syncError) {
        console.error(`❌ [InboxSyncService] Failed sync for ${provider}:`, syncError);
        // Continue with other integrations even if one fails
      }
    }

    console.log(`🏁 [InboxSyncService] Completed all syncs for brand ${brandId}`);
    
    // Emit sync completed event
    emitSyncEvent(brandIdStr, 'inbox_sync_completed', { success: true });
  } catch (error) {
    console.error(`❌ [InboxSyncService] Error syncing brand ${brandId}:`, error);
    // Emit sync completed with error
    emitSyncEvent(brandIdStr, 'inbox_sync_completed', { success: false, error: String(error) });
    throw error;
  }
}

/**
 * Trigger sync for a single newly connected integration
 * Called when a new integration is connected and the brand already has an active inbox subscription
 */
export async function triggerSyncForNewIntegration(integration: any): Promise<void> {
  // Guard against null/undefined integrations
  if (!integration || !integration.brandId || !integration.userId || !integration.id) {
    console.error('[InboxSyncService] Invalid integration object, skipping sync');
    return;
  }

  const brandId = String(integration.brandId);
  const provider = integration.provider;
  const userId = integration.userId;

  if (!performInitialSync || !performInstagramDirectSync) {
    console.error('[InboxSyncService] Sync functions not registered yet');
    return;
  }

  // Check if brand has active inbox subscription
  const billing = await billingService.getOrCreateBrandBilling(brandId);
  if (!billing?.inboxSubscriptionActive) {
    console.log(`[InboxSyncService] Brand ${brandId} does not have active inbox subscription, skipping sync`);
    return;
  }

  // Skip if already synced
  if (integration.hasFetchedHistory) {
    console.log(`[InboxSyncService] Integration ${provider} already synced, skipping`);
    return;
  }

  console.log(`\n🔄 [InboxSyncService] Starting sync for newly connected ${provider} (brand ${brandId})`);

  // Emit sync started event
  emitSyncEvent(brandId, 'inbox_sync_started', { 
    integrations: [provider],
    totalCount: 1 
  });

  try {
    // Sync based on provider type
    if (provider === 'facebook' || provider === 'instagram' || provider === 'threads') {
      console.log(`[InboxSyncService] Starting sync for ${provider} (${integration.accountName})`);
      await performInitialSync(userId, integration, provider);
      await storage.markIntegrationAsFetched(integration.id);
      console.log(`✅ [InboxSyncService] Completed sync for ${provider}`);
    }

    if (provider === 'instagram_direct') {
      console.log(`[InboxSyncService] Starting sync for instagram_direct (${integration.accountName})`);
      await performInstagramDirectSync(userId, integration);
      await storage.markIntegrationAsFetched(integration.id);
      console.log(`✅ [InboxSyncService] Completed sync for instagram_direct`);
    }

    if (provider === 'whatsapp') {
      console.log(`[InboxSyncService] WhatsApp setup for ${integration.accountName}`);
      await storage.markIntegrationAsFetched(integration.id);
      console.log(`✅ [InboxSyncService] Completed setup for whatsapp`);
    }

    console.log(`🏁 [InboxSyncService] Completed sync for new integration ${provider}`);
    emitSyncEvent(brandId, 'inbox_sync_completed', { success: true });
  } catch (error) {
    console.error(`❌ [InboxSyncService] Error syncing ${provider}:`, error);
    emitSyncEvent(brandId, 'inbox_sync_completed', { success: false, error: String(error) });
    throw error;
  }
}
