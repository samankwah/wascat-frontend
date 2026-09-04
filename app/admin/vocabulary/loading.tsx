import { Panel, PanelHeader } from "@/components/admin/ui";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

function VocabularyPanelSkeleton() {
  return (
    <Panel as="div">
      <PanelHeader
        title={<Skeleton className="h-4 w-24" />}
        description={<Skeleton className="h-3 w-80" />}
        actions={<Skeleton className="h-9 w-24" />}
      />
      <TableSkeleton
        rows={4}
        columns={[
          { label: "Order", width: "w-6", thClassName: "w-16" },
          { label: "Term", width: "w-28" },
          { label: "Records", width: "w-10", align: "right" },
          { label: "Also known as", width: "w-32" },
        ]}
      />
    </Panel>
  );
}

export default function AdminVocabularyLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header>
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="mt-2 h-9 w-44" />
        <div className="mt-2 grid max-w-2xl gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </header>

      <div className="grid gap-6">
        <VocabularyPanelSkeleton />
        <VocabularyPanelSkeleton />
      </div>
    </SkeletonPage>
  );
}
