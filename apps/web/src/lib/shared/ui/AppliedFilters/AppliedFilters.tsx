"use client";

import { FC, ReactNode } from "react";
import { RemovableChips } from "@/src/lib/shared/ui/RemovableChips";

export interface IAppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface IAppliedFiltersProps {
  filters: IAppliedFilter[];
  onClearAll: () => void;
  isSingleLine?: boolean;
  summary?: ReactNode;
  className?: string;
}

export const AppliedFilters: FC<IAppliedFiltersProps> = ({
  filters,
  onClearAll,
  isSingleLine,
  summary,
  className,
}) => (
  <RemovableChips
    variant="pill"
    isSingleLine={isSingleLine}
    summary={summary}
    className={className}
    items={filters.map(({ key, label }) => ({ id: key, label }))}
    getRemoveLabel={({ label }) => `Remove filter ${label}`}
    onRemove={(id) => filters.find(({ key }) => key === id)?.onRemove()}
    onClearAll={onClearAll}
  />
);
