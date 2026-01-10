import { apiFetch } from "../../../core/api/client";

export type UploadRow = {
  id: string;
  filename: string;
  mimetype: string;
  bytes: number;
  sha256: string;
  created_at: string;
};

export async function listUploads(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  return apiFetch<{ uploads: UploadRow[]; limit: number; offset: number }>(
    `/uploads?limit=${limit}&offset=${offset}`,
  );
}
