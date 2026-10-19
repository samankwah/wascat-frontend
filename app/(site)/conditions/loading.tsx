import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function ConditionsLoading() {
  return (
    <SkeletonPage>
      <div className="bg-sky-wash">
        <div className="container-shell pb-12 pt-12 md:pb-16 md:pt-16">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="mt-4 h-12 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <Skeleton className="mt-10 h-[420px] w-full rounded-2xl lg:h-[560px]" />
        </div>
      </div>
    </SkeletonPage>
  );
}
