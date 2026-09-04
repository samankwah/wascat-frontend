"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  Images,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  Users,
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

/**
 * Grouped, because a flat list of six stops being scannable.
 *
 * The grouping is by what the work *is* - the archive's contents, then the
 * controls over who and what changed it - rather than by how often each is
 * used, so a new entry has an obvious home.
 */
const GROUPS: { heading: string | null; items: Item[] }[] = [
  {
    heading: null,
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    heading: "Catalogue",
    items: [
      { href: "/admin/images", label: "Image records", icon: Images, permission: "catalog:read" },
      {
        href: "/admin/collections",
        label: "Collections",
        icon: Layers3,
        permission: "catalog:read",
      },
      { href: "/admin/vocabulary", label: "Vocabulary", icon: Tags, permission: "vocab:read" },
    ],
  },
  {
    heading: "Governance",
    items: [
      { href: "/admin/audit", label: "Audit log", icon: ClipboardList, permission: "audit:read" },
      { href: "/admin/users", label: "People", icon: Users, permission: "user:manage" },
    ],
  },
];

export function AdminNav({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The drawer is a real modal on small screens, held to the same bar as the
  // public site's: scroll locked behind it, Escape closes, Tab cycles inside
  // it, and focus returns to the control that opened it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // A link the user cannot follow is not shown at all. Rendering it disabled
  // would only advertise a door that is locked.
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || user.permissions.includes(item.permission),
    ),
  })).filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function signOut() {
    try {
      await adminApi.logout();
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const body = (
    <>
      <div className="px-5 py-6">
        <Link href="/" className="eyebrow text-sky hover:underline">
          WASCAT
        </Link>
        <p className="display mt-1 text-xl leading-tight">Archive dashboard</p>
      </div>

      {/* The only part that scrolls. With six entries it never needs to, but a
          short viewport must not push the account block off the bottom. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.heading ?? "root"} className="mb-1">
            {group.heading ? (
              <p className="px-3 pb-1 pt-4 text-[.62rem] font-bold uppercase tracking-[.12em] text-muted-dim">
                {group.heading}
              </p>
            ) : null}
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-sky-pale font-bold text-sky-dark"
                          : "text-muted hover:bg-paper hover:text-ink",
                      )}
                    >
                      {/* The marker is drawn rather than borrowed from a
                          border, so an inactive row keeps the same padding and
                          the list does not shift as you move through it. */}
                      <span
                        aria-hidden="true"
                        className={cx(
                          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm transition-colors",
                          active ? "bg-sky" : "bg-transparent",
                        )}
                      />
                      <Icon
                        size={17}
                        aria-hidden="true"
                        className={active ? "text-sky" : "text-muted-dim"}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line px-5 py-4">
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
          className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-muted transition-colors hover:text-danger"
        >
          <LogOut size={14} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile bar. Sticky so the way back to navigation is always reachable,
          however far down a table of 17,000 records you are. */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="eyebrow text-sky">Dashboard</p>
          <p className="truncate text-sm font-bold">{user.email}</p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-nav-drawer"
          aria-label="Open menu"
          className="inline-flex size-10 items-center justify-center border border-line transition-colors hover:border-sky hover:bg-sky-pale hover:text-sky"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Desktop: pinned for the height of the viewport, so the navigation
          stays put while the page scrolls beside it. `h-screen` with the
          footer outside the scrolling region is what keeps the account block
          on screen rather than at the bottom of a long page. */}
      <nav
        aria-label="Dashboard"
        className="sticky top-0 hidden h-screen w-[16.5rem] shrink-0 flex-col border-r border-line bg-white lg:flex"
      >
        {body}
      </nav>

      {/* Mobile drawer */}
      <div
        className={cx("fixed inset-0 z-[90] lg:hidden", !open && "pointer-events-none")}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
          className={cx(
            "absolute inset-0 bg-ink-abyss/60 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          ref={drawerRef}
          id="admin-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard navigation"
          className={cx(
            "absolute bottom-0 left-0 top-0 flex w-[min(86vw,17.5rem)] flex-col bg-white shadow-2xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex justify-end px-3 pt-3">
            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close menu"
              className="inline-flex size-10 items-center justify-center border border-line transition-colors hover:border-sky hover:bg-sky-pale hover:text-sky"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {body}
        </div>
      </div>
    </>
  );
}
