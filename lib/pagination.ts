/**
 * The page numbers a pager shows: every page when there are few, otherwise
 * the first, the last, and the current one with its neighbours, with gaps
 * marked "gap". Pages are 1-based.
 */
export function pageItems(current: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const shown = new Set([1, count, current - 1, current, current + 1].filter((page) => page >= 1 && page <= count));
  const pages = [...shown].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) items.push(page - previous === 2 ? page - 1 : "gap");
    items.push(page);
  });
  return items;
}
