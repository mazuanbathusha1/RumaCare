"use client";

import { useEffect, useMemo, useState } from "react";
import { api, formatMyr } from "@/lib/api";
import type { CategoryCode, RateModel } from "@rumacare/shared";

interface ServiceType {
  id: string;
  code: string;
  name: string;
  categoryCode: CategoryCode;
  rateModel: RateModel;
  hourlyRate: number | null;
  rateAmSlot: number | null;
  ratePmSlot: number | null;
  rateEveningSlot: number | null;
  rateFullDay: number | null;
  workerFeePerView: number | null;
  discountEnabled: boolean;
  discountPercent: number;
  enabled: boolean;
}

const CATEGORY_LABEL: Record<CategoryCode, string> = {
  PERSONAL_NURSING: "Home Personal & Nursing Care",
  CLEANING: "Cleaning",
  NANNY: "Nanny",
  TUITION: "Tuition",
  HOME_SERVICES: "Home Services",
  PARTNER: "Partner",
};

export default function ServiceTypesPage() {
  const [items, setItems] = useState<ServiceType[]>([]);
  const [category, setCategory] = useState<CategoryCode | "ALL">("ALL");

  async function load() {
    const q = category === "ALL" ? "" : `?category=${category}`;
    const data = await api<ServiceType[]>(`/service-types${q}`);
    setItems(data);
  }

  useEffect(() => {
    load().catch(console.error);
     
  }, [category]);

  const grouped = useMemo(() => {
    const out: Record<string, ServiceType[]> = {};
    for (const it of items) {
      out[it.categoryCode] = out[it.categoryCode] ?? [];
      out[it.categoryCode].push(it);
    }
    return out;
  }, [items]);

  async function patch(id: string, body: Partial<ServiceType>) {
    await api(`/service-types/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    await load();
  }

  async function toggle(id: string, enabled: boolean) {
    await api(`/service-types/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    await load();
  }

  return (
    <div>
      <div className="header">
        <div className="title">Service Types</div>
        <select
          className="input"
          style={{ maxWidth: 280 }}
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryCode | "ALL")}
        >
          <option value="ALL">All categories</option>
          {(Object.keys(CATEGORY_LABEL) as CategoryCode[])
            .filter((c) => c !== "HOME_SERVICES" && c !== "PARTNER")
            .map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
        </select>
      </div>

      {Object.entries(grouped).map(([cat, rows]) => (
        <div key={cat} className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>{CATEGORY_LABEL[cat as CategoryCode]}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rate model</th>
                <th>Hourly</th>
                <th>AM</th>
                <th>PM</th>
                <th>Evening</th>
                <th>Full day</th>
                <th>Discount</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => (
                <tr key={st.id}>
                  <td>{st.name}</td>
                  <td>
                    <code style={{ fontSize: 12 }}>{st.rateModel}</code>
                  </td>
                  <td>
                    <RateInput
                      value={st.hourlyRate}
                      show={st.rateModel === "HOURLY" || st.rateModel === "PACKAGE"}
                      onSave={(v) => patch(st.id, { hourlyRate: v })}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={st.rateAmSlot}
                      show={st.rateModel === "HALF_OR_FULL_DAY"}
                      onSave={(v) => patch(st.id, { rateAmSlot: v })}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={st.ratePmSlot}
                      show={st.rateModel === "HALF_OR_FULL_DAY"}
                      onSave={(v) => patch(st.id, { ratePmSlot: v })}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={st.rateEveningSlot}
                      show={st.rateModel === "HALF_OR_FULL_DAY"}
                      onSave={(v) => patch(st.id, { rateEveningSlot: v })}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={st.rateFullDay}
                      show={st.rateModel === "HALF_OR_FULL_DAY"}
                      onSave={(v) => patch(st.id, { rateFullDay: v })}
                    />
                  </td>
                  <td>
                    <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={st.discountEnabled}
                        onChange={(e) =>
                          patch(st.id, { discountEnabled: e.target.checked })
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        style={{ width: 60 }}
                        value={st.discountPercent}
                        onChange={(e) =>
                          patch(st.id, { discountPercent: Number(e.target.value) })
                        }
                      />
                      %
                    </label>
                  </td>
                  <td>
                    <button
                      className={st.enabled ? "badge" : "badge off"}
                      onClick={() => toggle(st.id, !st.enabled)}
                    >
                      {st.enabled ? "On" : "Off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function RateInput({
  value,
  show,
  onSave,
}: {
  value: number | null;
  show: boolean;
  onSave: (v: number) => void;
}) {
  const [edit, setEdit] = useState(value != null ? (value / 100).toFixed(2) : "");
  if (!show) return <span style={{ color: "#bbb" }}>—</span>;
  return (
    <input
      style={{ width: 80 }}
      value={edit}
      onChange={(e) => setEdit(e.target.value)}
      onBlur={() => {
        const sen = Math.round(Number(edit) * 100);
        if (!Number.isNaN(sen) && sen !== value) onSave(sen);
      }}
      title={`Current: ${formatMyr(value)}`}
    />
  );
}
