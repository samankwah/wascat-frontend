import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function StatisticsLoading() {
  return (
    <SkeletonPage>
      <div className="bg-paper">
        <div className="container-shell py-12 md:py-16">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="mt-4 h-12 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-xl border border-line bg-white px-5 py-6">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="mt-3 h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={`rounded-2xl border border-line bg-white p-6 ${index === 4 ? "lg:col-span-2" : ""}`}>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-3.5 w-40" />
                <Skeleton className="mt-6 h-[300px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
