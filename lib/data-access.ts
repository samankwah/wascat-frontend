/**
 * Reads behind an approved data request's private link.
 *
 * Separate from `api-client` because nothing here may be cached: the page
 * belongs to one requester, its links are minted fresh on every visit, and it
 * must stop working the moment the access expires.
 */
import "server-only";

const API_ORIGIN = process.env.WASCAT_API_ORIGIN ?? "http://127.0.0.1:8000";

export type AccessCollection = {
  slug: string;
  title: string;
  locationName?: string | null;
  release?: string | null;
  records: number;
  license?: string | null;
  citation?: string | null;
  doi?: string | null;
};

export type DataAccess = {
  reference: string;
  name: string;
  approvedAt?: string | null;
  expiresAt?: string | null;
  note?: string | null;
  collections: AccessCollection[];
};

export type AccessResult =
  | { state: "ok"; access: DataAccess; daysLeft?: number }
  | { state: "expired" }
  | { state: "invalid" };

export async function getDataAccess(token: string): Promise<AccessResult> {
  const response = await fetch(`${API_ORIGIN}/api/v1/data-requests/access/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (response.status === 410) return { state: "expired" };
  if (!response.ok) return { state: "invalid" };
  const body = (await response.json()) as { data: DataAccess };
  const { expiresAt } = body.data;
  // Whole days, rounded up: "1 day left" until the last moment, never "0".
  const daysLeft = expiresAt ? Math.max(1, Math.ceil((Date.parse(expiresAt) - Date.now()) / 86_400_000)) : undefined;
  return { state: "ok", access: body.data, daysLeft };
}
