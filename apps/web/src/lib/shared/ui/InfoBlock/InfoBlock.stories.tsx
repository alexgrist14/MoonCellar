import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InfoBlock } from "./InfoBlock";
import { StatTile } from "../StatTile";
import { Badge } from "../Badge";

const tiles = (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "var(--gap-x2)",
    }}
  >
    <StatTile
      label="Main"
      value="24"
      hint="hours"
      align="center"
      isLabelBelow
    />
    <StatTile
      label="Extras"
      value="38"
      hint="hours"
      align="center"
      isLabelBelow
    />
    <StatTile
      label="100%"
      value="71"
      hint="hours"
      align="center"
      isLabelBelow
    />
  </div>
);

const meta = {
  title: "Shared/InfoBlock",
  component: InfoBlock,
  args: { title: "HowLongToBeat:", children: tiles },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--game-hero-counters-width)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Boxed: Story = {};

export const Unboxed: Story = { args: { isBoxed: false } };

export const WithText: Story = {
  args: {
    title: "Links:",
    children: (
      <p style={{ color: "var(--color-text-secondary)" }}>
        Official site, Steam, GOG, Wikipedia
      </p>
    ),
  },
};

export const WithBadges: Story = {
  args: {
    title: "Ratings:",
    children: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-x2)" }}>
        <Badge size="md" tone="positive">
          IGDB 88
        </Badge>
        <Badge size="md" tone="attention">
          HLTB 76
        </Badge>
        <Badge size="md" tone="muted">
          No user score
        </Badge>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: { title: "Time to beat according to the community:" },
};
