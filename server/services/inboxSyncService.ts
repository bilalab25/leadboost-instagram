import { storage } from '../storage';

/**
 * Inbox Sync Service
 * Handles triggering initial sync for inbox integrations when subscription is activated
 */

// Import sync functions from routes (they will be exported)
let performInitialSync: any = null;
let performInstagramDirectSync: any = null;

export function registerSyncFunctions(
  initialSync: (userId: string, integration: any, provider: string) => Promise<void>,
  instagramDirectSync: (userId: string, integration: any) => Promise<void>
) {
  performInitialSync = initialSync;
  performInstagramDirectSync = instagramDirectSync;
  console.log('[InboxSyncService] Sync functions registered');
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
  } catch (error) {
    console.error(`❌ [InboxSyncService] Error syncing brand ${brandId}:`, error);
    throw error;
  }
}
