"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { Badge, EmptyState, Panel, PanelHeader, TableShell, Td, Th, cx } from "@/components/admin/ui";
import { adminApi, type ManagedUserWithSecret } from "@/lib/admin/api";
import type { ManagedRole, ManagedUser } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";

/**
 * Accounts, and who may do what.
 *
 * Two things here are deliberately awkward rather than smooth, because the
 * smooth version would be wrong.
 *
 * A generated password is shown exactly once, in a panel that has to be
 * dismissed by hand. There is no "show again": nothing stores it, so an
 * interface that implied otherwise would be lying.
 *
 * The actions that remove someone's access ask for confirmation and say what
 * will happen to their open sessions, because "save" on a role dropdown is a
 * very quiet way to sign somebody out.
 */
export function UserManager({
  users,
  roles,
  currentUserId,
}: {
  users: ManagedUser[];
  roles: ManagedRole[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      const result = await action();
      router.refresh();
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6">
      {issued ? (
        <OneTimePassword
          email={issued.email}
          password={issued.password}
          onDismiss={() => setIssued(null)}
        />
      ) : null}

      <Panel as="div">
        <PanelHeader
          title="People"
          description="Who can sign in to the dashboard, and what they are allowed to change. Sign-in addresses are identifiers - no mail is ever sent to them."
          actions={
            !inviting ? (
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="button-secondary min-h-9 text-xs"
              >
                <Plus size={14} aria-hidden="true" />
                Invite
              </button>
            ) : null
          }
        />

        {inviting ? (
          <InviteForm
            roles={roles}
            busy={busy === "invite"}
            onCancel={() => setInviting(false)}
            onSubmit={async (email, role, fullName) => {
              const created = (await run("invite", () =>
                adminApi.createUser(email, role, fullName),
              )) as ManagedUserWithSecret | null;
              if (created) {
                setIssued({ email: created.email, password: created.password });
                setInviting(false);
              }
            }}
          />
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 border-b border-line bg-white px-5 py-3 text-sm leading-6 text-danger"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {users.length === 0 ? (
          <EmptyState
            icon={<UserPlus size={20} />}
            title="No accounts yet"
            description="Invite someone, or create the first account with `wascat users create`."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Role</Th>
                <Th>Last signed in</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  roles={roles}
                  isSelf={user.id === currentUserId}
                  busy={busy}
                  onRoleChange={(role) =>
                    run(`role:${user.id}`, () => adminApi.updateUser(user.id, { role }))
                  }
                  onToggleActive={() =>
                    run(`active:${user.id}`, () =>
                      adminApi.updateUser(user.id, { isActive: !user.isActive }),
                    )
                  }
                  onResetPassword={async () => {
                    const reset = (await run(`reset:${user.id}`, () =>
                      adminApi.resetUserPassword(user.id),
                    )) as ManagedUserWithSecret | null;
                    if (reset) setIssued({ email: reset.email, password: reset.password });
                  }}
                />
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}

/**
 * The password, once.
 *
 * Deliberately loud and deliberately manual to dismiss. It is not stored
 * anywhere, so a viewer who navigates away has genuinely lost it and has to
 * reset again - the copy is the only chance.
 */
function OneTimePassword({
  email,
  password,
  onDismiss,
}: {
  email: string;
  password: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be refused; the value is on screen to be read.
      setCopied(false);
    }
  }

  return (
    <Panel as="div" className="border-sky">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sky/30 bg-sky-pale px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-sky-dark">
            <ShieldCheck size={16} aria-hidden="true" />
            Password for {email}
          </p>
          <p className="mt-1 text-sm leading-6 text-sky-dark">
            This is shown once. Store it somewhere safe, then send it to them over a
            channel you trust.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="button-secondary min-h-9 text-xs"
          aria-label="Dismiss the password"
        >
          <X size={13} aria-hidden="true" />
          Done
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <code
          className="min-w-0 flex-1 break-all border border-line bg-paper px-3 py-2 font-mono text-sm"
          // Announced on appearance: someone using a screen reader needs the
          // value read out, not just placed on the page.
          role="status"
        >
          {password}
        </code>
        <button type="button" onClick={copy} className="button-primary min-h-10 text-xs">
          {copied ? (
            <>
              <Check size={14} aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
    </Panel>
  );
}

function InviteForm({
  roles,
  busy,
  onCancel,
  onSubmit,
}: {
  roles: ManagedRole[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (email: string, role: string, fullName?: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(roles.find((entry) => entry.slug === "curator")?.slug ?? "");

  const chosen = roles.find((entry) => entry.slug === role);

  return (
    <form
      className="grid gap-4 border-b border-line px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim() && role) onSubmit(email.trim(), role, fullName.trim() || undefined);
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="field-label">Sign-in address</span>
          <input
            type="text"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.org"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Name (optional)</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Shown in the audit log"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="field-select"
          >
            {roles.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.slug}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* What the role actually means, rather than leaving someone to infer it
          from a one-word slug. */}
      {chosen ? <p className="text-xs leading-5 text-muted">{chosen.description}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="button-primary min-h-10 text-xs">
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Creating
            </>
          ) : (
            <>
              <UserPlus size={14} aria-hidden="true" />
              Create account
            </>
          )}
        </button>
        <button type="button" onClick={onCancel} className="button-secondary min-h-10 text-xs">
          Cancel
        </button>
      </div>
      <p className="text-xs leading-5 text-muted">
        A password is generated and shown to you once. There is no email step.
      </p>
    </form>
  );
}

function UserRow({
  user,
  roles,
  isSelf,
  busy,
  onRoleChange,
  onToggleActive,
  onResetPassword,
}: {
  user: ManagedUser;
  roles: ManagedRole[];
  isSelf: boolean;
  busy: string | null;
  onRoleChange: (role: string) => void;
  onToggleActive: () => void;
  onResetPassword: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const role = user.roles[0] ?? "";
  const working = busy?.endsWith(user.id) ?? false;

  return (
    <tr className={cx(!user.isActive && "bg-paper")}>
      <Td>
        <span className="block font-medium">{user.fullName ?? user.email}</span>
        {user.fullName ? (
          <span className="block font-mono text-[.72rem] text-muted">{user.email}</span>
        ) : null}
        <span className="mt-1 flex flex-wrap gap-1">
          {isSelf ? <Badge tone="published">you</Badge> : null}
          {!user.isActive ? <Badge tone="retired">disabled</Badge> : null}
        </span>
      </Td>

      <Td>
        {/* Changing your own role is refused by the API; disabling the control
            says so before the click rather than after. */}
        <select
          value={role}
          disabled={isSelf || working || !user.isActive}
          onChange={(event) => onRoleChange(event.target.value)}
          aria-label={`Role for ${user.email}`}
          title={isSelf ? "You cannot change your own role" : undefined}
          className="field-select h-9 w-36 text-xs"
        >
          {roles.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.slug}
            </option>
          ))}
        </select>
      </Td>

      <Td className="text-muted">
        {user.lastLoginAt ? (
          formatDate(user.lastLoginAt, true)
        ) : (
          <span className="text-muted-dim">Never</span>
        )}
      </Td>

      <Td align="right">
        <span className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onResetPassword}
            disabled={working}
            className="button-secondary min-h-9 text-xs"
          >
            <KeyRound size={13} aria-hidden="true" />
            Reset password
          </button>

          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onToggleActive();
                }}
                disabled={working}
                className="button-primary min-h-9 text-xs"
              >
                {working ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : null}
                {user.isActive ? "Disable, ending their sessions" : "Restore access"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="button-secondary min-h-9 text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={isSelf || working}
              title={isSelf ? "You cannot disable your own account" : undefined}
              className="button-secondary min-h-9 text-xs"
            >
              {user.isActive ? "Disable" : "Restore"}
            </button>
          )}
        </span>
      </Td>
    </tr>
  );
}
