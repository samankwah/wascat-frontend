import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

/**
 * The site loaded no fonts at all, falling back to Georgia for display and
 * Arial for everything else. These are the same pairing done properly: a
 * transitional serif for headings, a neutral grotesque for interface text,
 * and a mono for the things that must be read character by character -
 * record ids, object keys, SHA-256 digests.
 *
 * `display: "swap"` shows the fallback immediately rather than holding the
 * text hostage to the download, and each stack in globals.css names the
 * previous font as its fallback, so a blocked webfont degrades to what the
 * site looked like before rather than to Times.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif",
  // The display face is only ever used for headings.
  weight: ["400", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "WASCAT — All-Sky Cloud Segmentation Archive",
    template: "%s · WASCAT",
  },
  description:
    "All-sky camera frames paired with their binary cloud-segmentation masks, with cloud cover measured from each mask.",
  metadataBase: new URL("https://wascat.example.org"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-[-100px] z-[100] bg-white px-4 py-3 font-bold shadow focus:top-4"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
