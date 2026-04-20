"use client";

import { useEffect, useState } from "react";
import { api, formatMyr } from "@/lib/api";

interface Subject {
  id: string;
  name: string;
  rate: number;
  enabled: boolean;
}

export default function SubjectsPage() {
  const [items, setItems] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("150");

  async function load() {
    setItems(await api<Subject[]>("/subjects"));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function add() {
    if (!name) return;
    await api("/subjects", {
      method: "POST",
      body: JSON.stringify({ name, rate: Math.round(Number(rate) * 100) }),
    });
    setName("");
    await load();
  }

  async function patch(id: string, body: Partial<Subject>) {
    await api(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    await load();
  }

  async function remove(id: string) {
    await api(`/subjects/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="header">
        <div className="title">Tuition Subjects</div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Subject name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Monthly rate (MYR)"
            type="number"
            min={0}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <button className="btn" onClick={add}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rate (monthly)</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>
                  <input
                    defaultValue={s.name}
                    onBlur={(e) =>
                      e.target.value !== s.name && patch(s.id, { name: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={(s.rate / 100).toFixed(2)}
                    onBlur={(e) => {
                      const val = Math.round(Number(e.target.value) * 100);
                      if (val !== s.rate) patch(s.id, { rate: val });
                    }}
                    style={{ width: 100 }}
                  />{" "}
                  <span style={{ fontSize: 12, color: "#999" }}>{formatMyr(s.rate)}</span>
                </td>
                <td>
                  <button
                    className={s.enabled ? "badge" : "badge off"}
                    onClick={() => patch(s.id, { enabled: !s.enabled })}
                  >
                    {s.enabled ? "On" : "Off"}
                  </button>
                </td>
                <td>
                  <button className="btn secondary" onClick={() => remove(s.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
