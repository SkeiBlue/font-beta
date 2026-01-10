import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { NavBar } from "./NavBar";
import { apiFetch } from "../../../core/api/client";
import { getToken } from "../../../core/auth/token";

type MeResponse = {
  user: {
    sub: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
  };
};

type StdError = {
  error: {
    code: string;
    message: string;
    statusCode: number;
    request_id?: string;
    details?: unknown | null;
  };
};

export function AppLayout() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function refreshMe() {
    setLoading(true);
    try {
      const me = await apiFetch<MeResponse>("/me");
      setEmail(me.user.email);
      setRole(me.user.role);
    } catch (e) {
      const err = e as StdError;

      // si token invalide => logout
      if (err?.error?.statusCode === 401) {
        doLogout();
        return;
      }
      // sinon on garde juste lUI, ça nempêche pas dutiliser le site
      console.error("refreshMe error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function adminPing() {
    setLoading(true);
    try {
      await apiFetch<{ ok: true }>("/admin/ping");
      alert("Admin ping OK ");
    } catch (e) {
      const err = e as StdError;
      alert(`Admin ping KO \n${err?.error?.message ?? "Erreur"}`);
    } finally {
      setLoading(false);
    }
  }

  function doLogout() {
    // clé utilisée par token.ts
    localStorage.removeItem("font_token");
    setEmail(undefined);
    setRole(undefined);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    // si jamais quelquun arrive là sans token
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <NavBar
        email={email}
        role={role}
        onRefresh={refreshMe}
        onAdminPing={adminPing}
        onLogout={doLogout}
        loading={loading}
      />

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #222", borderRadius: 12 }}>
        <Outlet />
      </div>
    </div>
  );
}
