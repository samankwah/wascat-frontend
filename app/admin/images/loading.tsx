import { Panel, TableShell, Td, Th } from "@/components/admin/ui";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function AdminImagesLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-2 h-9 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
      </header>

      <Panel as="div">
        <div className="grid gap-4 p-5 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2.5 h-12 w-full" />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Skeleton className="h-[46px] w-20" />
            <Skeleton className="h-[46px] w-20" />
          </div>
        </div>
      </Panel>

      <Panel as="div">
        <TableShell>
          <thead>
            <tr>
              <Th className="w-10" />
              <Th className="w-[4.5rem]">Frame</Th>
              <Th>Record</Th>
              <Th>Sequence</Th>
              <Th>Cloud cover</Th>
              <Th>Artifacts</Th>
              <Th>Provenance</Th>
              <Th align="right">Release</Th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, row) => (
              <tr key={row}>
                <Td><Skeleton className="size-4 rounded-sm" /></Td>
                <Td><Skeleton className="size-11" /></Td>
                <Td><Skeleton className="h-3 w-32" /></Td>
                <Td><Skeleton className="h-3 w-20" /></Td>
                <Td><Skeleton className="h-5 w-24 rounded-full" /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14 rounded-sm" />
                    <Skeleton className="h-5 w-12 rounded-sm" />
                  </div>
                </Td>
                <Td><Skeleton className="h-3 w-24" /></Td>
                <Td align="right"><Skeleton className="ml-auto h-3 w-10" /></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Skeleton className="h-2.5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </Panel>
    </SkeletonPage>
  );
}
