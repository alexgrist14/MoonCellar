import { useEffect, useState } from "react";

export const useGridRows = <T extends HTMLElement>(
  count: number,
  maxRows?: number
) => {
  const [grid, setGrid] = useState<T | null>(null);
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    if (!grid) return;

    const measure = () =>
      setColumns(
        getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
          .length
      );
    const observer = new ResizeObserver(measure);

    measure();
    observer.observe(grid);

    return () => observer.disconnect();
  }, [grid]);

  const visibleCount =
    !maxRows || !columns || count < columns
      ? count
      : Math.min(Math.floor(count / columns), maxRows) * columns;

  return { ref: setGrid, visibleCount };
};
