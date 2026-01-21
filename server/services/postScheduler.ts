import cron from "node-cron";
import { db } from "../db";
import { aiGeneratedPosts } from "@shared/schema";
import { eq, lte, isNull, and } from "drizzle-orm";

class PostSchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log("[PostScheduler] Already running");
      return;
    }

    console.log("[PostScheduler] Starting scheduler - checking every minute for posts to publish");
    
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
            isNull(aiGeneratedPosts.publishedAt)
          )
        );

      if (postsToPublish.length === 0) {
        return;
      }

      console.log(`[PostScheduler] Found ${postsToPublish.length} posts ready to publish`);

      for (const post of postsToPublish) {
        await this.publishPost(post);
      }
    } catch (error) {
      console.error("[PostScheduler] Error checking posts:", error);
    }
  }

  private async publishPost(post: typeof aiGeneratedPosts.$inferSelect) {
    console.log(`[PostScheduler] Publishing post ${post.id}`);
    console.log(`  - Platform: ${post.platform}`);
    console.log(`  - Title: ${post.titulo}`);
    console.log(`  - Content: ${post.content?.substring(0, 100)}...`);
    console.log(`  - Image URL: ${post.imageUrl}`);
    console.log(`  - Brand ID: ${post.brandId}`);

    try {
      // TODO: Call your publishing endpoint here
      // Example: await fetch('YOUR_PUBLISH_ENDPOINT', { method: 'POST', body: JSON.stringify(post) });
      
      await db
        .update(aiGeneratedPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedPosts.id, post.id));

      console.log(`[PostScheduler] Successfully marked post ${post.id} as published`);
    } catch (error) {
      console.error(`[PostScheduler] Failed to publish post ${post.id}:`, error);
    }
  }
}

export const postScheduler = new PostSchedulerService();
