import { db } from "../db";
import { postGeneratorJobs } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface PostGeneratorJob {
  id: string;
  brandId: string;
  status: "pending" | "processing" | "completed" | "failed" | "payment_required";
  result: any | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createPostGeneratorJob(
  brandId: string,
): Promise<PostGeneratorJob> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const result = await db
    .insert(postGeneratorJobs)
    .values({
      id,
      brandId,
      status: "pending",
      result: null,
      error: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    })
    .returning();

  if (!result[0]) throw new Error("Failed to create job");

  return {
    id: result[0].id,
    brandId: result[0].brandId,
    status: result[0].status as any,
    result: result[0].result,
    error: result[0].error,
    createdAt: result[0].createdAt?.toISOString() || now,
    updatedAt: result[0].updatedAt?.toISOString() || now,
  };
}

export async function updatePostGeneratorJob(
  jobId: string,
  updates: Partial<Omit<PostGeneratorJob, "id" | "brandId" | "createdAt">>,
): Promise<PostGeneratorJob | null> {
  const now = new Date();
  const result = await db
    .update(postGeneratorJobs)
    .set({
      ...updates,
      updatedAt: now,
    })
    .where(eq(postGeneratorJobs.id, jobId))
    .returning();

  if (!result[0]) return null;

  return {
    id: result[0].id,
    brandId: result[0].brandId,
    status: result[0].status as any,
    result: result[0].result,
    error: result[0].error,
    createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: result[0].updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export async function getPostGeneratorJob(
  jobId: string,
): Promise<PostGeneratorJob | null> {
  const result = await db
    .select()
    .from(postGeneratorJobs)
    .where(eq(postGeneratorJobs.id, jobId))
    .limit(1);

  if (!result[0]) return null;

  return {
    id: result[0].id,
    brandId: result[0].brandId,
    status: result[0].status as any,
    result: result[0].result,
    error: result[0].error,
    createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: result[0].updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export async function getActiveJobByBrand(
  brandId: string,
): Promise<PostGeneratorJob | null> {
  // Query directly for pending/processing/payment_required jobs, ordered by newest first
  // Include payment_required so modal can reappear on page refresh
  const result = await db
    .select()
    .from(postGeneratorJobs)
    .where(
      and(
        eq(postGeneratorJobs.brandId, brandId),
        or(
          eq(postGeneratorJobs.status, "pending"),
          eq(postGeneratorJobs.status, "processing"),
          eq(postGeneratorJobs.status, "payment_required")
        )
      )
    )
    .orderBy(desc(postGeneratorJobs.createdAt))
    .limit(1);

  if (!result[0]) return null;

  return {
    id: result[0].id,
    brandId: result[0].brandId,
    status: result[0].status as any,
    result: result[0].result,
    error: result[0].error,
    createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: result[0].updatedAt?.toISOString() || new Date().toISOString(),
  };
}
