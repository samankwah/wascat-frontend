import { Panel, PanelHeader } from "@/components/admin/ui";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

function StatSkeleton() {
  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-[18px] rounded-full" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-2.5 w-28" />
    </div>
  );
}

export default function AdminOverviewLoading() {
  return (
    <SkeletonPage className="grid gap-7">
      <header>
        <Skeleton className="h-2.5 w-36" />
        <Skeleton className="mt-2 h-9 w-72" />
        <div className="mt-3 grid max-w-2xl gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <StatSkeleton key={index} />)}
      </div>

      <div className="grid gap-7 xl:grid-cols-2">
        <Panel>
          <PanelHeader title={<Skeleton className="h-4 w-36" />} description={<Skeleton className="h-3 w-56" />} />
          <div className="px-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={<Skeleton className="h-4 w-32" />} actions={<Skeleton className="h-3 w-16" />} />
          <ul className="divide-y divide-line">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="px-5 py-3">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2 h-2.5 w-56" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </SkeletonPage>
  );
}
