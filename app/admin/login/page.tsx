import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the WASCAT archive dashboard.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="border border-line bg-white p-7 sm:p-9">
          <p className="eyebrow text-sky">Archive dashboard</p>
          <h1 className="display mt-2 text-3xl leading-tight">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Editing the catalogue changes what the public archive reports, so every
            change is recorded against the person who made it.
          </p>

          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          <Link href="/" className="font-bold text-sky hover:underline">
            Back to the public archive
          </Link>
        </p>
      </div>
    </div>
  );
}
