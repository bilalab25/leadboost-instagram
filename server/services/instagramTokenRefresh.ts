import cron from "node-cron";
import { db } from "../db";
import { integrations } from "@shared/schema";
import { eq, and, lte, isNotNull, inArray } from "drizzle-orm";

/**
 * Instagram Token Refresh Service
 *
 * Instagram Direct long-lived tokens expire after 60 days.
 * This service refreshes them proactively when they are within 7 days of expiry.
 *
 * Facebook Page tokens derived from long-lived user tokens do NOT expire,
 * so only instagram_direct tokens need refreshing.
 */

const REFRESH_WINDOW_DAYS = 7; // Refresh when token expires within 7 days

class InstagramTokenRefreshService {
  private isRunning = false;
  private isRefreshing = false;

  start() {
    if (this.isRunning) {
      console.log("[IGTokenRefresh] Already running");
      return;
    }

    console.log("[IGTokenRefresh] Starting token refresh service - checking daily at 3:00 AM");

    // Run daily at 3:00 AM
    cron.schedule("0 3 * * *", async () => {
      await this.refreshExpiringTokens();
    });

    // Also run once on startup (after a 30-second delay to let the server settle)
    setTimeout(() => this.refreshExpiringTokens(), 30_000);

    this.isRunning = true;
  }

  async refreshExpiringTokens() {
    if (this.isRefreshing) {
      console.log("[IGTokenRefresh] Refresh already in progress, skipping");
      return;
    }
    this.isRefreshing = true;

    const refreshBefore = new Date(
      Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    try {
      // Find instagram_direct integrations with tokens expiring soon
      const expiring = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.provider, "instagram_direct"),
            eq(integrations.isActive, true),
            isNotNull(integrations.accessToken),
            isNotNull(integrations.expiresAt),
            lte(integrations.expiresAt, refreshBefore),
          ),
        );

      if (expiring.length === 0) {
        console.log("[IGTokenRefresh] No tokens need refreshing");
        return;
      }

      console.log(
        `[IGTokenRefresh] Found ${expiring.length} token(s) expiring within ${REFRESH_WINDOW_DAYS} days`,
      );

      let refreshed = 0;
      let failed = 0;

      for (const integration of expiring) {
        try {
          await this.refreshToken(integration);
          refreshed++;
        } catch (err: any) {
          failed++;
          console.error(
            `[IGTokenRefresh] Failed to refresh token for integration ${integration.id} (brand ${integration.brandId}): ${err.message}`,
          );

          // If token is already expired (expiresAt < now), mark integration as needing reconnection
          if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
            try {
              await db
                .update(integrations)
                .set({
                  isActive: false,
                  updatedAt: new Date(),
                  metadata: {
                    ...(integration.metadata as any || {}),
                    tokenExpired: true,
                    tokenExpiredAt: new Date().toISOString(),
                    refreshError: err.message,
                  },
                })
                .where(eq(integrations.id, integration.id));
              console.warn(
                `[IGTokenRefresh] Marked integration ${integration.id} as inactive (token expired and refresh failed)`,
              );
            } catch {
              // Best effort
            }
          }
        }
      }

      console.log(
        `[IGTokenRefresh] Complete: ${refreshed} refreshed, ${failed} failed`,
      );
    } catch (error) {
      console.error("[IGTokenRefresh] Error in refresh cycle:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshToken(
    integration: typeof integrations.$inferSelect,
  ) {
    const currentToken = integration.accessToken;
    if (!currentToken) {
      throw new Error("No access token to refresh");
    }

    // Instagram Graph API token refresh endpoint (30s timeout)
    const refreshRes = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`,
      { signal: AbortSignal.timeout(30_000) },
    );

    if (!refreshRes.ok) {
      const bodyText = await refreshRes.text().catch(() => "");
      // Try to parse as JSON for a structured error message
      let errMsg = `HTTP ${refreshRes.status}`;
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed?.error?.message) errMsg = parsed.error.message;
      } catch {
        if (bodyText) errMsg = bodyText.slice(0, 200);
      }
      throw new Error(`Token refresh failed: ${errMsg}`);
    }

    const refreshData = await refreshRes.json();

    if (refreshData.error) {
      throw new Error(
        refreshData.error.message || "Token refresh API error",
      );
    }

    if (!refreshData.access_token) {
      throw new Error("No access_token in refresh response");
    }

    const newExpiresAt = refreshData.expires_in
      ? new Date(Date.now() + refreshData.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Default 60 days

    // Update the integration with the new token
    await db
      .update(integrations)
      .set({
        accessToken: refreshData.access_token,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integration.id));

    console.log(
      `[IGTokenRefresh] Refreshed token for integration ${integration.id} (@${integration.accountName}). New expiry: ${newExpiresAt.toISOString()}`,
    );
  }
}

export const instagramTokenRefresh = new InstagramTokenRefreshService();
