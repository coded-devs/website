import Link from 'next/link';
import { PageHeader, SurfaceCard } from '../../src/components/admin-ui';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Manage Insights articles and media."
      />

      <div className="dashboard-grid">
        <SurfaceCard className="dashboard-status-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Insights articles</h2>
              <p>Create, preview, and publish articles for the website.</p>
            </div>
            <span className="dashboard-status-mark" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 18.5z" />
                <path d="M8 8h8M8 12h8M8 16h4" />
              </svg>
            </span>
          </div>
          <p className="dashboard-status-copy">
            Select a spotlight article and keep published content up to date.
          </p>
          <Link className="dashboard-link" href="/insights">
            Manage articles
            <span aria-hidden="true">→</span>
          </Link>
        </SurfaceCard>
      </div>
    </div>
  );
}
