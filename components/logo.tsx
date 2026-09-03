import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="WASCAT home">
      <span aria-hidden="true" className={`relative block h-7 w-10 ${inverse ? "text-white" : "text-sky"}`}>
        <svg viewBox="0 0 48 30" fill="none" className="h-full w-full">
          <path d="M8 22c-4.2 0-7-2.8-7-6.4 0-3.4 2.6-6 6.1-6.3C8.4 4.8 12.3 2 17 2c5.8 0 10.4 4 11.2 9.3 1.3-1 3-1.6 4.8-1.6 4.5 0 8.1 3.4 8.1 7.6 0 .3 0 .7-.1 1 3.4.7 5.9 3.2 5.9 6.2H8" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 27h36" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </span>
      <span className={`text-[1.04rem] font-bold tracking-[.17em] ${inverse ? "text-white" : "text-ink"}`}>WASCAT <span className="text-[.62rem] tracking-[.08em] opacity-65">v1.0</span></span>
    </Link>
  );
}
