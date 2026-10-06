import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentProps, useState } from "react";
import { Button } from "../Button";
import { IRemovableChip, RemovableChips } from "./RemovableChips";

const games: IRemovableChip[] = [
  { id: "1", label: "Hollow Knight" },
  { id: "2", label: "Celeste" },
  { id: "3", label: "Elden Ring" },
  { id: "4", label: "Disco Elysium" },
];

const InteractiveRemovableChips = ({
  initial,
  ...props
}: { initial: IRemovableChip[] } & Partial<
  ComponentProps<typeof RemovableChips>
>) => {
  const [items, setItems] = useState(initial);

  return (
    <div style={{ display: "grid", gap: "var(--gap-x4)" }}>
      <RemovableChips
        {...props}
        items={items}
        onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        onClearAll={props.onClearAll && (() => setItems([]))}
      />
      {!items.length && (
        <Button onClick={() => setItems(initial)}>Reset</Button>
      )}
    </div>
  );
};

const meta = {
  title: "Shared/RemovableChips",
  component: RemovableChips,
  args: { items: [], onRemove: () => {} },
} satisfies Meta<typeof RemovableChips>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveRemovableChips initial={games} />,
};

export const WithLinks: Story = {
  render: () => (
    <InteractiveRemovableChips
      initial={games.map((game) => ({ ...game, href: `/games/${game.id}` }))}
    />
  ),
};

export const WithClearAll: Story = {
  render: () => (
    <InteractiveRemovableChips initial={games} onClearAll={() => {}} />
  ),
};

export const Pill: Story = {
  render: () => (
    <InteractiveRemovableChips
      initial={games}
      variant="pill"
      onClearAll={() => {}}
    />
  ),
};

export const Disabled: Story = {
  args: { items: games, isDisabled: true, onClearAll: () => {} },
};

export const LongLabels: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <InteractiveRemovableChips
        initial={[
          {
            id: "1",
            label: "Turn-based strategy with tactical role-playing elements",
          },
          { id: "2", label: "Super Nintendo Entertainment System" },
        ]}
      />
    </div>
  ),
};

export const Empty: Story = {};

export const SingleLine: Story = {
  args: {
    variant: "pill",
    isSingleLine: true,
    onClearAll: () => {},
    summary: "1,620 games match",
    items: [
      { id: "1", label: "Without platform: Family Computer" },
      { id: "2", label: "Without platform: Nintendo Entertainment System" },
      { id: "3", label: "Without genre: Arcade" },
      { id: "4", label: "Without genre: Fighting" },
      { id: "5", label: "Rating from 60" },
      { id: "6", label: "Votes from 10" },
      { id: "7", label: "Only with achievements" },
    ],
  },
};
