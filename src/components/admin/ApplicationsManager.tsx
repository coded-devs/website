"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";

export type AdminApplication = {
  id: string;
  career_title: string | null;
  full_name: string;
  email: string;
  portfolio_url: string | null;
  github_url: string | null;
  cover_letter: string;
  status: "pending" | "reviewed" | "rejected";
  created_at: string;
};

type ApplicationFilter = "all" | AdminApplication["status"];

type ApplicationsManagerProps = {
  applications: AdminApplication[];
};

const filters: Array<{ label: string; value: ApplicationFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Rejected", value: "rejected" },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function statusVariant(status: AdminApplication["status"]) {
  if (status === "reviewed") {
    return "success";
  }

  if (status === "rejected") {
    return "warning";
  }

  return "default";
}

export default function ApplicationsManager({
  applications,
}: ApplicationsManagerProps) {
  const [filter, setFilter] = useState<ApplicationFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState(applications);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  async function updateStatus(
    id: string,
    status: AdminApplication["status"],
  ) {
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      window.alert("Status update failed.");
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={
              filter === item.value
                ? "rounded-md bg-[#121F38] px-3 py-2 font-sans text-sm font-medium text-white"
                : "rounded-md bg-[#F4F5F8] px-3 py-2 font-sans text-sm font-medium text-[#121F38] hover:bg-[#D1D6E0]"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#F4F5F8] text-[#121F38]">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((application) => (
              <tr
                key={application.id}
                onClick={() =>
                  setOpenId(openId === application.id ? null : application.id)
                }
                className="cursor-pointer border-t border-[#C4CAD6]"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#121F38]">
                    {application.full_name}
                  </p>
                  <p className="text-xs text-[#6B7896]">{application.email}</p>
                  {openId === application.id ? (
                    <div className="mt-4 space-y-3 text-[#2C3A52]">
                      <p>{application.cover_letter}</p>
                      {application.portfolio_url ? (
                        <a
                          href={application.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#121F38] hover:text-[#1A2D4F]"
                        >
                          Portfolio
                        </a>
                      ) : null}
                      {application.github_url ? (
                        <a
                          href={application.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#121F38] hover:text-[#1A2D4F]"
                        >
                          GitHub
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[#2C3A52]">
                  {application.career_title ?? "Unknown role"}
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant(application.status)}>
                      {application.status}
                    </Badge>
                    <select
                      value={application.status}
                      onChange={(event) =>
                        updateStatus(
                          application.id,
                          event.target.value as AdminApplication["status"],
                        )
                      }
                      className="rounded-md border border-[#C4CAD6] bg-white px-2 py-1 text-xs text-[#121F38]"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#2C3A52]">
                  {formatDate(application.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
