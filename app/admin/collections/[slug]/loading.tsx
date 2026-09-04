import { Panel, PanelHeader } from "@/components/admin/ui";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-2.5 h-12 w-full" />
    </div>
  );
}

export default function AdminCollectionDetailLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <div>
        <Skeleton className="h-3.5 w-32" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="grid gap-6">
          <Panel>
            <PanelHeader title={<Skeleton className="h-4 w-32" />} />
            <div className="grid gap-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 2 }, (_, index) => <FieldSkeleton key={index} />)}
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <FieldSkeleton key={index} />)}
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={<Skeleton className="h-4 w-24" />} description={<Skeleton className="h-3 w-56" />} />
            <ul className="divide-y divide-line">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel>
            <PanelHeader title={<Skeleton className="h-4 w-56" />} description={<Skeleton className="h-3 w-64" />} />
            <div className="px-5">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={<Skeleton className="h-4 w-16" />} />
            <ul className="divide-y divide-line">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="px-5 py-3">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="mt-2 h-2.5 w-32" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </SkeletonPage>
  );
}
