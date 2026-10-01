"use client";

import { FC } from "react";
import { RemovableChips } from "@/src/lib/shared/ui/RemovableChips";

export interface IAppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface IAppliedFiltersProps {
  filters: IAppliedFilter[];
  onClearAll: () => void;
  className?: string;
}

export const AppliedFilters: FC<IAppliedFiltersProps> = ({
  filters,
  onClearAll,
  className,
}) => (
  <RemovableChips
    variant="pill"
    className={className}
    items={filters.map(({ key, label }) => ({ id: key, label }))}
    getRemoveLabel={({ label }) => `Remove filter ${label}`}
    onRemove={(id) => filters.find(({ key }) => key === id)?.onRemove()}
    onClearAll={onClearAll}
  />
);
