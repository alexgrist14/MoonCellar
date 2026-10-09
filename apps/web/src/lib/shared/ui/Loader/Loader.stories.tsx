import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Loader } from "./Loader";

const meta = {
  title: "Shared/Loader",
  component: Loader,
  argTypes: {
    type: {
      control: "select",
      options: ["pulse", "propogate", "pacman", "moon"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "160px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pulse: Story = {};

export const Propagate: Story = { args: { type: "propogate" } };

export const Pacman: Story = { args: { type: "pacman" } };

export const Moon: Story = { args: { type: "moon" } };

export const CustomColor: Story = {
  args: { type: "moon", color: "#f5f5f5", speedMultiplier: 0.5 },
};

export const Small: Story = { args: { size: 8 } };
