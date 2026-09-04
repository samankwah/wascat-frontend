/**
 * Reading the archive as an administrator.
 *
 * Separate from lib/api-client.ts because the two answer different questions.
 * The public client fetches what anyone may see and caches it; this forwards
 * the caller's session and never caches, because a dashboard that showed a
 * curator a five-minute-old view of their own edit would be worse than useless.
 */
import "server-only";

import { cookies } from "next/headers";

import type { Collection, ImageRecord, Release } from "@/lib/types";

const API_ORIGIN = process.env.WASCAT_API_ORIGIN ?? "http://127.0.0.1:8000";

export type AdminRelease = Release & {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "RETIRED";
  retiredAt: string | null;
};

/**
 * A collection as the dashboard sees it.
 *
 * Wider than the public shape: the admin endpoint also returns the fields the
 * public API has no reason to publish - the internal identifier, the draft
 * releases, and the two links a curator maintains but the site only renders
 * once they are set.
 */
export type AdminCollection = Omit<Collection, "releases"> & {
  id: string;
  releases: AdminRelease[];
  methodsUrl: string | null;
  publicationUrl: string | null;
  position: number;
};

export type AdminImage = ImageRecord & {
  editable: boolean;
  retiredAt: string | null;
  conditionTags: string[];
  release: AdminRelease | null;
};

export type VocabularyTerm = {
  id: string;
  kind: string;
  slug: string;
  label: string;
  description: string | null;
  position: number;
  /** True when the public API validates against this term, so it cannot go. */
  system: boolean;
  retiredAt: string | null;
  mergedIntoId: string | null;
  /** Values that still resolve to this term after a rename or a merge. */
  aliases: string[];
  records: number;
};

export type Vocabulary = {
  kind: string;
  label: string;
  /** True when adding a term would widen what the public API accepts. */
  frozen: boolean;
  terms: VocabularyTerm[];
};

export type AuditEntry = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  actor: { id: string | null; email: string | null };
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed: string[];
  summary: string | null;
  createdAt: string;
};

async function adminFetch<T>(path: string): Promise<{ data: T; meta: Record<string, unknown> } | null> {
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
    headers: { cookie: cookieHeader, Accept: "application/json" },
    // The dashboard must show the archive as it is now, including the edit
    // made a second ago.
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status line.
    }
    throw new Error(`Admin API ${path}: ${message}`);
  }

  return (await response.json()) as { data: T; meta: Record<string, unknown> };
}

export type ImagePage = {
  records: ImageRecord[];
  total: number;
  limit: number;
  nextCursor: string | null;
};

export async function listImages(
  params: Record<string, string | number | undefined> = {},
): Promise<ImagePage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  const body = await adminFetch<ImageRecord[]>(`/admin/images${suffix}`);
  if (!body) return { records: [], total: 0, limit: 0, nextCursor: null };
  return {
    records: body.data,
    total: Number(body.meta.total ?? body.data.length),
    limit: Number(body.meta.limit ?? body.data.length),
    nextCursor: (body.meta.nextCursor as string | null) ?? null,
  };
}

export async function getImage(id: string): Promise<AdminImage | null> {
  const body = await adminFetch<AdminImage>(`/admin/images/${encodeURIComponent(id)}`);
  return body?.data ?? null;
}

export async function listCollections(): Promise<AdminCollection[]> {
  const body = await adminFetch<AdminCollection[]>("/admin/collections");
  return body?.data ?? [];
}

export async function listAudit(
  params: Record<string, string | number | undefined> = {},
): Promise<AuditEntry[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  const body = await adminFetch<AuditEntry[]>(`/admin/audit${suffix}`);
  return body?.data ?? [];
}

export async function listVocabularies(): Promise<Vocabulary[]> {
  const body = await adminFetch<Vocabulary[]>("/admin/vocabulary");
  return body?.data ?? [];
}

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type ManagedRole = {
  slug: string;
  description: string;
  permissions: string[];
};

/**
 * Accounts, and the roles that can be assigned to them.
 *
 * The roles arrive alongside in `meta` rather than from a second request,
 * because a picker that cannot describe what it is offering is a picker that
 * gets used wrongly.
 */
export async function listUsers(): Promise<{ users: ManagedUser[]; roles: ManagedRole[] }> {
  const body = await adminFetch<ManagedUser[]>("/admin/users");
  if (!body) return { users: [], roles: [] };
  return {
    users: body.data,
    roles: (body.meta.roles as ManagedRole[] | undefined) ?? [],
  };
}
