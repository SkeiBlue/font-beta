import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { getErrorMessage } from "../api/errorMessages";
import { ErrorBox } from "../components/ErrorBox";
import { NavBar } from "../components/NavBar";

type MeResponse = {
  user: { email: string; role: string };
};

type UploadResponse = {
  ok: boolean;
  file: { filename: string; mimetype: string; bytes: number; sha256: string };
};

export function UploadPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [err, setErr] = useState<{ title: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMe() {
    try {
      setErr(null);
      const res = await apiFetch<MeResponse>("/me");
      setMe(res);
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  async function onUpload() {
    if (!file) {
      setErr({ title: "Choisis un fichier.", details: undefined });
      return;
    }

    try {
      setLoading(true);
      setErr(null);
      setResult(null);

      const fd = new FormData();
      fd.append("file", file);

      const res = await apiFetch<UploadResponse>("/upload", {
        method: "POST",
        body: fd,
      });

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

      <h2 style={{ marginTop: 16 }}>Upload</h2>
      <p style={{ opacity: 0.85 }}>
        Envoi multipart vers <code>/upload</code>. Le backend ne stocke pas : il renvoie juste infos + hash.
      </p>

      {err ? <ErrorBox title={err.title} details={err.details} onClose={() => setErr(null)} /> : null}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={onUpload} disabled={loading} style={{ padding: "10px 14px", cursor: "pointer" }}>
          {loading ? "Upload..." : "Upload"}
        </button>
      </div>

      {result ? (
        <pre style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#111", color: "#eee", overflow: "auto" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
