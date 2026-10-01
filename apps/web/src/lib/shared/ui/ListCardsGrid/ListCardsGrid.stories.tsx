import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListCardsGrid } from "./ListCardsGrid";

const LIST_NAMES = [
  "Best of the SNES",
  "Backlog 2026",
  "Couch co-op nights",
  "Metroidvanias",
  "Short games under 5 hours",
  "Childhood favourites",
];

const Tile = ({ name }: { name: string }) => (
  <div
    style={{
      aspectRatio: "1",
      display: "flex",
      alignItems: "flex-end",
      padding: "var(--padding-x2)",
      borderRadius: "var(--radius-x4)",
      background: "var(--color-bg-tertiary)",
    }}
  >
    {name}
  </div>
);

const meta = {
  title: "Shared/ListCardsGrid",
  component: ListCardsGrid,
  args: {
    children: LIST_NAMES.map((name) => <Tile key={name} name={name} />),
  },
} satisfies Meta<typeof ListCardsGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FewItems: Story = {
  args: {
    children: LIST_NAMES.slice(0, 2).map((name) => (
      <Tile key={name} name={name} />
    )),
  },
};
