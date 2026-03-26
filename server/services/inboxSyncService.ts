import { storage } from '../storage';
import { Server as SocketIOServer } from 'socket.io';
import { billingService } from '../stripe/billingService';

/**
 * Inbox Sync Service
 * Handles triggering initial sync for inbox integrations when subscription is activated
 */

let performInitialSync: any = null;
let performInstagramDirectSync: any = null;
let socketIo: SocketIOServer | null = null;

export function registerSyncFunctions(
  initialSync: (userId: string, integration: any, provider: string) => Promise<void>,
  instagramDirectSync: (userId: string, integration: any) => Promise<void>
) {
  performInitialSync = initialSync;
  performInstagramDirectSync = instagramDirectSync;
}

export function registerSocketIO(io: SocketIOServer) {
  socketIo = io;
}

function emitSyncEvent(brandId: string, event: 'inbox_sync_started' | 'inbox_sync_completed', data?: any) {
  if (socketIo) {
    socketIo.to(`brand:${brandId}`).emit(event, { brandId, ...data });
  }
}

/**
 * Trigger initial sync for all integrations of a brand when inbox subscription is activated
 */
export async function triggerInitialSyncForBrand(brandId: number | string): Promise<void> {
  const brandIdStr = String(brandId);
  if (!performInitialSync || !performInstagramDirectSync) {
    return;
  }

  try {
    const integrations = await storage.getIntegrationsByBrandId(brandIdStr);

    if (!integrations || integrations.length === 0) {
      return;
    }

    const integrationNames = integrations
      .filter(i => !i.hasFetchedHistory)
      .map(i => i.provider);

    if (integrationNames.length > 0) {
      emitSyncEvent(brandIdStr, 'inbox_sync_started', {
        integrations: integrationNames,
        totalCount: integrationNames.length
      });
    }

    const userId = integrations[0].userId;

    for (const integration of integrations) {
      const provider = integration.provider;

      if (integration.hasFetchedHistory) {
        continue;
      }

      try {
        if (provider === 'facebook' || provider === 'instagram' || provider === 'threads') {
          await performInitialSync(userId, integration, provider);
          await storage.markIntegrationAsFetched(integration.id);
        }

        if (provider === 'instagram_direct') {
          await performInstagramDirectSync(userId, integration);
          await storage.markIntegrationAsFetched(integration.id);
        }

        if (provider === 'whatsapp') {
          await storage.markIntegrationAsFetched(integration.id);
        }
      } catch (syncError) {
        // Continue with other integrations even if one fails
      }
    }

    emitSyncEvent(brandIdStr, 'inbox_sync_completed', { success: true });
  } catch (error) {
    emitSyncEvent(brandIdStr, 'inbox_sync_completed', { success: false, error: String(error) });
    throw error;
  }
}

/**
 * Trigger sync for a single newly connected integration
 */
export async function triggerSyncForNewIntegration(integration: any): Promise<void> {
  if (!integration || !integration.brandId || !integration.userId || !integration.id) {
    return;
  }

  const brandId = String(integration.brandId);
  const provider = integration.provider;
  const userId = integration.userId;

  if (!performInitialSync || !performInstagramDirectSync) {
    return;
  }

  const billing = await billingService.getOrCreateBrandBilling(brandId);
  if (!billing?.inboxSubscriptionActive) {
    return;
  }

  if (integration.hasFetchedHistory) {
    return;
  }

  emitSyncEvent(brandId, 'inbox_sync_started', {
    integrations: [provider],
    totalCount: 1
  });

  try {
    if (provider === 'facebook' || provider === 'instagram' || provider === 'threads') {
      await performInitialSync(userId, integration, provider);
      await storage.markIntegrationAsFetched(integration.id);
    }

    if (provider === 'instagram_direct') {
      await performInstagramDirectSync(userId, integration);
      await storage.markIntegrationAsFetched(integration.id);
    }

    if (provider === 'whatsapp') {
      await storage.markIntegrationAsFetched(integration.id);
    }

    emitSyncEvent(brandId, 'inbox_sync_completed', { success: true });
  } catch (error) {
    emitSyncEvent(brandId, 'inbox_sync_completed', { success: false, error: String(error) });
    throw error;
  }
}
