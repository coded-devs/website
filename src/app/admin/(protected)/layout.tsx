import AdminSidebar from "@/components/layout/AdminSidebar";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="fixed inset-y-0 left-0 w-[240px] border-r border-[#C4CAD6] bg-white">
        <AdminSidebar />
      </div>
      <main className="ml-[240px] min-h-screen bg-[#F9FAFB] p-8">
        {children}
      </main>
    </div>
  );
}


