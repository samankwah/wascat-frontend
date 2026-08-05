import { envelope } from "@/lib/api";
import { collections } from "@/lib/catalog";

export async function GET(request: Request) {
  return envelope(collections.map(({ releases, ...collection }) => ({ ...collection, currentRelease: releases.find((release) => release.current) })), request, { count: collections.length });
}
