import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { getErrorMessage } from "../api/errorMessages";
import { ErrorBox } from "../components/ErrorBox";
import { NavBar } from "../components/NavBar";

type MeResponse = { user: { email: string; role: string } };

export function SharePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<MeResponse>("/me");
        setMe(res);
      } catch (e) {
        setErr(getErrorMessage(e));
      }
    })();
  }, []);

  async function onShare() {
    try {
      setLoading(true);
      setErr(null);
      setResult(null);

      // endpoint existant : POST /share (stub ou réel)
      const res = await apiFetch<unknown>("/share", { method: "POST" });
      setResult(res);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <NavBar email={me?.user.email} role={me?.user.role} />

      <h2 style={{ marginTop: 16 }}>Share</h2>
      <p style={{ opacity: 0.85 }}>
        Appelle <code>POST /share</code> et affiche la réponse. (On enrichira plus tard avec un vrai payload.)
      </p>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      <button onClick={onShare} disabled={loading} style={{ padding: "10px 14px", cursor: "pointer" }}>
        {loading ? "Share..." : "Share"}
      </button>

      {result ? (
        <pre style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
