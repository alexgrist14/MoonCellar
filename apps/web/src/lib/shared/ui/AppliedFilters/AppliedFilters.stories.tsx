import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "../Button";
import { AppliedFilters, IAppliedFilter } from "./AppliedFilters";

const InteractiveAppliedFilters = ({ labels }: { labels: string[] }) => {
  const [items, setItems] = useState(labels);

  const filters: IAppliedFilter[] = items.map((label) => ({
    key: label,
    label,
    onRemove: () => setItems((prev) => prev.filter((item) => item !== label)),
  }));

  return (
    <div style={{ display: "grid", gap: "var(--gap-x4)" }}>
      <AppliedFilters filters={filters} onClearAll={() => setItems([])} />
      {!items.length && <Button onClick={() => setItems(labels)}>Reset</Button>}
    </div>
  );
};

const meta = {
  title: "Shared/AppliedFilters",
  component: AppliedFilters,
  args: { filters: [], onClearAll: () => {} },
} satisfies Meta<typeof AppliedFilters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InteractiveAppliedFilters
      labels={["RPG", "Nintendo Switch", "Released after 2015", "Not Shooter"]}
    />
  ),
};

export const Single: Story = {
  render: () => <InteractiveAppliedFilters labels={["PlayStation 2"]} />,
};

export const LongLabels: Story = {
  render: () => (
    <InteractiveAppliedFilters
      labels={[
        "Turn-based strategy with tactical role-playing elements",
        "Super Nintendo Entertainment System",
        "Metroidvania",
      ]}
    />
  ),
};

export const Empty: Story = {};
