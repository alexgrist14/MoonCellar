import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./Separator";

const meta = {
  title: "Shared/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "16px", height: "32px" }}>
      <span>Games</span>
      <Separator {...args} />
      <span>Lists</span>
    </div>
  ),
};

export const Horizontal: Story = {
  args: { direction: "horizontal" },
  render: (args) => (
    <div style={{ display: "grid", gap: "16px", maxWidth: "320px" }}>
      <span>Recently played</span>
      <Separator {...args} />
      <span>Wishlist</span>
    </div>
  ),
};
