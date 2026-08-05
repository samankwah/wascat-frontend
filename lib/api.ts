import { NextResponse } from "next/server";

export function envelope<T>(data: T, request: Request, extraMeta: Record<string, unknown> = {}, extraLinks: Record<string, string | null> = {}) {
  return NextResponse.json(
    {
      data,
      meta: { apiVersion: "1.0", generatedAt: new Date().toISOString(), ...extraMeta },
      links: { self: request.url, ...extraLinks },
    },
    { headers: { "X-RateLimit-Limit": "120", "X-RateLimit-Remaining": "119" } },
  );
}
