import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ISortControlOption, ISortOrder, SortControl } from "./SortControl";

type ISort = "position" | "name" | "release" | "rating";

const OPTIONS: ISortControlOption<ISort>[] = [
  { value: "position", label: "List order" },
  { value: "name", label: "Name" },
  { value: "release", label: "Release date" },
  { value: "rating", label: "Rating" },
];

const meta = {
  title: "Shared/SortControl",
  component: SortControl,
  args: {
    options: OPTIONS,
    sortBy: "name",
    sortOrder: "asc",
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SortControl>;

export default meta;

type Story = StoryObj<typeof meta>;

const ControlledSort = ({
  initialSortBy,
  label,
  isWithReset,
  placeholder,
}: {
  initialSortBy?: ISort;
  label?: string;
  isWithReset?: boolean;
  placeholder?: string;
}) => {
  const [sort, setSort] = useState<{ by?: ISort; order: ISortOrder }>({
    by: initialSortBy,
    order: "desc",
  });

  return (
    <SortControl
      options={OPTIONS}
      sortBy={sort.by}
      sortOrder={sort.order}
      label={label}
      isWithReset={isWithReset}
      placeholder={placeholder}
      onChange={(by, order) => setSort({ by, order })}
    />
  );
};

export const Default: Story = {
  render: () => <ControlledSort initialSortBy="position" />,
};

export const WithLabel: Story = {
  render: () => <ControlledSort initialSortBy="rating" label="Sort by" />,
};

export const Resettable: Story = {
  render: () => (
    <ControlledSort label="Sort by" placeholder="Default" isWithReset />
  ),
};

export const Descending: Story = { args: { sortOrder: "desc" } };

export const Disabled: Story = { args: { isDisabled: true } };
