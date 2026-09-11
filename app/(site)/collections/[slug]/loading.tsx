import { FrameCardSkeleton } from "@/components/frame-card-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

function FactTileSkeleton({ bordered = true }: { bordered?: boolean }) {
  return (
    <div className={`min-h-36 p-4 sm:p-5 ${bordered ? "border-line md:border-l md:border-t-0" : ""}`}>
      <Skeleton className="size-[18px] rounded-full" />
      <Skeleton className="mt-5 h-2.5 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export default function CollectionDetailLoading() {
  return (
    <SkeletonPage>
      <div className="border-b border-line bg-paper lg:hidden">
        <div className="container-shell py-3">
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <section className="border-b border-line bg-paper">
        <div className="container-shell grid gap-10 pb-14 lg:pt-14 md:grid-cols-[1.03fr_.97fr] md:items-end md:pb-20">
          <div className="pb-2">
            <Skeleton className="h-2.5 w-40" />
            <Skeleton className="mt-4 h-12 w-full sm:h-16" />
            <Skeleton className="mt-2 h-12 w-2/3 sm:h-16" />
            <div className="mt-6 grid max-w-2xl gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-[46px] w-56" />
              <Skeleton className="h-[46px] w-40" />
            </div>
          </div>
          <Skeleton className="aspect-[16/9] w-full" />
        </div>
      </section>

      <section className="border-y border-line">
        <div className="container-shell grid grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <FactTileSkeleton key={index} />)}
        </div>
      </section>

      <section className="container-shell grid gap-14 py-16 md:grid-cols-[1.45fr_.55fr] md:py-24">
        <div>
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="mt-3 h-9 w-64" />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-5">
            {Array.from({ length: 4 }, (_, index) => <FrameCardSkeleton key={index} />)}
          </div>
        </div>
        <aside>
          <Skeleton className="h-2.5 w-36" />
          <div className="mt-4 border-t border-line-strong">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-end justify-between border-b border-line py-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="border-t border-line py-16">
        <div className="container-shell">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className="mt-3 h-9 w-56" />
            </div>
            <Skeleton className="hidden h-6 w-28 rounded-full sm:block" />
          </div>
          <div className="mt-7 border-t border-line-strong">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 border-b border-line py-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SkeletonPage>
  );
}
