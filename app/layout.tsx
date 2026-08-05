import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WASCAT v1.0 — West African Sky Archive", template: "%s · WASCAT v1.0" },
  description: "Explore an expert-labelled demonstration archive of West African skies represented across Ghana, Nigeria, and Burkina Faso.",
  metadataBase: new URL("https://wascat.example.org"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="fixed left-4 top-[-100px] z-[100] bg-white px-4 py-3 font-bold shadow focus:top-4">Skip to content</a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
