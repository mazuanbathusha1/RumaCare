import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "RumaCare Admin Portal",
  description: "Manage RumaCare service types, rates, partners, bookings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside
            className="sidebar"
            style={{
              width: 240,
              background: "white",
              borderRight: "1px solid #e4e7ed",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 24,
                color: "#1f6feb",
              }}
            >
              RumaCare
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Link href="/">Dashboard</Link>
              <Link href="/service-types">Service Types</Link>
              <Link href="/subjects">Tuition Subjects</Link>
              <Link href="/home-services">Home Services</Link>
              <Link href="/partners">Partner Applications</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/login">Login</Link>
            </nav>
          </aside>
          <main style={{ flex: 1, padding: 32 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
