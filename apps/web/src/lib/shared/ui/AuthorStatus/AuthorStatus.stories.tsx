import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthorStatus } from "./AuthorStatus";

const meta = {
  title: "Shared/AuthorStatus",
  component: AuthorStatus,
  args: { category: "completed", time: 42 },
  decorators: [
    (Story) => (
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--gap-x2)" }}
      >
        <span>Kaelen</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthorStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Completed: Story = {};

export const Mastered: Story = { args: { isMastered: true, time: 118 } };

export const Playing: Story = { args: { category: "playing", time: 7 } };

export const Wishlist: Story = {
  args: { category: "wishlist", time: undefined },
};
