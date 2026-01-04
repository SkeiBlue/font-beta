import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getErrorMessage } from "../api/errorMessages";
import { ErrorBox } from "../components/ErrorBox";
import { NavBar } from "../components/NavBar";
import { clearToken } from "../auth/token";

type MeResponse = {
  user: {
    sub: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
  };
};

type AdminPing = { ok: true };

export function DashboardPage() {
  const nav = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [adminPing, setAdminPing] = useState<AdminPing | null>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMe() {
    try {
      setLoading(true);
      setErr(null);
      setAdminPing(null);
      const res = await apiFetch<MeResponse>("/me");
      setMe(res);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAdminPing() {
    try {
      setLoading(true);
      setErr(null);
      const res = await apiFetch<AdminPing>("/admin/ping");
      setAdminPing(res);
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

  useEffect(() => {
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <NavBar
        email={me?.user.email}
        role={me?.user.role}
        loading={loading}
        onRefresh={loadMe}
        onAdminPing={onAdminPing}
        onLogout={onLogout}
      />

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      {me ? (
        <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
          {JSON.stringify(me, null, 2)}
        </pre>
      ) : null}

      {adminPing ? (
        <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
          {JSON.stringify(adminPing, null, 2)}
        </pre>
      ) : null}

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Admin ping napparaît que si <code>role === admin</code>.
      </p>
    </div>
  );
}
