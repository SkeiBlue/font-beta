type Props = {
  title: string;
  details?: string;
  onClose?: () => void;
};

export function ErrorBox({ title, details, onClose }: Props) {
  return (
    <div style={{ border: "1px solid #ff6b6b", padding: 12, borderRadius: 10, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong>{title}</strong>
        {onClose ? (
          <button onClick={onClose} style={{ cursor: "pointer" }}>
            Fermer
          </button>
        ) : null}
      </div>
      {details ? <div style={{ marginTop: 8, fontFamily: "monospace" }}>{details}</div> : null}
    </div>
  );
}
