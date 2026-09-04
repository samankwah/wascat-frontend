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
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Whether the header has stuck to the top of the viewport - watched with a
  // 1px sentinel placed just above it rather than a scroll listener, so the
  // browser only has to notify us when that one element's visibility changes
  // instead of running our code on every scroll pixel.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
    <>
      {/* Crosses out of view the instant the header reaches the top of the
          viewport - the IntersectionObserver above watches this, not scroll
          position, to know when the header has "stuck". */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-[border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
          scrolled
            ? "border-transparent shadow-[0_1px_0_rgba(16,47,65,.08),0_18px_30px_-22px_rgba(16,47,65,.28)]"
            : "hairline shadow-none"
        }`}
      >
        <div
          className={`container-shell flex items-center justify-between transition-[height] duration-300 ease-out motion-reduce:transition-none ${
            scrolled ? "h-16" : "h-[76px]"
          }`}
        >
          <Logo />
          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="nav-link text-[.92rem] font-bold" data-active={pathname.startsWith(href)}>
                {label}
              </Link>
            ))}
            <Link href="/about#using-the-data" aria-label="Dataset information" title="Dataset information" className="rounded-full p-1.5 text-muted-dim hover:bg-sky-pale hover:text-sky">
              <CircleHelp size={20} />
            </Link>
          </nav>
          <button ref={triggerRef} className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-sky hover:bg-sky-pale hover:text-sky md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu size={21} />
          </button>
        </div>

        <div className={`fixed inset-0 z-[90] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={open ? 0 : -1}
            onClick={() => { closeDrawer(); triggerRef.current?.focus(); }}
            className={`absolute inset-0 bg-ink-abyss/65 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          />
          <div
            ref={drawerRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className={`absolute inset-y-0 right-0 flex w-[min(88vw,370px)] flex-col bg-white shadow-[-18px_0_50px_rgba(7,27,39,.24)] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex h-[76px] items-center justify-between border-b border-line px-5">
              <span className="eyebrow text-sky">NAVIGATION</span>
              <button ref={closeRef} type="button" onClick={() => { closeDrawer(); triggerRef.current?.focus(); }} aria-label="Close navigation" className="inline-flex size-10 items-center justify-center rounded-full border border-line transition-colors hover:border-sky hover:bg-sky-pale hover:text-sky">
                <X size={20} />
              </button>
            </div>

            <nav aria-label="Mobile primary navigation" className="flex-1 overflow-y-auto px-5 py-5">
              {links.map(([label, href], index) => {
                const active = pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={closeDrawer} data-active={active} className="group flex items-center justify-between border-b border-line-soft py-5">
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[.65rem] text-on-dark-dim">0{index + 1}</span>
                      <span className={`display text-[1.8rem] leading-none transition-colors ${active ? "text-sky" : "text-ink group-hover:text-sky"}`}>{label}</span>
                    </span>
                    <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${active ? "text-sky" : "text-line-strong"}`} aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-line bg-paper p-5">
              <Link href="/about#using-the-data" onClick={closeDrawer} className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-[0_5px_18px_rgba(16,47,65,.07)]">
                <CircleHelp size={20} className="mt-0.5 shrink-0 text-sky" aria-hidden="true" />
                <span><strong className="block text-sm">Dataset information</strong><span className="mt-1 block text-xs leading-5 text-muted">Scope, licensing, citation, and responsible use.</span></span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
