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
        // Safety log: record what date the post was scheduled for vs when we're publishing
        console.log(
          `[PostScheduler] Publishing post ${post.id} | platform=${post.platform} | type=${post.type || "image"} | scheduledFor=${post.scheduledPublishTime?.toISOString()} | now=${now.toISOString()}`,
        );
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
      // Normalize platform variants: instagram_story, instagram_reel → instagram
      const isInstagramVariant = post.platform === "instagram" ||
        post.platform === "instagram_story" ||
        post.platform === "instagram_reel";

      // Determine the post type from platform variant if not already set
      let effectiveType = post.type || "image";
      if (post.platform === "instagram_story" && effectiveType === "image") {
        effectiveType = "story";
      } else if (post.platform === "instagram_reel" && effectiveType === "image") {
        effectiveType = "reel";
      }

      const providers = isInstagramVariant
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

      const integration = isInstagramVariant
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
      let publishedMediaId: string | null = null;

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
        publishedMediaId = data.id || data.post_id || null;
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
          title: post.titulo || post.content?.substring(0, 100) || "",
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
        publishedMediaId = data.id || null;
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
        publishedMediaId = data.id || null;
        published = true;
      }

      // Publish to Instagram (image, carousel, story, reel)
      if (isInstagramVariant) {
        // Guard: image/story/reel require imageUrl
        if (!post.imageUrl && effectiveType !== "carousel") {
          throw new Error(`Missing imageUrl for Instagram ${effectiveType} post`);
        }

        const isDirect = integration.provider === "instagram_direct";
        const baseUrl = isDirect
          ? "https://graph.instagram.com"
          : "https://graph.facebook.com";

        const hashtagsString = post.hashtags?.length
          ? "\n\n" + post.hashtags
          : "";

        const finalCaption = (post.content ?? "") + hashtagsString;
        const postType = effectiveType;

        let containerId: string;

        if (postType === "carousel") {
          // Carousel: imageUrl contains comma-separated URLs
          const imageUrls = (post.imageUrl || "").split(",").map((u) => u.trim()).filter(Boolean);
          if (imageUrls.length < 2) {
            throw new Error("Carousel requires at least 2 images");
          }
          if (imageUrls.length > 10) {
            throw new Error("Instagram carousels support a maximum of 10 items");
          }

          // Step 1: Create individual item containers
          const childIds: string[] = [];
          for (const imgUrl of imageUrls) {
            const itemParams = new URLSearchParams({
              image_url: imgUrl,
              is_carousel_item: "true",
              access_token: accessToken,
            });
            const itemRes = await fetch(
              `${baseUrl}/v24.0/${integration.accountId}/media`,
              { method: "POST", body: itemParams },
            );
            const itemData = await itemRes.json();
            if (!itemRes.ok || itemData.error) {
              throw new Error(itemData.error?.message || "Carousel item container failed");
            }
            childIds.push(itemData.id);
          }

          // Step 2: Create carousel container (use JSON body for children array)
          const carouselRes = await fetch(
            `${baseUrl}/v24.0/${integration.accountId}/media?access_token=${accessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                media_type: "CAROUSEL",
                caption: finalCaption,
                children: childIds,
              }),
            },
          );
          const carouselData = await carouselRes.json();
          if (!carouselRes.ok || carouselData.error) {
            throw new Error(carouselData.error?.message || "Carousel container failed");
          }
          containerId = carouselData.id;

        } else if (postType === "story") {
          // Story: single image or video
          const isVideo = post.imageUrl?.match(/\.(mp4|mov|avi)(\?|$)/i);
          const storyParams = new URLSearchParams({
            media_type: "STORIES",
            ...(isVideo
              ? { video_url: post.imageUrl! }
              : { image_url: post.imageUrl! }),
            access_token: accessToken,
          });
          const storyRes = await fetch(
            `${baseUrl}/v24.0/${integration.accountId}/media`,
            { method: "POST", body: storyParams },
          );
          const storyData = await storyRes.json();
          if (!storyRes.ok || storyData.error) {
            throw new Error(storyData.error?.message || "Story container failed");
          }
          containerId = storyData.id;

        } else if (postType === "reel") {
          // Reel: video only
          if (!post.imageUrl) {
            throw new Error("Reel requires a video URL");
          }
          const reelParams = new URLSearchParams({
            media_type: "REELS",
            video_url: post.imageUrl,
            caption: finalCaption,
            access_token: accessToken,
          });
          const reelRes = await fetch(
            `${baseUrl}/v24.0/${integration.accountId}/media`,
            { method: "POST", body: reelParams },
          );
          const reelData = await reelRes.json();
          if (!reelRes.ok || reelData.error) {
            throw new Error(reelData.error?.message || "Reel container failed");
          }
          containerId = reelData.id;

        } else {
          // Default: single image post
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
            throw new Error(containerData.error?.message || "Instagram container failed");
          }
          containerId = containerData.id;
        }

        // Poll for container readiness
        // Images: 10 attempts x 3s = 30s. Videos/Reels: 40 attempts x 5s = 200s (~3 min)
        const isVideoContent = postType === "reel" || postType === "video" || postType === "story";
        const maxAttempts = isVideoContent ? 40 : 10;
        const pollInterval = isVideoContent ? 5000 : 3000;

        let containerReady = false;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((res) => setTimeout(res, pollInterval));
          try {
            const statusRes = await fetch(
              `${baseUrl}/v24.0/${containerId}?fields=status_code&access_token=${accessToken}`,
            );
            const statusData = await statusRes.json();
            if (statusData.status_code === "FINISHED") {
              containerReady = true;
              break;
            }
            if (statusData.status_code === "ERROR") {
              throw new Error(`Instagram ${postType} container processing failed`);
            }
          } catch (pollErr: any) {
            if (pollErr?.message?.includes("processing failed")) throw pollErr;
            // Continue polling on network errors
          }
        }

        if (!containerReady) {
          console.log(`[PostScheduler] ${postType} container polling timed out, attempting publish`);
        }

        // Publish the container
        const publishParams = new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken,
        });

        const publishResponse = await fetch(
          `${baseUrl}/v24.0/${integration.accountId}/media_publish`,
          { method: "POST", body: publishParams },
        );

        const publishData = await publishResponse.json();

        if (!publishResponse.ok || publishData.error) {
          throw new Error(
            publishData.error?.message || `Instagram ${postType} publish failed`,
          );
        }
        publishedMediaId = publishData.id || null;
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
          publishedMediaId: publishedMediaId,
          publishError: null,
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));

      console.log(`[PostScheduler] Post ${post.id} published successfully (mediaId: ${publishedMediaId})`);
    } catch (error: any) {
      // Bug 44: Sanitize error message to avoid logging access tokens
      const safeMessage = error?.message?.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]") || "Unknown error";
      console.error(`[PostScheduler] Failed to publish post ${post.id}: ${safeMessage}`);

      await db
        .update(aiGeneratedPosts)
        .set({
          status: "publish_failed",
          publishError: safeMessage,
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));
    }
  }
}

export const postScheduler = new PostSchedulerService();
