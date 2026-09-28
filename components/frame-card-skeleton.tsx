import { Skeleton } from "@/components/skeleton";

/** Stands in for `FrameCard` at the same size, so an explore grid does not
 * reflow when the real records arrive. */
export function FrameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-2.5 w-28" />
      </div>
      <div className="mx-3 border-t border-line py-3 sm:mx-4">
        <Skeleton className="h-2.5 w-36" />
      </div>
    </div>
  );
}
