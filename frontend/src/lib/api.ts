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
    throw new Error(error.detail ?? "Error inesperado");
  }

  return response.json() as Promise<T>;
}

