'use client';

import Link from 'next/link';
import { PageHeader, SurfaceCard } from '../../src/components/admin-ui';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Manage Insights articles, media, and contact inquiries."
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

        <SurfaceCard className="dashboard-inquiry-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Contact inquiries</h2>
              <p>Review submissions and update follow-up status.</p>
            </div>
            <span
              className="dashboard-status-mark is-accent"
              aria-hidden="true"
            >
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
                <path d="M4 6.5h16v11H4z" />
                <path d="m4.5 7 7.5 6 7.5-6" />
              </svg>
            </span>
          </div>
          <Link className="dashboard-link" href="/inquiries">
            Open inquiries
            <span aria-hidden="true">→</span>
          </Link>
        </SurfaceCard>
      </div>

      <section className="dashboard-recent" aria-labelledby="recent-inquiries">
        <div className="dashboard-section-heading">
          <h2 id="recent-inquiries">Recent inquiries</h2>
          <Link href="/inquiries">View all</Link>
        </div>
        <SurfaceCard className="dashboard-empty-state">
          <span className="dashboard-empty-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6.5h16v11H4z" />
              <path d="m4.5 7 7.5 6 7.5-6" />
            </svg>
          </span>
          <h3>Inquiry status not shown here</h3>
          <p>
            Open the inquiries page to review submissions from the public
            website contact form.
          </p>
        </SurfaceCard>
      </section>
    </div>
  );
}
