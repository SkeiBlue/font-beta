import { useState } from "react";
import "./App.css";
import { apiFetch, type ApiError } from "./api/client";
import { getErrorMessage } from "./api/errorMessages";
import { ErrorBox } from "./components/ErrorBox";
import { clearToken, getToken, setToken } from "./auth/token";

type LoginResponse = { access_token: string };

export default function App() {
  const [email, setEmail] = useState("admin@font.local");
  const [password, setPassword] = useState("admin");
  const [token, setTok] = useState<string | null>(getToken());
  const [me, setMe] = useState<unknown>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      setErr(null);
      setMe(null);

      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        json: { email, password },
      });

      setToken(res.access_token);
      setTok(res.access_token);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

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
    setTok(null);
    setMe(null);
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

          <button onClick={onMe} disabled={loading || !token} style={{ padding: "10px 14px", cursor: "pointer" }}>
            {loading ? "..." : "Me"}
          </button>

          <button onClick={onLogout} disabled={!token} style={{ padding: "10px 14px", cursor: "pointer" }}>
            Logout
          </button>
        </div>

        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Token: {token ? <span style={{ fontFamily: "monospace" }}>OK</span> : "Aucun"}
        </div>

        {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

        {me ? (
          <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
            {JSON.stringify(me, null, 2)}
          </pre>
        ) : null}
      </div>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Astuce: si tu fais trop de login daffilée, tu verras TOO_MANY_REQUESTS (429) avec request_id.
      </p>
    </div>
  );
}
