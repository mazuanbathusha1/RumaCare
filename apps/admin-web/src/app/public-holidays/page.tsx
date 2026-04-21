"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Holiday {
  id: string;
  date: string;
  name: string;
}

function toYmd(iso: string): string {
  return iso.slice(0, 10);
}

export default function PublicHolidaysPage() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState<string>("");

  const load = useCallback(async () => {
    const all = await api<Holiday[]>("/public-holidays");
    setItems(year ? all.filter((h) => toYmd(h.date).startsWith(year)) : all);
  }, [year]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function add() {
    if (!date || !name) return;
    await api("/admin/public-holidays", {
      method: "POST",
      body: JSON.stringify({ date, name }),
    });
    setDate("");
    setName("");
    await load();
  }

  async function patch(id: string, body: Partial<Holiday>) {
    await api(`/admin/public-holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    await load();
  }

  async function remove(id: string) {
    await api(`/admin/public-holidays/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="header">
        <div className="title">Public Holidays (Malaysia)</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <input
            className="input"
            placeholder="Holiday name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn" onClick={add}>
            Add
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#666" }}>Filter year</label>
            <input
              className="input"
              placeholder="e.g. 2025"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ maxWidth: 110 }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 160 }}>Date</th>
              <th>Name</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id}>
                <td>
                  <input
                    type="date"
                    defaultValue={toYmd(h.date)}
                    onBlur={(e) =>
                      e.target.value !== toYmd(h.date) &&
                      patch(h.id, { date: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    defaultValue={h.name}
                    onBlur={(e) =>
                      e.target.value !== h.name && patch(h.id, { name: e.target.value })
                    }
                    style={{ width: "100%" }}
                  />
                </td>
                <td>
                  <button className="btn secondary" onClick={() => remove(h.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: "#999" }}>
                  No holidays {year ? `for ${year}` : ""} — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
        Any date listed here applies the Public Holiday multiplier (configured in Settings)
        to bookings scheduled on that date. The renewal-prompt cron runs daily at 08:00.
      </p>
    </div>
  );
}
