import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tooltip } from "../Tooltip";
import { Badge, BadgeTone } from "./Badge";

const TONES: BadgeTone[] = [
  "neutral",
  "muted",
  "attention",
  "positive",
  "negative",
  "accent",
];

const meta = {
  title: "Shared/Badge",
  component: Badge,
  args: { children: "Pending" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Medium: Story = { args: { size: "md" } };

export const WithDot: Story = { args: { tone: "attention", isWithDot: true } };

export const AllTones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--gap-x3)" }}>
      {(["sm", "md"] as const).map((size) => (
        <div
          key={size}
          style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-x2)" }}
        >
          {TONES.map((tone) => (
            <Badge key={tone} {...args} tone={tone} size={size}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const AllTonesWithDot: Story = {
  ...AllTones,
  args: { isWithDot: true },
};

export const InText: Story = {
  render: (args) => (
    <p style={{ color: "var(--color-text-secondary)" }}>
      Comment hidden by a moderator{" "}
      <Badge {...args} tone="attention">
        Hidden
      </Badge>
    </p>
  ),
};

export const Outlined: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--gap-x2)",
        padding: "var(--padding-x3)",
        borderRadius: "var(--radius-x3)",
        background: "var(--color-bg-tertiary)",
      }}
    >
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone} variant="outlined">
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Wrapping: Story = {
  args: {
    size: "md",
    isWrap: true,
    children: "The Legend of Zelda: Tears of the Kingdom — Collector's Edition",
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", maxWidth: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithTooltip: Story = {
  render: (args) => (
    <Tooltip content="Not shown on the game page">
      <Badge {...args} tone="muted" tabIndex={0}>
        Not published
      </Badge>
    </Tooltip>
  ),
};

export const Struck: Story = {
  args: { tone: "muted", isStruck: true, children: "Hollow Knight" },
};
