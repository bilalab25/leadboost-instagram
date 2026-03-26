import cron from "node-cron";
import { db } from "../db";
import { aiGeneratedPosts, brands, integrations } from "@shared/schema";
import { eq, lte, isNull, and, inArray, lt } from "drizzle-orm";

// Lock expiry: 10 minutes — if a process crashes mid-publish, the lock auto-expires
const LOCK_EXPIRY_MS = 10 * 60 * 1000;

class PostSchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log("[PostScheduler] Already running");
      return;
    }

    console.log("[PostScheduler] Starting scheduler - checking every 2 minutes");

    // Check every 2 minutes instead of every minute to reduce DB load
    cron.schedule("*/2 * * * *", async () => {
      await this.cleanStaleLocks();
      await this.checkAndPublishPosts();
    });

    this.isRunning = true;
  }

  // Bug 11: Clean up stale locks from crashed processes
  private async cleanStaleLocks() {
    try {
      const expiryThreshold = new Date(Date.now() - LOCK_EXPIRY_MS);
      const stale = await db
        .update(aiGeneratedPosts)
        .set({ lockedAt: null, updatedAt: new Date() })
        .where(
          and(
            lt(aiGeneratedPosts.lockedAt!, expiryThreshold),
            eq(aiGeneratedPosts.status, "accepted"),
          ),
        )
        .returning({ id: aiGeneratedPosts.id });

      if (stale.length > 0) {
        console.log(`[PostScheduler] Cleaned ${stale.length} stale lock(s)`);
      }
    } catch (error) {
      console.error("[PostScheduler] Error cleaning stale locks:", error);
    }
  }

  private async lockPost(postId: string): Promise<boolean> {
    const result = await db
      .update(aiGeneratedPosts)
      .set({ lockedAt: new Date() })
      .where(
        and(eq(aiGeneratedPosts.id, postId), isNull(aiGeneratedPosts.lockedAt)),
      )
      .returning({ id: aiGeneratedPosts.id });

    return result.length > 0;
  }

  private async checkAndPublishPosts() {
    const now = new Date();

    try {
      const postsToPublish = await db
        .select()
        .from(aiGeneratedPosts)
        .where(
          and(
            eq(aiGeneratedPosts.status, "accepted"),
            lte(aiGeneratedPosts.scheduledPublishTime, now),
            isNull(aiGeneratedPosts.publishedAt),
            isNull(aiGeneratedPosts.lockedAt),
          ),
        );

      if (postsToPublish.length === 0) return;

      console.log(
        `[PostScheduler] Found ${postsToPublish.length} posts ready to publish`,
      );

      for (const post of postsToPublish) {
        const brand = await db
          .select()
          .from(brands)
          .where(eq(brands.id, post.brandId))
          .limit(1);

        if (!brand[0] || brand[0].autoPostEnabled === false) {
          console.log(
            `[PostScheduler] Skipping post ${post.id} - auto-post disabled`,
          );
          await db
            .update(aiGeneratedPosts)
            .set({
              status: "skipped_auto_post_disabled",
              updatedAt: new Date(),
            })
            .where(eq(aiGeneratedPosts.id, post.id));
          continue;
        }

        const locked = await this.lockPost(post.id);
        if (!locked) continue;

        await this.publishPost(post);
      }
    } catch (error) {
      console.error("[PostScheduler] Error checking posts:", error);
    }
  }

  private async publishPost(post: typeof aiGeneratedPosts.$inferSelect) {
    try {
      const providers =
        post.platform === "instagram"
          ? (["instagram_direct", "instagram"] as const)
          : ([post.platform] as const);

      const integrationsList = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.brandId, post.brandId),
            inArray(integrations.provider, providers as any),
          ),
        );

      const integration =
        post.platform === "instagram"
          ? (integrationsList.find((i) => i.provider === "instagram_direct") ??
            integrationsList.find((i) => i.provider === "instagram"))
          : integrationsList[0];

      if (!integration || !integration.accessToken) {
        await db
          .update(aiGeneratedPosts)
          .set({
            status: "no_integration",
            lockedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(aiGeneratedPosts.id, post.id));
        return;
      }

      const accessToken = integration.accessToken;
      let published = false;

      // Publish to Facebook (image)
      if (post.platform === "facebook" && post.type === "image") {
        const params = new URLSearchParams({
          url: post.imageUrl!,
          caption: post.content ?? "",
          published: "true",
          access_token: accessToken,
        });

        const response = await fetch(
          `https://graph.facebook.com/v24.0/${integration.accountId}/photos`,
          { method: "POST", body: params },
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error?.message || "Facebook publish failed");
        }
        published = true;
      }

      // Publish to Facebook (video)
      if (post.platform === "facebook" && post.type === "video") {
        if (!post.imageUrl) {
          throw new Error("Missing imageUrl for Facebook video post");
        }

        const params = new URLSearchParams({
          access_token: accessToken,
          file_url: post.imageUrl,
          title: post.titulo,
          description: post.content ?? "",
          published: "true",
        });

        const response = await fetch(
          `https://graph-video.facebook.com/v24.0/${integration.accountId}/videos`,
          { method: "POST", body: params },
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error?.message || "Facebook video publish failed");
        }
        published = true;
      }

      // Publish to Facebook (text-only or unrecognized type — fallback to feed post)
      if (post.platform === "facebook" && post.type !== "image" && post.type !== "video") {
        const params = new URLSearchParams({
          message: post.content ?? "",
          access_token: accessToken,
        });

        const response = await fetch(
          `https://graph.facebook.com/v24.0/${integration.accountId}/feed`,
          { method: "POST", body: params },
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error?.message || "Facebook text post failed");
        }
        published = true;
      }

      // Publish to Instagram
      if (post.platform === "instagram") {
        const isDirect = integration.provider === "instagram_direct";
        const baseUrl = isDirect
          ? "https://graph.instagram.com"
          : "https://graph.facebook.com";

        const hashtagsString = post.hashtags?.length
          ? "\n\n" + post.hashtags
          : "";

        const finalCaption = (post.content ?? "") + hashtagsString;

        const containerParams = new URLSearchParams({
          image_url: post.imageUrl!,
          caption: finalCaption,
          access_token: accessToken,
        });

        const containerResponse = await fetch(
          `${baseUrl}/v24.0/${integration.accountId}/media`,
          { method: "POST", body: containerParams },
        );

        const containerData = await containerResponse.json();

        if (!containerResponse.ok || containerData.error) {
          throw new Error(
            containerData.error?.message || "Instagram container failed",
          );
        }

        // Poll for container readiness (10 attempts, 3s interval = 30s max)
        let containerReady = false;
        for (let i = 0; i < 10; i++) {
          await new Promise((res) => setTimeout(res, 3000));
          try {
            const statusParams = new URLSearchParams({
              fields: "status_code",
              access_token: accessToken,
            });
            const statusRes = await fetch(
              `${baseUrl}/v24.0/${containerData.id}`,
              { method: "POST", body: statusParams },
            );
            const statusData = await statusRes.json();
            if (statusData.status_code === "FINISHED") {
              containerReady = true;
              break;
            }
            if (statusData.status_code === "ERROR") {
              throw new Error("Instagram container processing failed");
            }
          } catch {
            // Continue polling
          }
        }

        if (!containerReady) {
          // Fallback: try publishing anyway after polling timeout
          console.log("[PostScheduler] Container polling timed out, attempting publish");
        }

        const publishParams = new URLSearchParams({
          creation_id: containerData.id,
          access_token: accessToken,
        });

        const publishResponse = await fetch(
          `${baseUrl}/v24.0/${integration.accountId}/media_publish`,
          { method: "POST", body: publishParams },
        );

        const publishData = await publishResponse.json();

        if (!publishResponse.ok || publishData.error) {
          throw new Error(
            publishData.error?.message || "Instagram publish failed",
          );
        }
        published = true;
      }

      // Bug 18: Unsupported platforms (TikTok, etc.) — mark as unsupported instead of silent success
      if (!published) {
        console.log(
          `[PostScheduler] Platform "${post.platform}" not yet supported for auto-publish`,
        );
        await db
          .update(aiGeneratedPosts)
          .set({
            status: "platform_not_supported",
            lockedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(aiGeneratedPosts.id, post.id));
        return;
      }

      await db
        .update(aiGeneratedPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));

      console.log(`[PostScheduler] Post ${post.id} published successfully`);
    } catch (error: any) {
      // Bug 44: Sanitize error message to avoid logging access tokens
      const safeMessage = error?.message?.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]") || "Unknown error";
      console.error(`[PostScheduler] Failed to publish post ${post.id}: ${safeMessage}`);

      await db
        .update(aiGeneratedPosts)
        .set({
          status: "publish_failed",
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));
    }
  }
}

export const postScheduler = new PostSchedulerService();
