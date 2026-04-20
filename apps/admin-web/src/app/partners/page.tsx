"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CategoryCode, PartnerApplicationStatus } from "@rumacare/shared";

interface PartnerApp {
  id: string;
  status: PartnerApplicationStatus;
  categories: CategoryCode[];
  fullName: string;
  icNumber: string;
  addressLine: string;
  bankName: string;
  bankAccountNumber: string;
  ssmNumber: string | null;
  nursingCertUrl: string | null;
  icCopyUrl: string;
  selfieUrl: string;
  submittedAt: string | null;
  user?: { email: string; name: string; phone: string | null };
}

export default function PartnersPage() {
  const [items, setItems] = useState<PartnerApp[]>([]);
  const [status, setStatus] = useState<PartnerApplicationStatus | "ALL">("SUBMITTED");

  async function load() {
    const q = status === "ALL" ? "" : `?status=${status}`;
    setItems(await api<PartnerApp[]>(`/partners${q}`));
  }

  useEffect(() => {
    load().catch(console.error);
     
  }, [status]);

  async function review(id: string, s: "APPROVED" | "REJECTED", reason?: string) {
    await api(`/partners/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status: s, reason }),
    });
    await load();
  }

  return (
    <div>
      <div className="header">
        <div className="title">Partner Applications</div>
        <select
          className="input"
          style={{ maxWidth: 220 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as PartnerApplicationStatus | "ALL")}
        >
          <option value="ALL">All</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        {items.map((a) => (
          <div key={a.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{a.fullName}</div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  IC: {a.icNumber} · {a.user?.email} · {a.user?.phone ?? "—"}
                </div>
                <div style={{ fontSize: 13, color: "#666" }}>{a.addressLine}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Bank: {a.bankName} · Acct: {a.bankAccountNumber}
                </div>
                {a.ssmNumber ? <div style={{ fontSize: 13 }}>SSM: {a.ssmNumber}</div> : null}
                <div style={{ marginTop: 6 }}>
                  {a.categories.map((c) => (
                    <span key={c} className="badge" style={{ marginRight: 4 }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="badge">{a.status}</span>
                {a.status === "SUBMITTED" ? (
                  <>
                    <button className="btn" onClick={() => review(a.id, "APPROVED")}>
                      Approve
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        const reason = window.prompt("Rejection reason?") ?? undefined;
                        review(a.id, "REJECTED", reason);
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <Doc label="IC copy" url={a.icCopyUrl} />
              <Doc label="Selfie" url={a.selfieUrl} />
              {a.nursingCertUrl ? <Doc label="Nursing Cert" url={a.nursingCertUrl} /> : null}
            </div>
          </div>
        ))}
        {items.length === 0 ? <div style={{ color: "#999" }}>No applications.</div> : null}
      </div>
    </div>
  );
}

function Doc({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="badge">
      {label} ↗
    </a>
  );
}
