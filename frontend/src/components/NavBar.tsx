import { Link } from "react-router-dom";

type Props = {
  email?: string;
  role?: string;
  onRefresh?: () => void;
  onAdminPing?: () => void;
  onLogout?: () => void;
  loading?: boolean;
};

export function NavBar({ email, role, onRefresh, onAdminPing, onLogout, loading }: Props) {
  const isAdmin = role === "admin";

  const linkStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid #444",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit",
    opacity: 0.9,
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        border: "1px solid #222",
        borderRadius: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>FONT</strong>

        <Link to="/app" style={linkStyle}>
          Dashboard
        </Link>

        <Link to="/app/upload" style={linkStyle}>
          Upload
        </Link>

        <Link to="/app/share" style={linkStyle}>
          Share
        </Link>

        <span style={{ opacity: 0.85 }}>
          {email ? <span style={{ fontFamily: "monospace" }}>{email}</span> : ""}
        </span>

        {role ? (
          <span
            style={{
              fontFamily: "monospace",
              padding: "2px 8px",
              borderRadius: 999,
              border: "1px solid #444",
              opacity: 0.9,
            }}
          >
            {role}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {onRefresh ? (
          <button onClick={onRefresh} disabled={loading} style={{ padding: "8px 12px", cursor: "pointer" }}>
            {loading ? "..." : "Refresh /me"}
          </button>
        ) : null}

        {isAdmin && onAdminPing ? (
          <button onClick={onAdminPing} disabled={loading} style={{ padding: "8px 12px", cursor: "pointer" }}>
            {loading ? "..." : "Admin ping"}
          </button>
        ) : null}

        {onLogout ? (
          <button onClick={onLogout} style={{ padding: "8px 12px", cursor: "pointer" }}>
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
}
