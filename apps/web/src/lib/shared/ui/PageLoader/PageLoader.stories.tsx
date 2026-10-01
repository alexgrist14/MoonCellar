import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageLoader } from "./PageLoader";

const meta = {
  title: "Shared/PageLoader",
  component: PageLoader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageLoader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
