import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../Button";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Shared/Tooltip",
  component: Tooltip,
  args: {
    content: "Add to favourites",
    children: <Button type="button">Hover me</Button>,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--padding-x14)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Positions: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--gap-x4)" }}>
      {(["top", "right", "bottom", "left"] as const).map((position) => (
        <Tooltip
          key={position}
          {...args}
          position={position}
          content={position}
        >
          <Button type="button">{position}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    content:
      "Combined rating from IGDB critics, HowLongToBeat players and MoonCellar users",
    align: "start",
  },
};

export const Disabled: Story = { args: { isDisabled: true } };
