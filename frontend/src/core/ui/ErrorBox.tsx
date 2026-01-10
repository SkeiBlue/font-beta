import { getErrorMessage } from "../errors/errorMessages";

type Props = {
  /** Titre affiché (optionnel si `error` est fourni). */
  title?: string;
  /** Détails affichés (optionnel). */
  details?: string;
  /** Erreur brute (API) → convertie en message simple. */
  error?: unknown;
  onClose?: () => void;
};

export function ErrorBox({ title, details, error, onClose }: Props) {
  let finalTitle = title;
  let finalDetails = details;

  if (!finalTitle && error) {
    const msg = getErrorMessage(error);
    finalTitle = msg.title;
    finalDetails = finalDetails ?? msg.details;
  }

  finalTitle = finalTitle ?? "Une erreur est survenue.";

  return (
    <div style={{ border: "1px solid #ff6b6b", padding: 12, borderRadius: 10, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong>{finalTitle}</strong>
        {onClose ? (
          <button onClick={onClose} style={{ cursor: "pointer" }}>
            Fermer
          </button>
        ) : null}
      </div>
      {finalDetails ? <div style={{ marginTop: 8, fontFamily: "monospace" }}>{finalDetails}</div> : null}
    </div>
  );
}
