"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CircleHelp, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const links = [
  ["Explore", "/explore"],
  ["Collections", "/collections"],
  ["Methods", "/methods"],
  ["API", "/api-docs"],
  ["About", "/about"],
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeDrawer = () => setOpen(false);

  return (
    <header className="relative z-50 border-b hairline bg-white">
      <div className="container-shell flex h-[76px] items-center justify-between">
        <Logo />
        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link text-[.78rem] font-bold" data-active={pathname.startsWith(href)}>
              {label}
            </Link>
          ))}
          <Link href="/about#using-the-data" aria-label="Dataset information" title="Dataset information" className="rounded-full p-1.5 text-[#536774] hover:bg-[#eaf4f8] hover:text-[#1c6d99]">
            <CircleHelp size={19} />
          </Link>
        </nav>
        <button ref={triggerRef} className="inline-flex size-11 items-center justify-center rounded-full border border-[#d7e2e9] text-[#102433] transition-colors hover:border-[#1c6d99] hover:bg-[#eaf4f8] hover:text-[#1c6d99] md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu size={21} />
        </button>
      </div>

      <div className={`fixed inset-0 z-[90] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={open ? 0 : -1}
          onClick={() => { closeDrawer(); triggerRef.current?.focus(); }}
          className={`absolute inset-0 bg-[#071b27]/65 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          ref={drawerRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`absolute inset-y-0 right-0 flex w-[min(88vw,370px)] flex-col bg-white shadow-[-18px_0_50px_rgba(7,27,39,.24)] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-[76px] items-center justify-between border-b border-[#d7e2e9] px-5">
            <span className="eyebrow text-sky">NAVIGATION</span>
            <button ref={closeRef} type="button" onClick={() => { closeDrawer(); triggerRef.current?.focus(); }} aria-label="Close navigation" className="inline-flex size-10 items-center justify-center rounded-full border border-[#d7e2e9] transition-colors hover:border-[#1c6d99] hover:bg-[#eaf4f8] hover:text-[#1c6d99]">
              <X size={20} />
            </button>
          </div>

          <nav aria-label="Mobile primary navigation" className="flex-1 overflow-y-auto px-5 py-5">
            {links.map(([label, href], index) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={closeDrawer} data-active={active} className="group flex items-center justify-between border-b border-[#e3ebef] py-5">
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[.65rem] text-[#78909d]">0{index + 1}</span>
                    <span className={`display text-[1.8rem] leading-none transition-colors ${active ? "text-[#1c6d99]" : "text-[#102433] group-hover:text-[#1c6d99]"}`}>{label}</span>
                  </span>
                  <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${active ? "text-[#1c6d99]" : "text-[#91a3ad]"}`} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#d7e2e9] bg-[#f3f8fa] p-5">
            <Link href="/about#using-the-data" onClick={closeDrawer} className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-[0_5px_18px_rgba(16,47,65,.07)]">
              <CircleHelp size={20} className="mt-0.5 shrink-0 text-sky" aria-hidden="true" />
              <span><strong className="block text-sm">Dataset information</strong><span className="mt-1 block text-xs leading-5 text-muted">Scope, licensing, citation, and responsible use.</span></span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
