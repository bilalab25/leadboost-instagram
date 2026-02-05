import cron from "node-cron";
import { db } from "../db";
import { aiGeneratedPosts, brands, integrations } from "@shared/schema";
import { eq, lte, isNull, and, inArray } from "drizzle-orm";

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

        const locked = await this.lockPost(post.id);
        if (!locked) {
          console.log(
            `[PostScheduler] Post ${post.id} already locked by another process, skipping`,
          );
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

      // Publish to Facebook
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

        console.log(
          `[PostScheduler] Facebook post published with id ${data.post_id || data.id}`,
        );
      }

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
          throw new Error(
            data.error?.message || "Facebook video publish failed",
          );
        }

        console.log(
          `[PostScheduler] Facebook video published with id ${data.id}`,
        );
      }

      // Publish to Instagram
      if (post.platform === "instagram") {
        const isDirect = integration.provider === "instagram_direct";
        const baseUrl = isDirect
          ? "https://graph.instagram.com"
          : "https://graph.facebook.com";

        const commonHeaders: Record<string, string> = {};

        const containerParams = new URLSearchParams({
          image_url: post.imageUrl!,
          caption: post.content ?? "",
          access_token: accessToken,
        });

        const containerResponse = await fetch(
          `${baseUrl}/v24.0/${integration.accountId}/media`,
          { method: "POST", headers: commonHeaders, body: containerParams },
        );

        const containerData = await containerResponse.json();

        if (!containerResponse.ok || containerData.error) {
          throw new Error(
            containerData.error?.message || "Instagram container failed",
          );
        }

        // 2) Publish container
        await new Promise((res) => setTimeout(res, 2000));

        const publishParams = new URLSearchParams({
          creation_id: containerData.id,
          access_token: accessToken,
        });

        const publishResponse = await fetch(
          `${baseUrl}/v24.0/${integration.accountId}/media_publish`,
          { method: "POST", headers: commonHeaders, body: publishParams },
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
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));

      console.log(`[PostScheduler] Post ${post.id} published successfully`);
    } catch (error) {
      console.error(
        `[PostScheduler] Failed to publish post ${post.id}:`,
        error,
      );

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
