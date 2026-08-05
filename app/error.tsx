"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="container-shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-[#a04437]">Archive unavailable</p>
      <h1 className="display mt-3 text-5xl">We lost the horizon.</h1>
      <p className="mt-5 max-w-md text-muted">The archive could not complete this request. Your filters and downloads are safe.</p>
      <button onClick={reset} className="button-primary mt-8">Try again</button>
    </section>
  );
}
