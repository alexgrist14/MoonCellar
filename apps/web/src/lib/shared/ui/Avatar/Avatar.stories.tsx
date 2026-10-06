import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "Shared/Avatar",
  component: Avatar,
  args: {
    user: { _id: "1", userName: "MoonWalker", avatar: "/images/user.png" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 90, height: 90 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};

export const Placeholder: Story = {
  args: { user: { _id: "2", userName: "NewPlayer", avatar: "" } },
};

export const WithoutTooltip: Story = { args: { isWithoutTooltip: true } };

export const WithoutHover: Story = { args: { isWithoutHover: true } };

export const Rounded: Story = { args: { shape: "rounded" } };
