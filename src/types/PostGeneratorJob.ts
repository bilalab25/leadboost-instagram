export type PostGeneratorJobStatus = "pending" | "processing" | "completed" | "failed";

export interface PostGeneratorJob {
  id: string;
  brandId: string;
  status: PostGeneratorJobStatus;
  result: any | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
