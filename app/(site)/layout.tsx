import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

/**
 * The public archive's chrome.
 *
 * A route group rather than a path segment, so these pages keep their URLs -
 * `/explore` is still `/explore` - while the dashboard under `/admin` renders
 * outside this shell with its own navigation.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-[-100px] z-[100] bg-white px-4 py-3 font-bold shadow focus:top-4"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
