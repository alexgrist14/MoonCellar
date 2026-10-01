import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Background } from "./Background";

const meta = {
  title: "Shared/Background",
  component: Background,
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          height: 600,
          borderRadius: "var(--radius-x5)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Background>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
