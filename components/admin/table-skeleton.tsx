import { Skeleton } from "@/components/skeleton";
import { TableShell, Td, Th } from "@/components/admin/ui";

type Column = {
  label: string;
  /** Tailwind width class for the skeleton bar in this column. */
  width?: string;
  align?: "left" | "right" | "center";
  /** Header column width, passed straight to <Th>. */
  thClassName?: string;
};

/**
 * A dashboard table, headed exactly like the real one, with skeleton bars in
 * place of rows. Built on the same `TableShell`/`Th`/`Td` the real tables
 * use, so the borders and column rhythm line up when the data arrives.
 */
export function TableSkeleton({ columns, rows = 6 }: { columns: Column[]; rows?: number }) {
  return (
    <TableShell>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <Th key={index} align={column.align} className={column.thClassName}>
              {column.label}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {columns.map((column, index) => (
              <Td key={index} align={column.align}>
                <Skeleton
                  className={`h-3 ${column.width ?? "w-24"} ${column.align === "right" ? "ml-auto" : ""}`}
                />
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
