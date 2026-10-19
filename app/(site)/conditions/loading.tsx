import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function ConditionsLoading() {
  return (
    <SkeletonPage>
      <div className="container-shell pt-12 md:pt-16">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-12 w-[28rem] max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-10 flex gap-3 overflow-hidden sm:gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-[78%] shrink-0 rounded-lg sm:w-[44%] lg:w-[30%]" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
