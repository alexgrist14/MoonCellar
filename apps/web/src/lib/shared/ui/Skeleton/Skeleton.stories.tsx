import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Shared/Skeleton",
  component: Skeleton,
  argTypes: {
    shape: { control: "select", options: ["block", "text", "circle"] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "360px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Block: Story = { args: { height: "var(--padding-x20)" } };

export const Text: Story = { args: { shape: "text", width: "60%" } };

export const Paragraph: Story = { args: { shape: "text", count: 4 } };

export const Circle: Story = {
  args: { shape: "circle", width: "var(--community-avatar-size)" },
};

export const GameCover: Story = {
  args: {
    width: "var(--games-card-min-width)",
    aspectRatio: "var(--cover-ratio)",
    radius: "var(--radius-x4)",
  },
};

export const FieldRows: Story = {
  args: {
    count: 3,
    height: "var(--field-control-height)",
    radius: "var(--radius-control)",
    gap: "var(--gap-x4)",
  },
};

export const Composed: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "var(--community-avatar-size) minmax(0, 1fr)",
        gap: "var(--gap-x3)",
      }}
    >
      <Skeleton shape="circle" width="var(--community-avatar-size)" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap-x2)",
        }}
      >
        <Skeleton shape="text" width="30%" />
        <Skeleton shape="text" count={2} />
      </div>
    </div>
  ),
};
