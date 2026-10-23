import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "Shared/ProgressBar",
  component: ProgressBar,
  args: { value: 34, max: 51, "aria-label": "34 of 51 achievements unlocked" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--vndb-search-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 51, tone: "attention" } };

export const Indeterminate: Story = {
  args: { value: undefined, "aria-label": "Counting conflicts" },
};

export const AllTones: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--gap-x3)" }}
    >
      {(
        ["neutral", "accent", "positive", "attention", "negative"] as const
      ).map((tone) => (
        <ProgressBar key={tone} {...args} tone={tone} aria-label={tone} />
      ))}
    </div>
  ),
};
