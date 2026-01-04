import { useEffect, useState } from "react";
import "./App.css";
import { apiFetch } from "./api/client";
import { getErrorMessage } from "./api/errorMessages";
import { ErrorBox } from "./components/ErrorBox";

type Health = { ok: boolean };
type HealthDb = { db: boolean };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthDb, setHealthDb] = useState<HealthDb | null>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const h = await apiFetch<Health>("/health");
        setHealth(h);

        const db = await apiFetch<HealthDb>("/health/db");
        setHealthDb(db);
      } catch (e) {
        setErr(getErrorMessage(e));
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>FONT V2  Front</h1>

      <div style={{ marginTop: 12 }}>
        <div>API /health: {health ? JSON.stringify(health) : "..."}</div>
        <div>API /health/db: {healthDb ? JSON.stringify(healthDb) : "..."}</div>
      </div>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Astuce : si la DB est down ou lAPI est off, tu dois voir un message FR + request_id.
      </p>
    </div>
  );
}
