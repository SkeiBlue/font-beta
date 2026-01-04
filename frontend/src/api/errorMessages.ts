import type { ApiError } from "./client";

const FR: Record<string, string> = {
  NOT_FOUND: "Page ou ressource introuvable.",
  BAD_REQUEST: "Requête invalide. Vérifie les champs et réessaie.",
  UNAUTHORIZED: "Tu dois être connecté.",
  FORBIDDEN: "Accès refusé.",
  CONFLICT: "Conflit détecté. Réessaie dans un instant.",
  TOO_MANY_REQUESTS: "Trop de requêtes. Attends un moment puis réessaie.",
  DB_ERROR: "Problème base de données. Réessaie dans un instant.",
  INTERNAL_ERROR: "Erreur interne. Réessaie plus tard.",
  HTTP_ERROR: "Erreur réseau. Vérifie ta connexion.",
};

export function getErrorMessage(err: unknown): { title: string; details?: string } {
  const e = err as ApiError | undefined;
  const code = e?.error?.code ?? "HTTP_ERROR";

  const title = FR[code] ?? "Une erreur est survenue.";
  const requestId = e?.error?.request_id ? `request_id: ${e.error.request_id}` : undefined;

  return { title, details: requestId };
}
