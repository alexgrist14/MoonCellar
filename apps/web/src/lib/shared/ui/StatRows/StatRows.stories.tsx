import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatRows } from "./StatRows";
import { SvgRetroAchievements, SvgSteam } from "../svg";

const meta = {
  title: "Shared/StatRows",
  component: StatRows,
  args: {
    rows: [
      { label: "Main story", value: "24", unit: "h" },
      { label: "Main + extra", value: "38½", unit: "h" },
      { label: "Completionist", value: "61", unit: "h" },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 380 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatRows>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleRow: Story = {
  args: { rows: [{ label: "Average length", value: "6", unit: "h" }] },
};

export const WithIcons: Story = {
  args: {
    rows: [
      {
        label: "Steam",
        value: "137",
        icon: <SvgSteam size="16" />,
        title: "137 achievements on Steam",
      },
      {
        label: "RetroAchievements",
        sublabel: "PlayStation 2",
        value: "117",
        icon: <SvgRetroAchievements size="20" />,
      },
    ],
  },
};

export const Clickable: Story = {
  args: {
    rows: [
      {
        label: "Steam",
        value: "137",
        icon: <SvgSteam size="16" />,
        onClick: () => undefined,
      },
      {
        label: "RetroAchievements",
        sublabel: "PlayStation 2",
        value: "117",
        icon: <SvgRetroAchievements size="20" />,
        onClick: () => undefined,
      },
    ],
  },
};

export const Linked: Story = {
  args: {
    rows: [
      {
        label: "Steam",
        value: "137",
        icon: <SvgSteam size="16" />,
        href: "https://steamcommunity.com/stats/367520/achievements",
        isExternal: true,
      },
      {
        key: "ra-gamecube",
        label: "RetroAchievements",
        sublabel: "GameCube",
        value: "190",
        icon: <SvgRetroAchievements size="20" />,
        href: "https://retroachievements.org/game/2840",
        isExternal: true,
      },
      {
        key: "ra-ps2",
        label: "RetroAchievements",
        sublabel: "PlayStation 2",
        value: "107",
        icon: <SvgRetroAchievements size="20" />,
        href: "https://retroachievements.org/game/20580",
        isExternal: true,
      },
    ],
  },
};

export const LongValues: Story = {
  args: {
    rows: [
      { label: "Main story", value: "102", unit: "h" },
      { label: "Main + extra", value: "128½", unit: "h" },
      { label: "Completionist", value: "1,182", unit: "h" },
    ],
  },
};

export const LongLabel: Story = {
  args: {
    rows: [
      {
        label: "Average length reported by players across every release",
        value: "75",
        unit: "h",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 260 }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = { args: { rows: [] } };
