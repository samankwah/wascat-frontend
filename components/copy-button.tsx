"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button onClick={copy} className="inline-flex items-center gap-2 text-xs font-bold text-sky hover:underline" aria-live="polite">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : label}</button>;
}
