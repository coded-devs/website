"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const iconClasses = "h-4 w-4";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M4 5h7v7H4V5Zm9 0h7v4h-7V5ZM4 14h7v5H4v-5Zm9-3h7v8h-7v-8Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 8c0-2.2-1.8-4-4-4h-1m1-4a3 3 0 0 0 0-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5M10 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M9 7V5h6v2m-10 4h14M5 7h14v12H5V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M4 13h5l2 3h2l2-3h5M5 5h14l2 8v6H3v-6l2-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClasses}>
      <path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/admin/team", label: "Team", icon: <UsersIcon /> },
  { href: "/admin/products", label: "Products", icon: <BoxIcon /> },
  { href: "/admin/blog", label: "Updates", icon: <DocumentIcon /> },
  { href: "/admin/careers", label: "Careers", icon: <BriefcaseIcon /> },
  { href: "/admin/applications", label: "Applications", icon: <InboxIcon /> },
  { href: "/admin/messages", label: "Messages", icon: <MessageIcon /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col p-5">
      <Link href="/admin/dashboard" className="mb-8 inline-flex">
        <Image src="/logos/mark.svg" alt="CodedDevs" width={40} height={40} priority />
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm font-medium text-[#6B7896] hover:bg-[#F4F5F8] hover:text-[#121F38]",
                isActive && "bg-[#D1D6E0] text-[#121F38] hover:bg-[#D1D6E0]",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-auto rounded-md border border-[#C4CAD6] px-3 py-2 text-left font-sans text-sm font-medium text-[#121F38] hover:bg-[#F4F5F8]"
      >
        Sign Out
      </button>
    </aside>
  );
}
