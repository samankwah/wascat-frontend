"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  Images,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/admin/api";
import type { AdminUser } from "@/lib/admin/session";
import { cx } from "@/components/admin/ui";

type Item = {
  href: string;
  label: string;
  icon: typeof Images;
  /** Hidden entirely when the user cannot use it. */
  permission?: string;
};

const ITEMS: Item[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/images", label: "Image records", icon: Images, permission: "catalog:read" },
  { href: "/admin/collections", label: "Collections", icon: Layers3, permission: "catalog:read" },
  { href: "/admin/vocabulary", label: "Vocabulary", icon: Tags, permission: "vocab:read" },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList, permission: "audit:read" },
];

export function AdminNav({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // A link the user cannot follow is not shown at all. Rendering it disabled
  // would only advertise a door that is locked.
  const items = ITEMS.filter(
    (item) => !item.permission || user.permissions.includes(item.permission),
  );

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function signOut() {
    try {
      await adminApi.logout();
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="eyebrow text-sky">Dashboard</p>
          <p className="truncate text-sm font-bold">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="inline-flex size-10 items-center justify-center border border-line"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      <nav
        id="admin-nav"
        aria-label="Dashboard"
        className={cx(
          "shrink-0 border-line bg-white lg:block lg:w-[16.5rem] lg:border-r",
          open ? "block border-b" : "hidden",
        )}
      >
        <div className="hidden px-5 py-6 lg:block">
          <Link href="/" className="eyebrow text-sky hover:underline">
            WASCAT
          </Link>
          <p className="display mt-1 text-xl leading-tight">Archive dashboard</p>
        </div>

        <ul className="px-3 py-3 lg:py-0">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "border-sky bg-sky-pale font-bold text-sky-dark"
                      : "border-transparent text-muted hover:bg-paper hover:text-ink",
                  )}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-line px-5 py-5">
          <p className="truncate text-sm font-bold">{user.fullName ?? user.email}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
          <p className="mt-2 flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className="border border-line bg-paper px-1.5 py-0.5 text-[.6rem] font-bold uppercase tracking-[.09em] text-muted"
              >
                {role}
              </span>
            ))}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-danger"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
