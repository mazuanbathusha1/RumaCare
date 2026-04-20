"use client";

import { useState } from "react";
import { api, setToken } from "@/lib/api";

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string; name: string };
}

export default function LoginPage() {
  const [email, setEmail] = useState("admin@rumacare.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <div className="header">
        <div className="title">Admin Login</div>
      </div>
      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <div style={{ color: "#c62828", fontSize: 13 }}>{error}</div> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
