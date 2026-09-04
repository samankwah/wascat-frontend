"use client";

/**
 * Talking to the admin API from the browser.
 *
 * Requests go to this site's own origin and are rewritten to the API by
 * next.config.ts, so the session cookies ride along automatically and there is
 * no CORS preflight to arrange. The cost of that convenience is CSRF: the
 * browser will attach those cookies to a request another site provokes too.
 * Hence the double-submit token - read from a cookie that JavaScript can see,
 * echoed in a header that a cross-site page cannot produce.
 */

const CSRF_COOKIE = "wascat_csrf";
const CSRF_HEADER = "X-CSRF-Token";

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AdminApiError";
  }

  /** Field-level messages, for rendering next to the input that caused them. */
  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

function csrfToken(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, { method = "GET", body, signal }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers[CSRF_HEADER] = csrfToken();

  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    // Same-origin, so the cookies are attached without asking.
    credentials: "same-origin",
    signal,
  });

  if (response.status === 401) {
    // The session ended while the page was open. A full navigation rather than
    // a client route change, so the proxy sees the missing cookie and the
    // dashboard does not try to re-render itself without one.
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new AdminApiError(401, "unauthorized", "Your session has ended.");
  }

  if (!response.ok) {
    let code = "error";
    let message = `${response.status} ${response.statusText}`;
    let details: Record<string, string[]> | undefined;
    try {
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string; details?: Record<string, string[]> };
      };
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
      details = payload.error?.details;
    } catch {
      // Keep the status line.
    }
    throw new AdminApiError(response.status, code, message, details);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export const adminApi = {
  // -- session ----------------------------------------------------------
  login: (email: string, password: string) =>
    request<{ email: string; roles: string[]; permissions: string[]; csrfToken: string }>(
      "/admin/auth/login",
      { method: "POST", body: { email, password } },
    ),
  logout: () => request<{ signedOut: boolean }>("/admin/auth/logout", { method: "POST" }),

  // -- records ----------------------------------------------------------
  updateImage: (id: string, changes: Record<string, unknown>) =>
    request<unknown>(`/admin/images/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    }),
  bulkUpdateImages: (
    ids: string[],
    changes: Record<string, unknown>,
    tagMode: "add" | "replace" | "remove" = "add",
  ) =>
    request<{ updated: string[]; skipped: string[] }>("/admin/images/bulk", {
      method: "POST",
      body: { ids, changes, tagMode },
    }),
  retireImage: (id: string) =>
    request<{ id: string; retired: boolean }>(
      `/admin/images/${encodeURIComponent(id)}/retire`,
      { method: "POST" },
    ),
  restoreImage: (id: string) =>
    request<{ id: string; retired: boolean }>(
      `/admin/images/${encodeURIComponent(id)}/restore`,
      { method: "POST" },
    ),

  // -- collections and releases -----------------------------------------
  updateCollection: (slug: string, changes: Record<string, unknown>) =>
    request<unknown>(`/admin/collections/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: changes,
    }),
  createRelease: (slug: string, version: string, notes?: string) =>
    request<{ id: string; version: string; status: string }>(
      `/admin/collections/${encodeURIComponent(slug)}/releases`,
      { method: "POST", body: { version, notes } },
    ),
  transitionRelease: (id: string, status: "PUBLISHED" | "RETIRED", current = true) =>
    request<{ id: string; status: string; current: boolean }>(
      `/admin/releases/${id}/status`,
      { method: "POST", body: { status, current } },
    ),
  deleteRelease: (id: string) =>
    request<{ deleted: string }>(`/admin/releases/${id}`, { method: "DELETE" }),

  // -- vocabulary --------------------------------------------------------
  createVocabularyTerm: (kind: string, label: string) =>
    request<unknown>(`/admin/vocabulary/${encodeURIComponent(kind)}`, {
      method: "POST",
      body: { label },
    }),
  renameVocabularyTerm: (termId: string, label: string) =>
    request<unknown>(`/admin/vocabulary/terms/${termId}`, {
      method: "PATCH",
      body: { label },
    }),
  /** Moves every record onto `intoId`. Nothing is deleted. */
  mergeVocabularyTerm: (termId: string, intoId: string) =>
    request<{ recordsMoved: number }>(`/admin/vocabulary/terms/${termId}/merge`, {
      method: "POST",
      body: { intoId },
    }),
  retireVocabularyTerm: (termId: string) =>
    request<unknown>(`/admin/vocabulary/terms/${termId}/retire`, { method: "POST" }),
  restoreVocabularyTerm: (termId: string) =>
    request<unknown>(`/admin/vocabulary/terms/${termId}/restore`, { method: "POST" }),
  reorderVocabulary: (kind: string, ids: string[]) =>
    request<unknown>(`/admin/vocabulary/${encodeURIComponent(kind)}/order`, {
      method: "POST",
      body: { ids },
    }),

  // -- people -----------------------------------------------------------
  // Create and reset return a `password` the server generated. It is the only
  // time that value exists outside a hash, so the caller has to show it before
  // it is gone; nothing here stores it.
  createUser: (email: string, role: string, fullName?: string) =>
    request<ManagedUserWithSecret>("/admin/users", {
      method: "POST",
      body: { email, role, ...(fullName ? { fullName } : {}) },
    }),
  updateUser: (id: string, changes: { fullName?: string; role?: string; isActive?: boolean }) =>
    request<unknown>(`/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    }),
  resetUserPassword: (id: string) =>
    request<ManagedUserWithSecret>(`/admin/users/${encodeURIComponent(id)}/password`, {
      method: "POST",
    }),
};

/** An account, plus the one-time password that will never be readable again. */
export type ManagedUserWithSecret = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  isActive: boolean;
  password: string;
};
