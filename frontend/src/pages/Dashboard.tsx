import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getErrorMessage } from "../api/errorMessages";
import { ErrorBox } from "../components/ErrorBox";
import { clearToken } from "../auth/token";

export function DashboardPage() {
  const nav = useNavigate();
  const [me, setMe] = useState<unknown>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onMe() {
    try {
      setLoading(true);
      setErr(null);
      const res = await apiFetch<unknown>("/me");
      setMe(res);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    clearToken();
    nav("/login", { replace: true });
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>FONT V2  Dashboard</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={onMe} disabled={loading} style={{ padding: "10px 14px", cursor: "pointer" }}>
          {loading ? "..." : "Me"}
        </button>

        <button onClick={onLogout} style={{ padding: "10px 14px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      {me ? (
        <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
          {JSON.stringify(me, null, 2)}
        </pre>
      ) : null}

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Route protégée : si pas de token  redirection vers <code>/login</code>.
      </p>
    </div>
  );
}
