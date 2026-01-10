const KEY = "font_token";

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(token: string) {
  localStorage.setheaders,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    // backend standard: { error: {...} }
    const err = (data && (data as ApiError).error) ? (data as ApiError) : {
      error: { code: "HTTP_ERROR", message: res.statusText, statusCode: res.status }
    };
    throw err;
  }

  return data as T;
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return null; }
}
