import { Skeleton } from "@/components/skeleton";

/** Stands in for `CollectionCard` at the same size. */
export function CollectionCardSkeleton() {
  return (
    <div className="border-t border-line-strong pt-3">
      <Skeleton className="aspect-[16/9] w-full" />
      <Skeleton className="mt-5 h-2.5 w-28" />
      <Skeleton className="mt-2 h-7 w-4/5" />
      <div className="mt-4 flex gap-5 border-t border-line pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}
