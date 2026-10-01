import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SavedList } from "./SavedList";

const meta = {
  title: "Shared/SavedList",
  component: SavedList,
  args: {
    items: [
      { name: "Metroidvanias on Switch", onApply: fn(), onRemove: fn() },
      { name: "Short JRPGs", onApply: fn(), onRemove: fn() },
      { name: "Co-op games rated 80+", onApply: fn(), onRemove: fn() },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "360px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SavedList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongName: Story = {
  args: {
    items: [
      {
        name: "Story-driven adventure games released between 2010 and 2020 on PC and PlayStation",
        onApply: fn(),
        onRemove: fn(),
      },
    ],
  },
};

export const Empty: Story = { args: { items: [] } };
