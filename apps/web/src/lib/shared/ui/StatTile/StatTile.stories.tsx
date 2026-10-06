import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { StatTile } from "./StatTile";

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "var(--gap-x2)",
  maxWidth: "var(--game-hero-counters-width)",
};

const dot = (color: string) => (
  <span
    style={{
      width: "var(--people-avatar-size)",
      height: "var(--people-avatar-size)",
      borderRadius: "50%",
      background: color,
      marginLeft: "calc(var(--padding-x2) * -1)",
      outline: "2px solid var(--color-bg-primary)",
    }}
  />
);

const meta = {
  title: "Shared/StatTile",
  component: StatTile,
  args: { label: "Games", value: "1,248" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--game-hero-counters-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = {
  args: { label: "Reviews", value: "37", onClick: fn() },
};

export const WithChildren: Story = {
  args: {
    label: "Followers",
    value: "12",
    onClick: fn(),
    children: (
      <span style={{ display: "flex", paddingLeft: "var(--padding-x2)" }}>
        {dot("var(--color-pink)")}
        {dot("var(--color-cyan)")}
        {dot("var(--color-yellow)")}
      </span>
    ),
  },
};

export const ValueColor: Story = {
  args: {
    label: "Beaten by",
    value: "512",
    valueColor: "var(--game-completed-color)",
  },
};

export const CenteredWithHint: Story = {
  args: {
    label: "Main story",
    value: "24",
    hint: "hours",
    align: "center",
    isLabelBelow: true,
  },
};

export const Compact: Story = {
  args: {
    label: "Main + extra",
    value: "7½",
    hint: "Hours",
    align: "center",
    isLabelBelow: true,
    isCompact: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 128 }}>
        <Story />
      </div>
    ),
  ],
};

export const Grid: Story = {
  render: () => (
    <div style={grid}>
      <StatTile
        label="Beaten by"
        value="512"
        valueColor="var(--game-completed-color)"
      />
      <StatTile
        label="Playing now"
        value="48"
        valueColor="var(--game-playing-color)"
      />
      <StatTile
        label="In wishlist"
        value="1,032"
        valueColor="var(--game-wishlist-color)"
      />
      <StatTile
        label="Main story"
        value="24"
        hint="hours"
        align="center"
        isLabelBelow
      />
      <StatTile
        label="Main + extras"
        value="38"
        hint="hours"
        align="center"
        isLabelBelow
      />
      <StatTile
        label="Completionist"
        value="71"
        hint="hours"
        align="center"
        isLabelBelow
      />
    </div>
  ),
};

export const LongLabel: Story = {
  args: { label: "Games finished this year on handhelds", value: "7" },
};

export const WithoutLabel: Story = {
  args: { label: undefined, value: "12h 30m", align: "center" },
};
