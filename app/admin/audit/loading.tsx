import { Panel } from "@/components/admin/ui";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function AdminAuditLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header>
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-2 h-9 w-40" />
        <div className="mt-2 grid max-w-2xl gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </header>

      <Panel as="div">
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-5">
          <div>
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="mt-2.5 h-10 w-48" />
          </div>
          <div>
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="mt-2.5 h-10 w-56" />
          </div>
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>

        <TableSkeleton
          rows={9}
          columns={[
            { label: "When", width: "w-28" },
            { label: "Who", width: "w-32" },
            { label: "Action", width: "w-24" },
            { label: "Entity", width: "w-24" },
            { label: "Changed", width: "w-40" },
          ]}
        />
      </Panel>
    </SkeletonPage>
  );
}
