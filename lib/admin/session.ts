/**
 * Reading the signed-in user, on the server.
 *
 * This is the layer that actually decides. `proxy.ts` redirects optimistically
 * from a cookie's presence; this asks the API who the caller is, and every
 * backend endpoint checks again. Three layers sounds like a lot until you
 * notice each answers a different question: should this render, may this
 * person see this page, and may this person do this thing.
 */
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const API_ORIGIN = process.env.WASCAT_API_ORIGIN ?? "http://127.0.0.1:8000";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  permissions: string[];
  lastLoginAt: string | null;
};

/**
 * Who is signed in, or null.
 *
 * Wrapped in React's `cache` so a page that checks a permission in three
 * places asks once per render rather than three times.
 */
export const getSession = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const header = jar
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!header.includes("wascat_at=")) return null;

  const response = await fetch(`${API_ORIGIN}/api/v1/admin/auth/me`, {
    headers: { cookie: header, Accept: "application/json" },
    // Never cached: a session that ended a minute ago must not be served from
    // a shared cache to whoever asks next.
    cache: "no-store",
  });

  if (!response.ok) return null;
  const body = (await response.json()) as { data: AdminUser };
  return body.data;
});

/** The signed-in user, or a redirect to sign in. */
export async function requireSession(returnTo?: string): Promise<AdminUser> {
  const user = await getSession();
  if (!user) {
    const target = returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : "/admin/login";
    redirect(target);
  }
  return user;
}

/**
 * The signed-in user, or a redirect, having checked one permission.
 *
 * Refusing here keeps a curator from being shown a publish button that the API
 * would reject - the UI and the rule agree rather than disagreeing politely.
 */
export async function requirePermission(
  permission: string,
  returnTo?: string,
): Promise<AdminUser> {
  const user = await requireSession(returnTo);
  if (!user.permissions.includes(permission)) {
    redirect("/admin?denied=" + encodeURIComponent(permission));
  }
  return user;
}

export function can(user: AdminUser | null, permission: string): boolean {
  return Boolean(user?.permissions.includes(permission));
}

export const PERMISSIONS = {
  catalogRead: "catalog:read",
  catalogWrite: "catalog:write",
  releasePublish: "release:publish",
  vocabRead: "vocab:read",
  vocabWrite: "vocab:write",
  ingestRun: "ingest:run",
  userManage: "user:manage",
  auditRead: "audit:read",
} as const;
