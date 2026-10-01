import { ITableCell } from "@/src/lib/shared/types/table.type";

const getSortValue = (cell?: ITableCell) => {
  const value = cell?.sortingValue ?? cell?.content;

  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;

  return typeof value === "string" ? value : undefined;
};

export const compareTableCells = (
  a: ITableCell | undefined,
  b: ITableCell | undefined,
  order: "asc" | "desc"
) => {
  const first = getSortValue(a);
  const second = getSortValue(b);

  if (first === undefined || second === undefined) {
    if (first === second) return 0;

    return first === undefined ? 1 : -1;
  }

  const result =
    typeof first === "number" && typeof second === "number"
      ? first - second
      : String(first).localeCompare(String(second), undefined, {
          numeric: true,
        });

  return order === "asc" ? result : -result;
};
