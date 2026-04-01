import cron from "node-cron";
import { db } from "../db";
import { integrations, analytics, aiGeneratedPosts } from "@shared/schema";
import { eq, and, isNotNull, isNull, lte, gte, inArray } from "drizzle-orm";
import { storage } from "../storage";

/**
 * Instagram Insights Ingestion Service
 *
 * Runs daily to:
 * 1. Fetch account-level insights (reach, impressions, followers, profile views)
 * 2. Fetch post-level insights for recently published posts (likes, comments, saves, reach)
 *
 * Stores results in the analytics table for the dashboard/analytics pages.
 */

class InstagramInsightsService {
  private isRunning = false;

  start() {
    if (this.isRunning) return;

    console.log("[IGInsights] Starting insights ingestion - daily at 4:00 AM");

    // Run daily at 4:00 AM (after token refresh at 3:00 AM)
    cron.schedule("0 4 * * *", async () => {
      await this.syncAllBrandInsights();
    });

    // Run once on startup after 60 seconds
    setTimeout(() => this.syncAllBrandInsights(), 60_000);

    this.isRunning = true;
  }

  async syncAllBrandInsights() {
    try {
      // Find all active Instagram integrations
      const igIntegrations = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.isActive, true),
            isNotNull(integrations.accessToken),
            inArray(integrations.provider, ["instagram", "instagram_direct"]),
          ),
        );

      if (igIntegrations.length === 0) {
        console.log("[IGInsights] No active Instagram integrations found");
        return;
      }

      console.log(
        `[IGInsights] Syncing insights for ${igIntegrations.length} integration(s)`,
      );

      let synced = 0;
      let failed = 0;

      for (const integration of igIntegrations) {
        try {
          await this.syncBrandInsights(integration);
          await this.syncPostInsights(integration);
          synced++;
        } catch (err: any) {
          failed++;
          console.error(
            `[IGInsights] Failed for integration ${integration.id}: ${err.message}`,
          );
        }
      }

      console.log(`[IGInsights] Done: ${synced} synced, ${failed} failed`);
    } catch (error) {
      console.error("[IGInsights] Error in sync cycle:", error);
    }
  }

  private async syncBrandInsights(
    integration: typeof integrations.$inferSelect,
  ) {
    const accountId = integration.accountId;
    const token = integration.accessToken;
    const brandId = integration.brandId;
    const isDirect = integration.provider === "instagram_direct";

    if (!accountId || !token) return;

    const baseUrl = isDirect
      ? "https://graph.instagram.com"
      : "https://graph.facebook.com";

    // Fetch account-level metrics
    try {
      // Basic profile info (followers, media count)
      const profileRes = await fetch(
        `${baseUrl}/v24.0/${accountId}?fields=followers_count,media_count&access_token=${token}`,
      );
      const profileData = await profileRes.json();

      if (profileData.followers_count !== undefined) {
        await this.upsertMetric(brandId, "instagram", "followers", profileData.followers_count);
      }
      if (profileData.media_count !== undefined) {
        await this.upsertMetric(brandId, "instagram", "media_count", profileData.media_count);
      }
    } catch (err: any) {
      console.warn(`[IGInsights] Profile fetch failed: ${err.message}`);
    }

    // Fetch account insights (reach, impressions) - last 7 days
    try {
      const insightsRes = await fetch(
        `${baseUrl}/v24.0/${accountId}/insights?metric=reach,impressions&period=day&since=${Math.floor(Date.now() / 1000) - 7 * 86400}&until=${Math.floor(Date.now() / 1000)}&access_token=${token}`,
      );
      const insightsData = await insightsRes.json();

      if (insightsData.data) {
        for (const metric of insightsData.data) {
          // Sum the last 7 days of values
          const total = (metric.values || []).reduce(
            (sum: number, v: any) => sum + (v.value || 0),
            0,
          );
          await this.upsertMetric(brandId, "instagram", metric.name, total, "weekly");
        }
      }
    } catch (err: any) {
      console.warn(`[IGInsights] Account insights failed: ${err.message}`);
    }

    // Fetch online followers (best times to post)
    try {
      const onlineRes = await fetch(
        `${baseUrl}/v24.0/${accountId}/insights?metric=online_followers&period=lifetime&access_token=${token}`,
      );
      const onlineData = await onlineRes.json();

      if (onlineData.data?.[0]?.values?.[0]?.value) {
        const hourlyFollowers = onlineData.data[0].values[0].value;
        // Find peak hour
        let peakHour = 0;
        let peakCount = 0;
        for (const [hour, count] of Object.entries(hourlyFollowers)) {
          if ((count as number) > peakCount) {
            peakCount = count as number;
            peakHour = parseInt(hour);
          }
        }
        await this.upsertMetric(brandId, "instagram", "best_hour", peakHour);
        await this.upsertMetric(brandId, "instagram", "peak_online_followers", peakCount);
      }
    } catch (err: any) {
      // online_followers may not be available for all account types
    }
  }

  private async syncPostInsights(
    integration: typeof integrations.$inferSelect,
  ) {
    const token = integration.accessToken;
    const brandId = integration.brandId;
    const isDirect = integration.provider === "instagram_direct";

    if (!token) return;

    const baseUrl = isDirect
      ? "https://graph.instagram.com"
      : "https://graph.facebook.com";

    // Find posts published in the last 7 days that have a publishedMediaId
    const recentPosts = await db
      .select()
      .from(aiGeneratedPosts)
      .where(
        and(
          eq(aiGeneratedPosts.brandId, brandId),
          eq(aiGeneratedPosts.status, "published"),
          isNotNull(aiGeneratedPosts.publishedMediaId),
          gte(
            aiGeneratedPosts.publishedAt,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ),
        ),
      );

    if (recentPosts.length === 0) return;

    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    for (const post of recentPosts) {
      try {
        const mediaId = post.publishedMediaId;
        const insightsRes = await fetch(
          `${baseUrl}/v24.0/${mediaId}/insights?metric=reach,impressions,likes,comments,saved,shares&access_token=${token}`,
        );
        const insightsData = await insightsRes.json();

        if (insightsData.data) {
          for (const metric of insightsData.data) {
            const value = metric.values?.[0]?.value || 0;
            if (metric.name === "reach") totalReach += value;
            if (metric.name === "impressions") totalImpressions += value;
            if (["likes", "comments", "saved", "shares"].includes(metric.name)) {
              totalEngagement += value;
            }
          }
        }
      } catch (err: any) {
        // Individual post insights may fail if post was deleted
      }
    }

    // Store aggregated post performance
    if (recentPosts.length > 0) {
      await this.upsertMetric(brandId, "instagram", "post_reach_7d", totalReach, "weekly");
      await this.upsertMetric(brandId, "instagram", "post_impressions_7d", totalImpressions, "weekly");
      await this.upsertMetric(brandId, "instagram", "post_engagement_7d", totalEngagement, "weekly");
      await this.upsertMetric(
        brandId,
        "instagram",
        "avg_engagement_rate",
        totalImpressions > 0
          ? Math.round((totalEngagement / totalImpressions) * 10000) // Store as basis points (e.g., 350 = 3.50%)
          : 0,
        "weekly",
      );
    }
  }

  private async upsertMetric(
    brandId: string,
    platform: string,
    metric: string,
    value: number,
    period: string = "daily",
  ) {
    try {
      await storage.createAnalytics({
        brandId,
        platform,
        metric,
        value,
        period,
        recordedAt: new Date(),
      });
    } catch (err: any) {
      // Ignore duplicate errors
    }
  }
}

export const instagramInsights = new InstagramInsightsService();
