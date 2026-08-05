import { NextResponse } from "next/server";
import { images } from "@/lib/catalog";
import { decodeCursor, encodeCursor, filterImages, imageQuerySchema } from "@/lib/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = imageQuerySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: { code: "invalid_query", message: "One or more query parameters are invalid.", details: parsed.error.flatten().fieldErrors } }, { status: 400 });
  const result = filterImages(images, parsed.data);
  const offset = decodeCursor(parsed.data.cursor);
  const page = result.slice(offset, offset + parsed.data.limit);
  const nextCursor = offset + parsed.data.limit < result.length ? encodeCursor(offset + parsed.data.limit) : null;
  const nextUrl = nextCursor ? new URL(request.url) : null;
  if (nextUrl) nextUrl.searchParams.set("cursor", nextCursor!);
  return NextResponse.json({
    data: page,
    meta: { apiVersion: "1.0", generatedAt: new Date().toISOString(), count: page.length, total: result.length, limit: parsed.data.limit, nextCursor },
    links: { self: request.url, next: nextUrl?.toString() ?? null },
  }, { headers: { "X-RateLimit-Limit": "120", "X-RateLimit-Remaining": "119" } });
}
