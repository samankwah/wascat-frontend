import { Panel } from "@/components/admin/ui";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function AdminRequestsLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header>
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-2 h-9 w-56" />
        <div className="mt-2 grid max-w-2xl gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </header>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <Panel as="div">
        <TableSkeleton
          rows={6}
          columns={[
            { label: "Reference", width: "w-20" },
            { label: "Requester", width: "w-36" },
            { label: "Collections", width: "w-24" },
            { label: "Received", width: "w-20" },
            { label: "Status", width: "w-16" },
            { label: "", width: "w-4", align: "right" },
          ]}
        />
      </Panel>
    </SkeletonPage>
  );
}
