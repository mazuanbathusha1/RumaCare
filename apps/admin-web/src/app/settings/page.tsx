"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Settings {
  revenueSplitWorkerPercent: number;
  multiplierSat: number;
  multiplierSun: number;
  multiplierPublicHoliday: number;
  broadcastFanout: number;
  offerTimeoutMinutes: number;
  renewalPromptAfterDays: number;
  defaultDiscountPercent: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<Settings>("/settings").then(setSettings).catch(console.error);
  }, []);

  if (!settings) return <div>Loading…</div>;

  function upd<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!settings) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="header">
        <div className="title">Platform Settings</div>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="card" style={{ display: "grid", gap: 16, maxWidth: 640 }}>
        <section>
          <h3 style={{ margin: "0 0 10px" }}>Revenue Split</h3>
          <label>
            Worker share ({settings.revenueSplitWorkerPercent}%)
            <input
              type="range"
              min={0}
              max={100}
              value={settings.revenueSplitWorkerPercent}
              onChange={(e) => upd("revenueSplitWorkerPercent", Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </label>
          <div style={{ fontSize: 13, color: "#555" }}>
            Admin: {100 - settings.revenueSplitWorkerPercent}% · Worker:{" "}
            {settings.revenueSplitWorkerPercent}%
          </div>
        </section>

        <section>
          <h3 style={{ margin: "0 0 10px" }}>Multipliers</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <label>
              Saturday
              <input
                className="input"
                type="number"
                step="0.1"
                value={settings.multiplierSat}
                onChange={(e) => upd("multiplierSat", Number(e.target.value))}
              />
            </label>
            <label>
              Sunday
              <input
                className="input"
                type="number"
                step="0.1"
                value={settings.multiplierSun}
                onChange={(e) => upd("multiplierSun", Number(e.target.value))}
              />
            </label>
            <label>
              Public Holiday
              <input
                className="input"
                type="number"
                step="0.1"
                value={settings.multiplierPublicHoliday}
                onChange={(e) =>
                  upd("multiplierPublicHoliday", Number(e.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section>
          <h3 style={{ margin: "0 0 10px" }}>Dispatch</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <label>
              Broadcast fan-out (N workers)
              <input
                className="input"
                type="number"
                min={1}
                value={settings.broadcastFanout}
                onChange={(e) => upd("broadcastFanout", Number(e.target.value))}
              />
            </label>
            <label>
              Offer timeout (min)
              <input
                className="input"
                type="number"
                min={1}
                value={settings.offerTimeoutMinutes}
                onChange={(e) => upd("offerTimeoutMinutes", Number(e.target.value))}
              />
            </label>
            <label>
              Renewal prompt after (days)
              <input
                className="input"
                type="number"
                min={1}
                value={settings.renewalPromptAfterDays}
                onChange={(e) =>
                  upd("renewalPromptAfterDays", Number(e.target.value))
                }
              />
            </label>
          </div>
        </section>

        <section>
          <h3 style={{ margin: "0 0 10px" }}>Default Discount</h3>
          <label>
            Default % (applied to service types when discount is enabled)
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={settings.defaultDiscountPercent}
              onChange={(e) =>
                upd("defaultDiscountPercent", Number(e.target.value))
              }
            />
          </label>
        </section>

        {msg ? <div style={{ color: "#1f6feb" }}>{msg}</div> : null}
      </div>
    </div>
  );
}
