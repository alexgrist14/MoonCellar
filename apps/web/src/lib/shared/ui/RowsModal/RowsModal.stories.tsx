import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Fragment } from "react";
import { EmptyState } from "../EmptyState";
import { RowsModal } from "./RowsModal";
import { asModal } from "@/.storybook/decorators";

const PLAYTHROUGHS = [
  { id: "1", status: "Completed", platform: "PlayStation", time: "42h" },
  { id: "2", status: "Played", platform: "PC", time: "12h" },
  { id: "3", status: "Dropped", platform: "Nintendo Switch", time: "3h" },
  { id: "4", status: "Completed", platform: "PlayStation 4", time: "38h" },
  { id: "5", status: "Wishlist", platform: "PlayStation 5", time: "—" },
  { id: "6", status: "Completed", platform: "Steam Deck", time: "51h" },
];

const renderRows = (items: typeof PLAYTHROUGHS) =>
  items.map((item) => (
    <Fragment key={item.id}>
      <strong>{item.status}</strong>
      <span style={{ color: "var(--color-text-secondary)" }}>
        {item.platform} · {item.time}
      </span>
    </Fragment>
  ));

const meta = {
  title: "Shared/RowsModal",
  component: RowsModal,
  args: {
    title: "Final Fantasy VII",
    rows: renderRows(PLAYTHROUGHS.slice(0, 3)),
    emptyState: <EmptyState title="No playthroughs yet" />,
  },
  decorators: [asModal],
} satisfies Meta<typeof RowsModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { rows: [] } };

export const ManyRows: Story = {
  args: {
    rows: renderRows([...PLAYTHROUGHS, ...PLAYTHROUGHS, ...PLAYTHROUGHS]),
  },
};
