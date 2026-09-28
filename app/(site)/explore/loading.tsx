import { FrameCardSkeleton } from "@/components/frame-card-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

/** One labelled field's worth of skeleton, matching `.field-input`'s height
 * so the real filter panel doesn't grow when it swaps in. */
function FieldSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-2.5 h-12 w-full rounded-lg" />
    </div>
  );
}

function FilterPanelSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
      <FieldSkeleton />
      <FieldSkeleton />
      <div className="grid grid-cols-2 gap-3">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <div className="grid grid-cols-2 gap-3">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <SkeletonPage>
      <div className="border-b border-line bg-paper lg:hidden">
        <div className="container-shell py-3">
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <div className="bg-paper">
        <section className="container-shell pb-2 pt-12 md:pt-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-2xl">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="mt-4 h-12 w-full max-w-md" />
              <div className="mt-4 grid gap-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-white lg:min-w-[440px]">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="px-4 py-4 sm:px-5">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="mt-2.5 h-6 w-14" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container-shell pb-14 pt-8 md:pb-20 md:pt-10">
          <div className="grid gap-8 lg:grid-cols-[272px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-20 rounded-2xl border border-line bg-white p-5">
                <FilterPanelSkeleton />
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:px-5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-10 w-36 rounded-lg" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {Array.from({ length: 9 }, (_, index) => <FrameCardSkeleton key={index} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
