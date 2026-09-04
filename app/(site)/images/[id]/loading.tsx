import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function ImageDetailLoading() {
  return (
    <SkeletonPage>
      <section className="bg-ink-deep text-white">
        <div className="container-shell py-5">
          <Skeleton onDark className="h-3.5 w-32" />
        </div>
        <div className="container-shell grid gap-9 pb-14 lg:grid-cols-[1.45fr_.55fr] lg:pb-20">
          <div>
            <div className="flex gap-5 border-b border-white/20">
              <Skeleton onDark className="h-12 w-16" />
              <Skeleton onDark className="h-12 w-14" />
              <Skeleton onDark className="h-12 w-16" />
            </div>
            <Skeleton onDark className="mt-5 aspect-[16/9] w-full" />
          </div>
          <aside className="lg:pt-12">
            <Skeleton onDark className="h-2.5 w-36" />
            <Skeleton onDark className="mt-3 h-6 w-full" />
            <Skeleton onDark className="mt-3 h-3.5 w-44" />
            <div className="mt-8 grid border-t border-white/20">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="grid grid-cols-[24px_1fr] gap-3 border-b border-white/15 py-4">
                  <Skeleton onDark className="size-4 rounded-full" />
                  <div>
                    <Skeleton onDark className="h-2.5 w-24" />
                    <Skeleton onDark className="mt-2 h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="container-shell grid gap-12 py-14 md:grid-cols-[1.25fr_.75fr] md:py-20">
        <div className="min-w-0">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="mt-3 h-9 w-56" />
          <div className="mt-7 border-t border-line-strong">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_110px_160px_auto] sm:gap-5">
                <div className="min-w-0">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="mt-2 h-2.5 w-56" />
                </div>
                <Skeleton className="hidden h-3 w-14 sm:block" />
                <Skeleton className="hidden h-3 w-24 sm:block" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Skeleton className="h-2.5 w-52" />
            <div className="mt-3 grid gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </div>
        <aside className="min-w-0 space-y-5">
          <div className="border border-line bg-paper p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-4 h-9 w-36" />
          </div>
          <div className="border border-line p-5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-2/3" />
          </div>
        </aside>
      </section>
    </SkeletonPage>
  );
}
