import { db } from "../db";
import { aiGeneratedPosts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
  scheduledPublishTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createAiGeneratedPost(
  data: Omit<AiGeneratedPost, "id" | "createdAt" | "updatedAt" | "scheduledPublishTime" | "publishedAt">
): Promise<AiGeneratedPost> {
  const now = new Date();
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
    })
    .returning();

  if (!result[0]) throw new Error("Failed to create AI generated post");

  return {
    id: result[0].id,
    jobId: result[0].jobId,
    brandId: result[0].brandId,
    platform: result[0].platform,
    titulo: result[0].titulo,
    content: result[0].content,
    imageUrl: result[0].imageUrl,
    cloudinaryPublicId: result[0].cloudinaryPublicId,
    dia: result[0].dia,
    hashtags: result[0].hashtags,
    status: result[0].status as any,
    scheduledPublishTime: result[0].scheduledPublishTime?.toISOString() || null,
    publishedAt: result[0].publishedAt?.toISOString() || null,
    createdAt: result[0].createdAt?.toISOString() || now.toISOString(),
    updatedAt: result[0].updatedAt?.toISOString() || now.toISOString(),
  };
}

export async function getAiGeneratedPostsByJob(jobId: string): Promise<AiGeneratedPost[]> {
  const results = await db
    .select()
    .from(aiGeneratedPosts)
    .where(eq(aiGeneratedPosts.jobId, jobId));

  return results.map((r) => ({
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
    scheduledPublishTime: r.scheduledPublishTime?.toISOString() || null,
    publishedAt: r.publishedAt?.toISOString() || null,
    createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
  }));
}

export async function getAiGeneratedPostsByBrand(brandId: string, status?: string): Promise<AiGeneratedPost[]> {
  let query = db.select().from(aiGeneratedPosts).where(eq(aiGeneratedPosts.brandId, brandId));
  
  if (status) {
    query = db
      .select()
      .from(aiGeneratedPosts)
      .where(and(eq(aiGeneratedPosts.brandId, brandId), eq(aiGeneratedPosts.status, status)));
  }

  const results = await query;

  return results.map((r) => ({
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
    scheduledPublishTime: r.scheduledPublishTime?.toISOString() || null,
    publishedAt: r.publishedAt?.toISOString() || null,
    createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
  }));
}

export async function updateAiGeneratedPostStatus(
  postId: string,
  status: "pending" | "accepted" | "rejected" | "published",
  scheduledPublishTime?: string
): Promise<AiGeneratedPost | null> {
  const now = new Date();
  const updateData: any = { status, updatedAt: now };
  
  if (scheduledPublishTime) {
    updateData.scheduledPublishTime = new Date(scheduledPublishTime);
  }
  
  const result = await db
    .update(aiGeneratedPosts)
    .set(updateData)
    .where(eq(aiGeneratedPosts.id, postId))
    .returning();

  if (!result[0]) return null;

  return {
    id: result[0].id,
    jobId: result[0].jobId,
    brandId: result[0].brandId,
    platform: result[0].platform,
    titulo: result[0].titulo,
    content: result[0].content,
    imageUrl: result[0].imageUrl,
    cloudinaryPublicId: result[0].cloudinaryPublicId,
    dia: result[0].dia,
    hashtags: result[0].hashtags,
    status: result[0].status as any,
    scheduledPublishTime: result[0].scheduledPublishTime?.toISOString() || null,
    publishedAt: result[0].publishedAt?.toISOString() || null,
    createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: result[0].updatedAt?.toISOString() || now.toISOString(),
  };
}

export async function bulkUpdateAiGeneratedPostsStatus(
  postIds: string[],
  status: "pending" | "accepted" | "rejected"
): Promise<number> {
  if (postIds.length === 0) return 0;
  
  const now = new Date();
  const { inArray } = await import("drizzle-orm");
  
  const result = await db
    .update(aiGeneratedPosts)
    .set({ status, updatedAt: now })
    .where(inArray(aiGeneratedPosts.id, postIds))
    .returning();

  return result.length;
}
