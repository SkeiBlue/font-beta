import { getToken } from "../auth/token";

export type ApiError = {
  error: {
    code: string;
    message?: string;
    statusCode?: number;
    request_id?: string;
    details?: unknown;
    params?: unknown;
  };
};

let BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4001";

export function setApiBaseUrl(url: string) {
  BASE_URL = url;
}


export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (options.json !== undefined) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (data && (data as ApiError).error) throw data as ApiError;
    throw {
      error: { code: "HTTP_ERROR", message: res.statusText, statusCode: res.status },
    } as ApiError;
  }

  return data as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
