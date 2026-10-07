import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getMoonPhaseName } from "@/src/lib/shared/utils/moon.utils";
import { MoonPhase } from "./MoonPhase";

const PHASES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

const row = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: "var(--gap-x5)",
};

const cell = {
  display: "grid",
  justifyItems: "center",
  gap: "var(--gap-x2)",
  color: "var(--color-text-muted)",
  fontSize: 12,
};

const meta = {
  title: "Shared/MoonPhase",
  component: MoonPhase,
  args: { phase: 0.3 },
} satisfies Meta<typeof MoonPhase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllPhases: Story = {
  render: (args) => (
    <div style={row}>
      {PHASES.map((phase) => (
        <div key={phase} style={cell}>
          <MoonPhase {...args} phase={phase} size="40" />
          {getMoonPhaseName(phase)}
        </div>
      ))}
    </div>
  ),
};

export const Unknown: Story = { args: { phase: undefined, size: "40" } };

export const Highlighted: Story = {
  args: { phase: 0.9, size: "28", isHighlighted: true },
};

export const WithLabel: Story = {
  args: { phase: 0.5, size: "28", label: "Full moon" },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(["12", "16", "20", "24", "28", "32", "36", "40"] as const).map(
        (size) => (
          <MoonPhase key={size} {...args} size={size} />
        )
      )}
    </div>
  ),
};
