import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../core/auth/token";
import { ErrorBox } from "../../../core/ui/ErrorBox";
import { listUploads, type UploadRow } from "../api/uploads";

type UploadResponse = {
  ok: true;
  upload_id: string;
  file: { filename: string; mimetype: string; bytes: number; sha256: string };
};

type ApiError = {
  error: { code: string; message: string; statusCode: number; request_id?: string; details?: unknown };
};

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function formatBytes(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);

  const hasToken = useMemo(() => !!getToken(), []);

  async function refreshUploads() {
    setLoadingList(true);
    setErr(null);
    try {
      const res = await listUploads({ limit: 50, offset: 0 });
      setUploads(res.uploads ?? []);
    } catch (e) {
      setErr(e as ApiError);
    } finally {
      setLoadingList(false);
    }
  }

  async function doUpload() {
    if (!file) return;

    setLoadingUpload(true);
    setErr(null);
    setUploadResult(null);

    try {
      const token = getToken();
      if (!token) {
        throw {
          error: { code: "UNAUTHORIZED", message: "Missing token", statusCode: 401 },
        } satisfies ApiError;
      }

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        const apiErr =
          data && typeof data === "object" && data && "error" in (data as any)
            ? (data as ApiError)
            : { error: { code: "HTTP_ERROR", message: res.statusText, statusCode: res.status } };
        throw apiErr;
      }

      setUploadResult(data as UploadResponse);

      // bonus: refresh auto après upload OK
      await refreshUploads();
    } catch (e) {
      setErr(e as ApiError);
    } finally {
      setLoadingUpload(false);
    }
  }

  useEffect(() => {
    // au chargement de la page, on récupère la liste
    if (hasToken) void refreshUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Upload</h2>

      <ErrorBox error={err as any} />

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="Choisir un fichier"
        />
        <button onClick={doUpload} disabled={!file || loadingUpload}>
          {loadingUpload ? "Upload..." : "Uploader"}
        </button>

        <button onClick={refreshUploads} disabled={loadingList}>
          {loadingList ? "Rafraîchissement..." : "Rafraîchir mes uploads"}
        </button>
      </div>

      {uploadResult && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div>
            <strong>Upload OK</strong>  id: {uploadResult.upload_id}
          </div>
          <pre style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}

      <h3 style={{ marginTop: 22 }}>Mes uploads</h3>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Fichier</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Taille</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Date</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>SHA256</th>
            </tr>
          </thead>
          <tbody>
            {uploads.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 8 }}>
                  Aucun upload pour le moment.
                </td>
              </tr>
            ) : (
              uploads.map((u) => (
                <tr key={u.id}>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.filename}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{formatBytes(u.bytes)}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8, fontFamily: "monospace" }}>
                    {u.sha256}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
