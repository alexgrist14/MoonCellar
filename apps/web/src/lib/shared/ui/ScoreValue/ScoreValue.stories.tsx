import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScoreValue } from "./ScoreValue";

const meta = {
  title: "Shared/ScoreValue",
  component: ScoreValue,
  args: { value: 7 },
  argTypes: {
    size: { control: "inline-radio", options: ["inline", "md", "lg"] },
  },
} satisfies Meta<typeof ScoreValue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = {};

export const Large: Story = { args: { value: 8.4, size: "lg" } };

export const Inline: Story = {
  args: { size: "inline" },
  render: (args) => (
    <p>
      Rated <ScoreValue {...args} /> by a friend
    </p>
  ),
};

export const CustomMax: Story = { args: { value: 4, max: 5 } };

export const Sizes: Story = {
  render: () => (
    <div
      style={{ display: "flex", alignItems: "baseline", gap: "var(--gap-x4)" }}
    >
      <ScoreValue value={7} size="inline" />
      <ScoreValue value={7} size="md" />
      <ScoreValue value={7} size="lg" />
    </div>
  ),
};
