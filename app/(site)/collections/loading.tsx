import { CollectionCardSkeleton } from "@/components/collection-card-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function CollectionsLoading() {
  return (
    <SkeletonPage>
      <section className="bg-ink-panel py-16 text-white md:py-24">
        <div className="container-shell grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
          <div>
            <Skeleton onDark className="h-2.5 w-40" />
            <Skeleton onDark className="mt-4 h-12 w-full sm:h-16" />
            <Skeleton onDark className="mt-2 h-12 w-3/4 sm:h-16" />
          </div>
          <div className="grid max-w-lg gap-2">
            <Skeleton onDark className="h-3.5 w-full" />
            <Skeleton onDark className="h-3.5 w-full" />
            <Skeleton onDark className="h-3.5 w-2/3" />
          </div>
        </div>
      </section>

      <section className="container-shell py-16 md:py-24">
        <div className="grid gap-14 md:grid-cols-3 md:gap-7">
          {Array.from({ length: 6 }, (_, index) => <CollectionCardSkeleton key={index} />)}
        </div>
      </section>
    </SkeletonPage>
  );
}
