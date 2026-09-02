import Link from "next/link";
import { Github, Mail } from "lucide-react";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-[#0d2635] text-white">
      <div className="container-shell grid grid-cols-2 gap-x-7 gap-y-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-14">
        <div className="col-span-2 md:col-span-1">
          <Logo inverse />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#b8cad4]">An archive of all-sky camera frames and their cloud-segmentation masks, with cloud cover measured from the imagery itself.</p>
        </div>
        <div>
          <p className="eyebrow text-[#94acb9]">Archive</p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/explore">Explore images</Link><Link href="/collections">Collections</Link><Link href="/methods">Methods</Link><Link href="/api-docs">API documentation</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow text-[#94acb9]">Connect</p>
          <div className="mt-4 grid gap-3 text-sm">
            <a href="mailto:data@wascat.org" className="flex items-center gap-2"><Mail size={15} /> data@wascat.org</a>
            <a href="https://github.com" className="flex items-center gap-2"><Github size={15} /> Source repository</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-shell flex flex-col gap-2 py-5 text-xs text-[#94acb9] sm:flex-row sm:justify-between">
          <p>© 2026 WASCAT</p><p>Measured cloud cover · Versioned releases · Checksummed artifacts</p>
        </div>
      </div>
    </footer>
  );
}
