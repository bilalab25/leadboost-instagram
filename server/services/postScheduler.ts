import cron from "node-cron";
import { db } from "../db";
import { aiGeneratedPosts, brands, integrations } from "@shared/schema";
import { eq, lte, isNull, and } from "drizzle-orm";

class PostSchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log("[PostScheduler] Already running");
      return;
    }

    console.log(
      "[PostScheduler] Starting scheduler - checking every minute for posts to publish",
    );

    cron.schedule("* * * * *", async () => {
      await this.checkAndPublishPosts();
    });

    this.isRunning = true;
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
          ),
        );

      if (postsToPublish.length === 0) {
        return;
      }

      console.log(
        `[PostScheduler] Found ${postsToPublish.length} posts ready to publish`,
      );

      for (const post of postsToPublish) {
        // Check if brand has auto-post enabled
        const brand = await db
          .select()
          .from(brands)
          .where(eq(brands.id, post.brandId))
          .limit(1);

        if (!brand[0] || brand[0].autoPostEnabled === false) {
          console.log(
            `[PostScheduler] Skipping post ${post.id} - auto-post disabled for brand ${post.brandId}`,
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

        await this.publishPost(post);
      }
    } catch (error) {
      console.error("[PostScheduler] Error checking posts:", error);
    }
  }

  private async publishPost(post: typeof aiGeneratedPosts.$inferSelect) {
    console.log(`[PostScheduler] Publishing post ${post.id}`);

    try {
      const integrationsList = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.brandId, post.brandId),
            eq(integrations.provider, post.platform),
          ),
        );

      const integration = integrationsList[0];

      if (!integration) {
        await db
          .update(aiGeneratedPosts)
          .set({
            status: "no_integration",
            updatedAt: new Date(),
          })
          .where(eq(aiGeneratedPosts.id, post.id));
        return;
      }

      if (post.platform === "facebook") {
        const params = new URLSearchParams({
          url: post.imageUrl,
          caption: post.content ?? "",
          published: "true",
          access_token: integration.accessToken,
        });

        const response = await fetch(
          `https://graph.facebook.com/v24.0/${integration.accountId}/photos`,
          { method: "POST", body: params },
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error?.message || "Facebook publish failed");
        }

        console.log(
          `[PostScheduler] Facebook post published with id ${data.post_id || data.id}`,
        );
      }
      if (post.platform === "instagram") {
        const params = new URLSearchParams({
          image_url: post.imageUrl,
          caption: post.content ?? "",
          access_token: integration.accessToken,
        });

        const containerResponse = await fetch(
          `https://graph.facebook.com/v24.0/${integration.accountId}/media`,
          { method: "POST", body: params },
        );

        const containerData = await containerResponse.json();

        if (!containerResponse.ok || containerData.error) {
          throw new Error(
            containerData.error?.message || "Instagram container failed",
          );
        }

        await new Promise((res) => setTimeout(res, 2000));

        const publishResponse = await fetch(
          `https://graph.facebook.com/v24.0/${integration.accountId}/media_publish`,
          {
            method: "POST",
            body: new URLSearchParams({
              creation_id: containerData.id,
              access_token: integration.accessToken,
            }),
          },
        );

        const publishData = await publishResponse.json();

        if (!publishResponse.ok || publishData.error) {
          throw new Error(
            publishData.error?.message || "Instagram publish failed",
          );
        }
      }

      await db
        .update(aiGeneratedPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));
    } catch (error) {
      console.error(
        `[PostScheduler] Failed to publish post ${post.id}:`,
        error,
      );

      await db
        .update(aiGeneratedPosts)
        .set({
          status: "publish_failed",
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));
    }
  }
}

export const postScheduler = new PostSchedulerService();
