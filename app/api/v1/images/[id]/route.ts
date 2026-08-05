import { envelope } from "@/lib/api";
import { imageById } from "@/lib/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const record = imageById((await params).id);
  if (!record) return Response.json({ error: { code: "not_found", message: "Image record not found" } }, { status: 404 });
  return envelope(record, request);
}
