import { useState } from "react";
import { getToken } from "../../../core/auth/token";
import { ErrorBox } from "../../../core/ui/ErrorBox";

type StdError = {
  error: {
    code: string;
    message: string;
    statusCode: number;
    request_id?: string;
    details?: unknown | null;
  };
};

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<StdError | null>(null);
  const [loading, setLoading] = useState(false);

  // Si tu utilises le proxy Vite (/api), mets VITE_API_BASE_URL=/api dans .env
  const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

  async function onAnalyze() {
    setErr(null);
    setResult(null);

    if (!file) {
      setErr({
        error: {
          code: "NO_FILE",
          message: "Choisis un fichier PDF avant de lancer l’analyse.",
          statusCode: 400,
        },
      });
      return;
    }

    const token = getToken();
    if (!token) {
      setErr({
        error: {
          code: "NO_TOKEN",
          message: "Tu dois être connecté (token manquant).",
          statusCode: 401,
        },
      });
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${BASE}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        const apiErr: StdError =
          data && typeof data === "object" && data && "error" in (data as any)
            ? (data as StdError)
            : {
                error: {
                  code: "HTTP_ERROR",
                  message: res.statusText,
                  statusCode: res.status,
                },
              };
        throw apiErr;
      }

      setResult(data);
    } catch (e) {
      const asStd = e as StdError;
      setErr(
        asStd?.error
          ? asStd
          : { error: { code: "UNKNOWN", message: String(e), statusCode: 500 } },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Analyse (PDF)</h2>

      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Envoie un PDF → l’API <code>/analyze</code> répond (pour l’instant: stub OK).
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <button onClick={onAnalyze} disabled={loading || !file}>
          {loading ? "Analyse..." : "Lancer l’analyse"}
        </button>
      </div>

      {err ? (
        <div style={{ marginTop: 16 }}>
          <ErrorBox error={err as any} />
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: 16 }}>
          <h3>Résultat</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#ddd", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
