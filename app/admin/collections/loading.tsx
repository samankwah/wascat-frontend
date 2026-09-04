import { Panel } from "@/components/admin/ui";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function AdminCollectionsLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header>
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-2 h-9 w-48" />
        <div className="mt-2 grid max-w-2xl gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </header>

      <Panel as="div">
        <TableSkeleton
          rows={8}
          columns={[
            { label: "Sequence", width: "w-24" },
            { label: "Site", width: "w-28" },
            { label: "Frames", width: "w-12", align: "right" },
            { label: "Segmented", width: "w-12", align: "right" },
            { label: "Licence", width: "w-20" },
            { label: "Releases", width: "w-24" },
            { label: "", width: "w-4", align: "right" },
          ]}
        />
      </Panel>
    </SkeletonPage>
  );
}
