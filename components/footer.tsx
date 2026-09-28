import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-ink-deep text-white">
      <div className="container-shell grid grid-cols-2 gap-x-7 gap-y-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-14">
        <div className="col-span-2 md:col-span-1">
          <Logo inverse />
          <p className="mt-5 max-w-sm text-sm leading-6 text-field">West African Sky Cloud Atlas &amp; Dataset. An AI-powered atmospheric research platform.</p>
        </div>
        <div>
          <p className="eyebrow text-line-strong">Archive</p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/explore">Explore images</Link><Link href="/collections">Collections</Link><Link href="/methods">Methods</Link><Link href="/api-docs">API documentation</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow text-line-strong">Connect</p>
          <div className="mt-4 grid gap-3 text-sm">
            <a href="mailto:data@wascat.org" className="flex items-center gap-2"><Mail size={15} /> data@wascat.org</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-shell py-5 text-center font-mono text-[.75rem] tracking-[.06em] text-line-strong">
          <p>© 2026 WASCAT · West African Sky Cloud Atlas · Built for Atmospheric Research</p>
        </div>
      </div>
    </footer>
  );
}
