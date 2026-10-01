import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Scrollbar } from "./Scrollbar";

const games = [
  "Hollow Knight",
  "Celeste",
  "Hades",
  "Dead Cells",
  "Ori and the Will of the Wisps",
  "Elden Ring",
  "Disco Elysium",
  "Outer Wilds",
  "Return of the Obra Dinn",
  "Slay the Spire",
  "Stardew Valley",
  "Baldur's Gate 3",
  "Sekiro: Shadows Die Twice",
  "Inscryption",
  "Tunic",
  "Cuphead",
  "Undertale",
  "Hyper Light Drifter",
];

const rows = games.map((game) => (
  <p key={game} style={{ paddingBlock: "var(--padding-x2)" }}>
    {game}
  </p>
));

const tiles = games.map((game) => (
  <div
    key={game}
    style={{
      flex: "0 0 160px",
      height: 90,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      borderRadius: "var(--radius-x3)",
      background: "var(--color-bg-tertiary)",
    }}
  >
    {game}
  </div>
));

const meta = {
  title: "Shared/Scrollbar",
  component: Scrollbar,
  args: { children: rows, contentStyle: { maxHeight: 240 } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Scrollbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};

export const AbsoluteTrack: Story = { args: { type: "absolute" } };

export const Horizontal: Story = {
  args: {
    isHorizontal: true,
    contentStyle: { display: "flex", gap: "var(--gap-x2)" },
    children: tiles,
  },
};

export const HorizontalWithArrows: Story = {
  args: { ...Horizontal.args, isWithArrows: true },
};

export const ShortContent: Story = { args: { children: rows.slice(0, 3) } };
