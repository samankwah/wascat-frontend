"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { AdminApiError, adminApi } from "@/lib/admin/api";

/**
 * The sign-in form.
 *
 * A full `window.location` navigation on success rather than a client-side
 * push: the session cookies were only just set, and the proxy needs to see
 * them on a real request before the dashboard renders. Pushing would leave the
 * router working from a page tree fetched while signed out.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await adminApi.login(email.trim(), password);
      const destination = next && next.startsWith("/admin") ? next : "/admin";
      window.location.href = destination;
    } catch (caught) {
      // The API deliberately does not say whether the account exists, so
      // neither does this.
      setError(
        caught instanceof AdminApiError
          ? caught.message
          : "Could not reach the archive. Check that the API is running.",
      );
      setPending(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 grid gap-5" noValidate>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-danger/40 bg-white px-3 py-2.5 text-sm leading-5 text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="field-label">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input"
          placeholder="you@example.org"
          disabled={pending}
        />
      </label>

      <label className="block">
        <span className="field-label">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
          disabled={pending}
        />
      </label>

      <button type="submit" className="button-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
