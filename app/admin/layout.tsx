import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/nav";
import { getSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · WASCAT dashboard" },
  // The dashboard has nothing to offer a crawler and should not appear in
  // search results.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Read once here and pass down, rather than each page asking. The session
  // check that actually *decides* lives in the pages and in the API; this is
  // for rendering the shell.
  const user = await getSession();

  // The sign-in page renders inside this layout too, and has no user. Giving
  // it the bare shell keeps the route tree simple and avoids a second layout
  // whose only job is to not show navigation.
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-[80vh] bg-paper">
      <div className="mx-auto flex w-full max-w-[110rem] flex-col lg:flex-row">
        <AdminNav user={user} />
        <div className="min-w-0 flex-1 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">{children}</div>
      </div>
    </div>
  );
}
