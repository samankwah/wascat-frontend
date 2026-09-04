import { CollectionCardSkeleton } from "@/components/collection-card-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

/**
 * The homepage awaits its stats and featured collections before it can
 * render anything - even the hero copy quotes the archive's live totals -
 * so the whole above-the-fold view is stood in for here.
 */
export default function HomeLoading() {
  return (
    <SkeletonPage>
      <section className="relative border-b border-line bg-sky-wash">
        <div className="mx-auto w-[min(1174px,calc(100%-32px))] pt-11 pb-16 sm:w-[min(1174px,calc(100%-64px))] sm:pt-14 lg:pt-[72px] lg:pb-24">
          <div className="max-w-[570px]">
            <Skeleton className="h-11 w-full max-w-[420px] sm:h-[3.3rem]" />
            <Skeleton className="mt-3 h-11 w-4/5 max-w-[380px] sm:h-[3.3rem]" />
            <div className="mt-6 grid max-w-[410px] gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Skeleton className="h-12 w-full rounded-[7px] sm:w-[178px]" />
              <Skeleton className="h-12 w-full rounded-[7px] sm:w-[195px]" />
            </div>
          </div>

          <div className="relative mt-9 grid w-full gap-4 rounded-xl bg-white px-5 py-5 shadow-[0_5px_13px_rgba(27,73,103,.18)] sm:grid-cols-2 sm:px-6 lg:grid-cols-[2.05fr_.95fr_.95fr_.95fr_1fr] lg:items-end lg:gap-5 lg:py-[22px]">
            <Skeleton className="h-[50px] w-full rounded-[7px] sm:col-span-2 lg:col-span-1" />
            <Skeleton className="h-[50px] w-full rounded-[7px]" />
            <Skeleton className="h-[50px] w-full rounded-[7px]" />
            <Skeleton className="h-[50px] w-full rounded-[7px]" />
            <Skeleton className="h-[50px] w-full rounded-[7px] sm:col-span-2 lg:col-span-1" />
          </div>
        </div>

        <div className="mx-auto grid w-[min(970px,calc(100%-32px))] gap-y-6 pb-7 pt-9 sm:w-[min(970px,calc(100%-80px))] sm:grid-cols-3 sm:pt-8 lg:pb-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex min-h-16 items-center gap-5 sm:justify-center">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-2 h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-20 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Skeleton className="h-2.5 w-44" />
            <Skeleton className="mt-3 h-10 w-full max-w-xl" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-6">
          {Array.from({ length: 3 }, (_, index) => <CollectionCardSkeleton key={index} />)}
        </div>
      </section>
    </SkeletonPage>
  );
}
