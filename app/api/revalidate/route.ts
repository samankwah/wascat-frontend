import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Cache invalidation, called by the backend after a dashboard mutation.
 *
 * Public pages read the API through a short cache. Without this, a curator who
 * corrects a licence or publishes a release would watch the old value sit on
 * the site until the window expired. With it, the backend names the tags its
 * change touched and the affected pages rebuild on the next request.
 *
 * The shared secret is compared in constant time and the endpoint is
 * deliberately unguessable in effect rather than merely obscure: knowing it
 * only lets someone force a rebuild, but that is still a lever worth locking.
 */
const SECRET = process.env.WASCAT_REVALIDATE_SECRET ?? "";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "Revalidation is not configured." } },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-revalidate-secret") ?? "";
  if (!safeEqual(provided, SECRET)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid revalidation secret." } },
      { status: 401 },
    );
  }

  let tags: unknown;
  try {
    ({ tags } = (await request.json()) as { tags?: unknown });
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Expected JSON with a `tags` array." } },
      { status: 400 },
    );
  }

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "`tags` must be an array of strings." } },
      { status: 400 },
    );
  }

  // `updateTag` would expire immediately, but Next 16 restricts it to Server
  // Actions. From a Route Handler the profile form is the supported one:
  // "max" marks the tag stale so the next visitor is served the cached page
  // while the fresh one is fetched behind them.
  for (const tag of tags as string[]) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: tags, at: new Date().toISOString() });
}
