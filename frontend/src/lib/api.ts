const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Error inesperado" }));
    const detail = error.detail;
    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => item.msg || item.message || JSON.stringify(item))
        .join(". ");
      throw new Error(message || "Error de validacion");
    }
    throw new Error(typeof detail === "string" ? detail : "Error inesperado");
  }

  return response.json() as Promise<T>;
}
