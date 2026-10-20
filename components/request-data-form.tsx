"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export type RequestableCollection = {
  slug: string;
  title: string;
  station?: string;
  images: number;
};

type Values = {
  name: string;
  email: string;
  organisation: string;
  purpose: string;
  collections: string[];
  acceptLicence: boolean;
  website: string;
};

type FieldErrors = Partial<Record<keyof Values, string>>;

const MIN_PURPOSE = 20;

/** What the browser can check before sending: the API checks all of it again. */
export function checkRequest(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (values.organisation.trim().length < 2) errors.organisation = "Please enter your organisation or institution.";
  if (values.purpose.trim().length < MIN_PURPOSE)
    errors.purpose = `Please describe how you will use the data (at least ${MIN_PURPOSE} characters).`;
  if (values.collections.length === 0) errors.collections = "Choose at least one collection.";
  if (!values.acceptLicence) errors.acceptLicence = "Please agree to cite the archive and follow the licence.";
  return errors;
}

/**
 * The public request form. Downloads are by request: whatever is asked for
 * here is reviewed, and an approved requester is emailed a private link.
 *
 * Errors appear beside the field they belong to; anything that is not about
 * one field (a rate limit, the network) goes in the alert above the button.
 * `website` is a field people never see, which the API uses to turn bots away.
 */
export function RequestDataForm({
  collections,
  initial,
}: {
  collections: readonly RequestableCollection[];
  initial: string[];
}) {
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    organisation: "",
    purpose: "",
    collections: initial,
    acceptLicence: false,
    website: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggle = (slug: string) =>
    set(
      "collections",
      values.collections.includes(slug)
        ? values.collections.filter((entry) => entry !== slug)
        : [...values.collections, slug],
    );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProblem(null);
    const found = checkRequest(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/v1/data-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          name: values.name.trim(),
          email: values.email.trim(),
          organisation: values.organisation.trim(),
          purpose: values.purpose.trim(),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { reference?: string }; error?: { message?: string; details?: Record<string, string[]> } }
        | null;

      if (response.ok && body?.data?.reference) {
        setReference(body.data.reference);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const details = body?.error?.details ?? {};
      const fieldErrors: FieldErrors = {};
      for (const key of Object.keys(details) as (keyof Values)[]) {
        if (key in values) fieldErrors[key] = details[key]?.[0];
      }
      setErrors(fieldErrors);
      setProblem(
        response.status === 429
          ? "You have sent several requests recently. Please try again later, or email data@wascat.org."
          : Object.keys(fieldErrors).length > 0
            ? "Please correct the highlighted fields."
            : (body?.error?.message ?? "Your request could not be sent. Please try again."),
      );
    } catch {
      setProblem("Your request could not be sent. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <div role="status" className="rounded-xl border border-line bg-white p-6 sm:p-8">
        <CheckCircle2 size={28} className="text-sky" aria-hidden />
        <h2 className="display mt-4 text-3xl leading-tight">Request received</h2>
        <p className="mt-3 leading-7 text-muted">
          Your reference is <strong className="font-mono text-ink">{reference}</strong>. We have emailed a confirmation to{" "}
          <strong className="text-ink">{values.email.trim()}</strong>.
        </p>
        <ol className="mt-6 grid gap-3 text-sm leading-6 text-muted">
          <li>
            <span className="font-bold text-ink">1.</span> The WASCAT team reviews what the data is for.
          </li>
          <li>
            <span className="font-bold text-ink">2.</span> Once approved, you receive a private download link by email.
          </li>
          <li>
            <span className="font-bold text-ink">3.</span> If it cannot be approved, we email you the reason.
          </li>
        </ol>
        <Link href="/explore" className="button-secondary mt-8">
          Back to the archive
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" error={errors.name}>
          <input
            id="field-name"
            className="field-input"
            autoComplete="name"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "error-name" : undefined}
          />
        </Field>
        <Field id="email" label="Email" hint="The download link is sent here." error={errors.email}>
          <input
            id="field-email"
            type="email"
            className="field-input"
            autoComplete="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "error-email" : "hint-email"}
          />
        </Field>
      </div>

      <Field id="organisation" label="Organisation" hint="University, agency or company." error={errors.organisation}>
        <input
          id="field-organisation"
          className="field-input"
          autoComplete="organization"
          value={values.organisation}
          onChange={(event) => set("organisation", event.target.value)}
          aria-invalid={Boolean(errors.organisation)}
          aria-describedby={errors.organisation ? "error-organisation" : "hint-organisation"}
        />
      </Field>

      <Field
        id="purpose"
        label="How will you use the data?"
        hint="A sentence or two is enough, e.g. the research question or the model you are training."
        error={errors.purpose}
      >
        <textarea
          id="field-purpose"
          rows={4}
          className="field-input"
          value={values.purpose}
          onChange={(event) => set("purpose", event.target.value)}
          aria-invalid={Boolean(errors.purpose)}
          aria-describedby={errors.purpose ? "error-purpose" : "hint-purpose"}
        />
      </Field>

      <fieldset
        id="field-collections"
        tabIndex={-1}
        aria-invalid={Boolean(errors.collections)}
        aria-describedby={errors.collections ? "error-collections" : undefined}
        className="border-0 p-0 outline-none"
      >
        <legend className="field-label">Collections</legend>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {collections.map((collection) => {
            const checked = values.collections.includes(collection.slug);
            return (
              <li key={collection.slug}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors motion-reduce:transition-none ${
                    checked ? "border-sky bg-sky-pale" : "border-line hover:border-line-strong"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(collection.slug)}
                    className="mt-1 size-4 shrink-0 accent-sky"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{collection.title}</span>
                    <span className="block text-xs leading-5 text-muted">
                      {collection.station ? `${collection.station} · ` : ""}
                      {collection.images.toLocaleString()} frames
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {errors.collections ? (
          <p id="error-collections" className="mt-2 text-xs text-danger">
            {errors.collections}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink">
          <input
            id="field-acceptLicence"
            type="checkbox"
            checked={values.acceptLicence}
            onChange={(event) => set("acceptLicence", event.target.checked)}
            aria-invalid={Boolean(errors.acceptLicence)}
            aria-describedby={errors.acceptLicence ? "error-acceptLicence" : undefined}
            className="mt-1 size-4 shrink-0 accent-sky"
          />
          <span>
            I will cite WASCAT in any work that uses the data and follow each collection&apos;s licence.
          </span>
        </label>
        {errors.acceptLicence ? (
          <p id="error-acceptLicence" className="mt-1.5 text-xs text-danger">
            {errors.acceptLicence}
          </p>
        ) : null}
      </div>

      {/* For bots only. Hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => set("website", event.target.value)} />
        </label>
      </div>

      {problem ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 bg-white px-3 py-2.5 text-sm leading-5 text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {problem}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="button-primary" disabled={pending}>
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Sending request
            </>
          ) : (
            "Send request"
          )}
        </button>
        <p className="text-xs text-muted">We only use your details to review and answer this request.</p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`field-${id}`} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`error-${id}`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`hint-${id}`} className="mt-1.5 text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
