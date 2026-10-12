export function DashboardPage() {
  return (
    <div className="page-card">
      <p className="eyebrow">Overview</p>
      <h1>Satva Dashboard</h1>
      <p>React foundation is ready. Feature modules can now plug into this shell.</p>
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-card">
      <p className="eyebrow">Module</p>
      <h1>{title}</h1>
      <p>This module will be implemented with TanStack Query, forms, and tables.</p>
    </div>
  );
}
