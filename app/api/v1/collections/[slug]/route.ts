import { envelope } from "@/lib/api";
import { collectionBySlug } from "@/lib/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const collection = collectionBySlug((await params).slug);
  if (!collection) return Response.json({ error: { code: "not_found", message: "Collection not found" } }, { status: 404 });
  return envelope(collection, request);
}
