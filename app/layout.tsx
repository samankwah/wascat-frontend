import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/**
 * The root layout carries the document and the fonts, and nothing else.
 *
 * The public site's header and footer live in `(site)/layout.tsx` instead,
 * because the dashboard is a different surface with its own navigation - it
 * should not be wearing the marketing site's chrome, and a signed-in curator
 * has no use for a "Dataset information" footer while editing a record.
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
    // `data-scroll-behavior` opts back into Next's override of the global
    // `scroll-behavior: smooth`. Without it, changing route animates a scroll
    // to the top instead of arriving there - slow, and disorienting on a long
    // table. In-page anchors still glide.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
