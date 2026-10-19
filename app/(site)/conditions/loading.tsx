import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function ConditionsLoading() {
  return (
    <SkeletonPage>
      <div className="container-shell grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="lg:py-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-4 h-14 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-44" />
          <Skeleton className="mt-6 h-24 w-full max-w-xl" />
          <Skeleton className="mt-8 h-48 w-full max-w-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
