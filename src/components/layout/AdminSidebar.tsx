"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import {
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboardIcon className="h-4 w-4" /> },
  { href: "/admin/team", label: "Team", icon: <UsersIcon className="h-4 w-4" /> },
  { href: "/admin/products", label: "Products", icon: <PackageIcon className="h-4 w-4" /> },
  { href: "/admin/blog", label: "Blog", icon: <FileTextIcon className="h-4 w-4" /> },
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
        className="mt-auto inline-flex items-center gap-2 rounded-md border border-[#C4CAD6] px-3 py-2 text-left font-sans text-sm font-medium text-[#121F38] hover:bg-[#F4F5F8]"
      >
        <LogOutIcon className="h-4 w-4" aria-hidden="true" />
        Sign Out
      </button>
    </aside>
  );
}
