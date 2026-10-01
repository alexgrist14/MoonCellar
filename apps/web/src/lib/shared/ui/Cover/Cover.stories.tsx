import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cover } from "./Cover";

const meta = {
  title: "Shared/Cover",
  component: Cover,
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Cover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutText: Story = { args: { isWithoutText: true } };

export const Thumbnail: Story = {
  args: { isWithoutText: true },
  decorators: [
    (Story) => (
      <div style={{ width: 48 }}>
        <Story />
      </div>
    ),
  ],
};
