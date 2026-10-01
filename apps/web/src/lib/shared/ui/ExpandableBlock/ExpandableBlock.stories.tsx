import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExpandableBlock } from "./ExpandableBlock";

const summary =
  "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs, all in a classic, hand-drawn 2D style. Hollow Knight is a classically styled 2D action adventure across a vast interconnected world. Explore twisting caverns, ancient cities and deadly wastes; battle tainted creatures and befriend bizarre bugs; and solve ancient mysteries at the kingdom's heart.";

const keywords = [
  "metroidvania",
  "souls-like",
  "hand-drawn",
  "insects",
  "underground",
  "boss fight",
  "exploration",
  "backtracking",
  "charms",
  "map system",
  "difficult",
  "atmospheric",
  "melancholic",
  "lore",
  "fast travel",
  "secret areas",
];

const meta = {
  title: "Shared/ExpandableBlock",
  component: ExpandableBlock,
  args: { title: "Summary", children: <p>{summary}</p> },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExpandableBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ModalMode: Story = {};

export const ClampHeight: Story = {
  args: {
    title: "Keywords",
    clampHeight: "var(--game-keywords-collapsed-height)",
    children: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-x2)" }}>
        {keywords.map((keyword) => (
          <span key={keyword}>#{keyword}</span>
        ))}
      </div>
    ),
  },
};

export const ShortContent: Story = {
  args: { children: <p>A short summary that fits.</p> },
};

export const ScrollMode: Story = { args: { mode: "scroll" } };
