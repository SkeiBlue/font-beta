import { useState } from "react";
import { apiFetch } from "../../../core/api/client";
import { ErrorBox } from "../../../core/ui/ErrorBox";
import { getErrorMessage } from "../../../core/errors/errorMessages";

type UiError = { title: string; details?: string };

export function SharePage() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [err, setErr] = useState<UiError | null>(null);

  async function doShare() {
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const res = await apiFetch<{ ok: boolean }>("/share", { method: "POST" });
      setOk(res.ok);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Share</h2>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      <button onClick={doShare} disabled={loading} style={{ padding: "10px 12px", cursor: "pointer" }}>
        {loading ? "..." : "Tester /share"}
      </button>

      {ok !== null ? <p style={{ marginTop: 12 }}>Résultat: {ok ? "OK" : "KO"}</p> : null}
    </div>
  );
}
