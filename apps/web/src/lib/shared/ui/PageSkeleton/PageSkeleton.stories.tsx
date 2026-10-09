import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageSkeleton } from "./PageSkeleton";

const meta = {
  title: "Shared/PageSkeleton",
  component: PageSkeleton,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
