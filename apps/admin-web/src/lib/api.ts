export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("rumacare.token");
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("rumacare.token", token);
  else window.localStorage.removeItem("rumacare.token");
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function formatMyr(sen: number | null | undefined): string {
  if (sen == null) return "—";
  return `RM ${(sen / 100).toFixed(2)}`;
}
