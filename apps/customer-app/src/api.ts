import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3001/api";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("rumacare.token");
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem("rumacare.token", token);
  else await AsyncStorage.removeItem("rumacare.token");
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function formatMyr(sen: number | null | undefined): string {
  if (sen == null) return "—";
  return `RM ${(sen / 100).toFixed(2)}`;
}
