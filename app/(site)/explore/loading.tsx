import { FrameCardSkeleton } from "@/components/frame-card-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

/** One labelled field's worth of skeleton, matching `.field-input`'s height
 * so the real filter panel doesn't grow when it swaps in. */
function FieldSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-2.5 h-12 w-full" />
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
      <div>
        <Skeleton className="h-2.5 w-32" />
        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
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
      <section className="border-b border-line bg-paper">
        <div className="container-shell py-12 md:py-16">
          <Skeleton className="h-2.5 w-72" />
          <Skeleton className="mt-4 h-12 w-full max-w-lg sm:h-14" />
          <div className="mt-5 grid max-w-2xl gap-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      </section>

      <div className="container-shell py-9 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <FilterPanelSkeleton />
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-9 xl:grid-cols-3">
              {Array.from({ length: 9 }, (_, index) => <FrameCardSkeleton key={index} />)}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
