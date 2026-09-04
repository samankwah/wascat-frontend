import { Skeleton } from "@/components/skeleton";

/** Stands in for `FrameCard` at the same size, so an explore grid does not
 * reflow when the real records arrive. */
export function FrameCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-2 h-2.5 w-24" />
        </div>
        <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
