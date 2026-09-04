import { Panel, PanelHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function AdminUsersLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <header>
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="mt-2 h-9 w-32" />
        <div className="mt-2 grid max-w-2xl gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </header>

      <Panel as="div">
        <PanelHeader title={<Skeleton className="h-4 w-16" />} description={<Skeleton className="h-3 w-72" />} actions={<Skeleton className="h-9 w-20" />} />
        <TableShell>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Role</Th>
              <Th>Last signed in</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                <Td>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="mt-2 h-2.5 w-40" />
                </Td>
                <Td><Skeleton className="h-9 w-28" /></Td>
                <Td><Skeleton className="h-3 w-20" /></Td>
                <Td align="right"><Skeleton className="ml-auto h-3 w-16" /></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </SkeletonPage>
  );
}
