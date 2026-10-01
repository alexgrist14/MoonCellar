import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScoreValue } from "../ScoreValue";
import { StatusBadge, StatusDetails } from "./StatusBadge";

const STATUSES = [
  "completed",
  "mastered",
  "playing",
  "played",
  "wishlist",
  "backlog",
  "dropped",
];

const meta = {
  title: "Shared/StatusBadge",
  component: StatusBadge,
  args: { status: "completed" },
  argTypes: { status: { control: "select", options: STATUSES } },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {STATUSES.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};

export const UnknownStatus: Story = { args: { status: "abandoned" } };

export const CustomLabel: Story = {
  args: { status: "playing", children: "Playing now" },
};

export const WithDetails: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StatusBadge status="completed" />
      <StatusBadge status="mastered" />
      <StatusDetails items={["PlayStation 5", "42 h", false]} />
    </div>
  ),
};

export const WithNodeDetails: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StatusBadge status="completed" />
      <StatusDetails
        items={["×2", <ScoreValue key="score" value={8} size="inline" />]}
      />
    </div>
  ),
};
