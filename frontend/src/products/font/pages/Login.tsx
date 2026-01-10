import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../core/api/client";
import { getErrorMessage } from "../../../core/errors/errorMessages";
import { ErrorBox } from "../../../core/ui/ErrorBox";
import { getToken, setToken, clearToken } from "../../../core/auth/token";

type LoginResponse = { access_token: string };

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@font.local");
  const [password, setPassword] = useState("admin");
  const [token, setTok] = useState<string | null>(getToken());
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      setErr(null);

      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        json: { email, password },
      });

      setToken(res.access_token);
      setTok(res.access_token);

      nav("/app", { replace: true });
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    clearToken();
    setTok(null);
    setErr(null);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>FONT V2  Login</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="email"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="password"
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onLogin} disabled={loading} style={{ padding: "10px 14px", cursor: "pointer" }}>
            {loading ? "..." : "Login"}
          </button>

          <button onClick={onLogout} disabled={!token} style={{ padding: "10px 14px", cursor: "pointer" }}>
            Logout
          </button>
        </div>

        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Token: {token ? <span style={{ fontFamily: "monospace" }}>OK</span> : "Aucun"}
        </div>

        {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

        <p style={{ marginTop: 12, opacity: 0.8 }}>
          Après Login  redirection automatique vers <code>/app</code>.
        </p>
      </div>
    </div>
  );
}
