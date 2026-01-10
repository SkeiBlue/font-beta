import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../core/api/client";
import { ErrorBox } from "../../../core/ui/ErrorBox";
import { getErrorMessage } from "../../../core/errors/errorMessages";

type UiError = { title: string; details?: string };
type Health = { ok: boolean };
type DbHealth = { db: boolean };

export function DashboardPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [db, setDb] = useState<DbHealth | null>(null);
  const [err, setErr] = useState<UiError | null>(null);

  async function refresh() {
    setErr(null);
    try {
      const h = await apiFetch<Health>("/health");
      setHealth(h);

      const d = await apiFetch<DbHealth>("/health/db");
      setDb(d);
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid #444",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit",
    opacity: 0.9,
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Dashboard</h2>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
        <div>
          <div style={{ opacity: 0.8 }}>API</div>
          <div style={{ fontFamily: "monospace" }}>{health ? JSON.stringify(health) : "..."}</div>
        </div>

        <div>
          <div style={{ opacity: 0.8 }}>DB</div>
          <div style={{ fontFamily: "monospace" }}>{db ? JSON.stringify(db) : "..."}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link to="/app/upload" style={linkStyle}>
          Upload
        </Link>
        <Link to="/app/analyze" style={linkStyle}>
          Analyse
        </Link>
        <Link to="/app/share" style={linkStyle}>
          Share
        </Link>

        <button onClick={refresh} style={{ padding: "8px 12px", cursor: "pointer" }}>
          Rafraîchir
        </button>
      </div>
    </div>
  );
}
