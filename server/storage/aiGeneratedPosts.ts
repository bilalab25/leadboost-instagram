import { db } from "../db";
import { aiGeneratedPosts } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface AiGeneratedPost {
  id: string;
  jobId: string;
  brandId: string;
  platform: string;
  titulo: string;
  content: string | null;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  dia: string;
  hashtags: string | null;
  status: "pending" | "accepted" | "rejected" | "published";
  type?: string | null;
  isSample: boolean | null;
  scheduledPublishTime?: string | null;
  publishedAt?: string | null;
  lockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Shared mapper to avoid duplication across all query functions
function mapPostRow(r: typeof aiGeneratedPosts.$inferSelect): AiGeneratedPost {
  return {
    id: r.id,
    jobId: r.jobId,
    brandId: r.brandId,
    platform: r.platform,
    titulo: r.titulo,
    content: r.content,
    imageUrl: r.imageUrl,
    cloudinaryPublicId: r.cloudinaryPublicId,
    dia: r.dia,
    hashtags: r.hashtags,
    status: r.status as any,
    type: r.type || "image",
    isSample: r.isSample || false,
    scheduledPublishTime: r.scheduledPublishTime?.toISOString() || null,
    publishedAt: r.publishedAt?.toISOString() || null,
    lockedAt: r.lockedAt?.toISOString() || null,
    createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export async function createAiGeneratedPost(
  data: Omit<
    AiGeneratedPost,
    "id" | "createdAt" | "updatedAt" | "publishedAt"
  >,
): Promise<AiGeneratedPost> {
  const now = new Date();

  // Auto-compute scheduledPublishTime from dia if it's a valid YYYY-MM-DD date
  let scheduledPublishTime: Date | undefined;
  if (data.scheduledPublishTime) {
    scheduledPublishTime = new Date(data.scheduledPublishTime);
  } else if (data.dia && /^\d{4}-\d{2}-\d{2}$/.test(data.dia)) {
    scheduledPublishTime = new Date(data.dia + "T10:00:00");
  }

  const result = await db
    .insert(aiGeneratedPosts)
    .values({
      jobId: data.jobId,
      brandId: data.brandId,
      platform: data.platform,
      titulo: data.titulo,
      content: data.content,
      imageUrl: data.imageUrl,
      cloudinaryPublicId: data.cloudinaryPublicId,
      dia: data.dia,
      hashtags: data.hashtags,
      status: data.status,
      isSample: data.isSample || false,
      type: data.type || "image",
      ...(scheduledPublishTime ? { scheduledPublishTime } : {}),
    })
    .returning();

  if (!result[0]) throw new Error("Failed to create AI generated post");
  return mapPostRow(result[0]);
}

export async function getAiGeneratedPostsByJob(
  jobId: string,
): Promise<AiGeneratedPost[]> {
  const results = await db
    .select()
    .from(aiGeneratedPosts)
    .where(eq(aiGeneratedPosts.jobId, jobId));

  return results.map(mapPostRow);
}

export async function getSamplePostsByBrand(
  brandId: string,
): Promise<AiGeneratedPost[]> {
  const results = await db
    .select()
    .from(aiGeneratedPosts)
    .where(
      and(
        eq(aiGeneratedPosts.brandId, brandId),
        eq(aiGeneratedPosts.isSample, true),
      ),
    );

  return results.map(mapPostRow);
}

export async function getAiGeneratedPostsByBrand(
  brandId: string,
  status?: string,
): Promise<AiGeneratedPost[]> {
  let query = db
    .select()
    .from(aiGeneratedPosts)
    .where(eq(aiGeneratedPosts.brandId, brandId));

  if (status) {
    query = db
      .select()
      .from(aiGeneratedPosts)
      .where(
        and(
          eq(aiGeneratedPosts.brandId, brandId),
          eq(aiGeneratedPosts.status, status),
        ),
      );
  }

  const results = await query;
  return results.map(mapPostRow);
}

export async function updateAiGeneratedPostStatus(
  postId: string,
  status: "pending" | "accepted" | "rejected" | "published",
  scheduledPublishTime?: string,
  imageUrl?: string,
  editedFields?: { titulo?: string; content?: string; hashtags?: string },
): Promise<AiGeneratedPost | null> {
  const now = new Date();
  const updateData: any = { status, updatedAt: now };

  if (scheduledPublishTime) {
    updateData.scheduledPublishTime = new Date(scheduledPublishTime);
  }

  if (imageUrl) {
    updateData.imageUrl = imageUrl;
  }

  if (editedFields?.titulo !== undefined) {
    updateData.titulo = editedFields.titulo;
  }
  if (editedFields?.content !== undefined) {
    updateData.content = editedFields.content;
  }
  if (editedFields?.hashtags !== undefined) {
    updateData.hashtags = editedFields.hashtags;
  }

  // Only allow transitions from valid source statuses (prevents concurrent race conditions)
  const validSourceStatuses: Record<string, string[]> = {
    accepted: ["pending"],
    rejected: ["pending"],
    pending: ["accepted", "rejected", "pending"],
    published: ["accepted"],
  };
  const allowedFrom = validSourceStatuses[status] || [];

  const result = await db
    .update(aiGeneratedPosts)
    .set(updateData)
    .where(
      allowedFrom.length > 0
        ? and(eq(aiGeneratedPosts.id, postId), inArray(aiGeneratedPosts.status, allowedFrom))
        : eq(aiGeneratedPosts.id, postId),
    )
    .returning();

  if (!result[0]) return null;
  return mapPostRow(result[0]);
}

export async function bulkUpdateAiGeneratedPostsStatus(
  postIds: string[],
  status: "pending" | "accepted" | "rejected",
  scheduleTimes?: Record<string, string>,
): Promise<number> {
  if (postIds.length === 0) return 0;

  const now = new Date();

  if (scheduleTimes && Object.keys(scheduleTimes).length > 0) {
    let count = 0;
    for (const postId of postIds) {
      const updateData: any = { status, updatedAt: now };
      if (scheduleTimes[postId]) {
        updateData.scheduledPublishTime = new Date(scheduleTimes[postId]);
      }
      const result = await db
        .update(aiGeneratedPosts)
        .set(updateData)
        .where(eq(aiGeneratedPosts.id, postId))
        .returning();
      if (result.length > 0) count++;
    }
    return count;
  }

  const { inArray } = await import("drizzle-orm");

  const result = await db
    .update(aiGeneratedPosts)
    .set({ status, updatedAt: now })
    .where(inArray(aiGeneratedPosts.id, postIds))
    .returning();

  return result.length;
}
