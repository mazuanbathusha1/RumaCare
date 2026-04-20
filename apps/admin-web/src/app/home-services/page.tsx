"use client";

import { useEffect, useState } from "react";
import { api, formatMyr } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  workerFeePerView: number;
  enabled: boolean;
}

export default function HomeServicesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("5.00");

  async function load() {
    setItems(await api<Category[]>("/home-services/categories"));
  }
  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function add() {
    if (!name) return;
    await api("/home-services/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        workerFeePerView: Math.round(Number(fee) * 100),
      }),
    });
    setName("");
    await load();
  }

  async function patch(id: string, body: Partial<Category>) {
    await api(`/home-services/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    await load();
  }

  async function remove(id: string) {
    await api(`/home-services/categories/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="header">
        <div className="title">Home Services (Yellow Pages)</div>
      </div>
      <p style={{ color: "#666", fontSize: 13, maxWidth: 720 }}>
        These categories show in the Customer app under Home Services. There is no booking; customers
        view a worker&apos;s contact details and each contact-view charges the worker the fixed fee
        below.
      </p>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Category name (e.g. Gardening)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            type="number"
            min={0}
            step="0.50"
            style={{ maxWidth: 200 }}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
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
              <th>Category</th>
              <th>Fee per contact view</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    defaultValue={c.name}
                    onBlur={(e) =>
                      e.target.value !== c.name && patch(c.id, { name: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="0.50"
                    defaultValue={(c.workerFeePerView / 100).toFixed(2)}
                    onBlur={(e) => {
                      const val = Math.round(Number(e.target.value) * 100);
                      if (val !== c.workerFeePerView)
                        patch(c.id, { workerFeePerView: val });
                    }}
                    style={{ width: 100 }}
                  />{" "}
                  <span style={{ fontSize: 12, color: "#999" }}>
                    {formatMyr(c.workerFeePerView)}
                  </span>
                </td>
                <td>
                  <button
                    className={c.enabled ? "badge" : "badge off"}
                    onClick={() => patch(c.id, { enabled: !c.enabled })}
                  >
                    {c.enabled ? "On" : "Off"}
                  </button>
                </td>
                <td>
                  <button className="btn secondary" onClick={() => remove(c.id)}>
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
