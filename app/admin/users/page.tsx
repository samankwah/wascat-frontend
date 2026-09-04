import { UserManager } from "@/components/admin/user-manager";
import { listUsers } from "@/lib/admin/data";
import { PERMISSIONS, requirePermission } from "@/lib/admin/session";

export const metadata = { title: "People" };

export default async function AdminUsers() {
  // The only permission that gates this page. A curator who reaches the URL
  // directly is redirected here, and every endpoint behind it refuses them
  // again on its own account.
  const user = await requirePermission(PERMISSIONS.userManage, "/admin/users");
  const { users, roles } = await listUsers();

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow text-sky">Access</p>
        <h1 className="display mt-2 text-3xl leading-tight">People</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Editing the catalogue changes what the public archive reports, so every change
          is recorded against the person who made it. Accounts are disabled rather than
          deleted, which keeps that history pointing at somebody.
        </p>
      </header>

      <UserManager users={users} roles={roles} currentUserId={user.id} />
    </div>
  );
}
