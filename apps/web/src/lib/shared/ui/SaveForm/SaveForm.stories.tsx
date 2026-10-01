import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SaveForm } from "./SaveForm";

const meta = {
  title: "Shared/SaveForm",
  component: SaveForm,
  args: { saveCallback: () => {} },
} satisfies Meta<typeof SaveForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomPlaceholder: Story = {
  args: { placeholder: "Preset name, e.g. Weekend JRPGs" },
};
