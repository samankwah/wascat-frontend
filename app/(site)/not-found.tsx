import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <section className="container-shell flex min-h-[62vh] flex-col items-center justify-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-pale text-sky"><Search /></span>
      <p className="eyebrow mt-6 text-sky">404 · Observation not found</p>
      <h1 className="display mt-3 text-5xl">This patch of sky is empty.</h1>
      <p className="mt-5 max-w-md leading-7 text-muted">The record may have moved, or the identifier may not belong to a published release.</p>
      <Link href="/explore" className="button-primary mt-8"><ArrowLeft size={16} /> Return to the archive</Link>
    </section>
  );
}
