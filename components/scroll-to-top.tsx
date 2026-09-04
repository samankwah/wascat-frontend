"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

/** How far down the page before the button offers to bring you back. */
const SHOW_AFTER_PX = 480;

/**
 * A floating "back to top" button for long, scrolling pages.
 *
 * Visibility is driven by a passive, rAF-throttled scroll listener rather
 * than firing on every pixel: the handler only ever does one cheap number
 * comparison, and state only changes on the rare frame where the threshold
 * is actually crossed, so idle scrolling costs nothing extra. The button
 * itself never leaves the DOM - it fades and steps out of the tab order
 * when hidden instead of mounting and unmounting, which is what keeps the
 * fade from janking and keeps a screen reader from announcing anything.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible((was) => {
          const shouldShow = window.scrollY > SHOW_AFTER_PX;
          return shouldShow === was ? was : shouldShow;
        });
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-5 z-40 inline-flex size-11 items-center justify-center rounded-full bg-sky-vivid text-white shadow-[0_10px_24px_rgba(19,65,91,.28)] transition-[opacity,transform] duration-300 ease-out hover:bg-sky-bright motion-reduce:transition-none sm:bottom-8 sm:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}
