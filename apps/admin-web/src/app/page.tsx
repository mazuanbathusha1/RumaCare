import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <div className="header">
        <div className="title">Dashboard</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Link href="/service-types" className="card">
          <h3>Service Types</h3>
          <p>Manage service types across categories, rates, discounts, enable/disable.</p>
        </Link>
        <Link href="/subjects" className="card">
          <h3>Tuition Subjects</h3>
          <p>Manage per-subject tuition rates for the Tuition category.</p>
        </Link>
        <Link href="/home-services" className="card">
          <h3>Home Services</h3>
          <p>Yellow-pages categories and per-view worker fees.</p>
        </Link>
        <Link href="/partners" className="card">
          <h3>Partner Applications</h3>
          <p>Review &amp; approve partner registrations (IC, selfie, SSM, nursing cert).</p>
        </Link>
        <Link href="/settings" className="card">
          <h3>Settings</h3>
          <p>Revenue split, weekend &amp; PH multipliers, dispatch defaults.</p>
        </Link>
      </div>
    </div>
  );
}
