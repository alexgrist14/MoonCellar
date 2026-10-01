import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Errors } from "./Errors";

const meta = {
  title: "Shared/Errors",
  component: Errors,
  args: {
    errors: [{ title: "time", description: "Expected number, received nan" }],
  },
} satisfies Meta<typeof Errors>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const Multiple: Story = {
  args: {
    errors: [
      { title: "category", description: "Required" },
      {
        title: "time",
        description: "Number must be greater than or equal to 0",
      },
      {
        title: "rating",
        description: "Number must be less than or equal to 10",
      },
    ],
  },
};

export const Empty: Story = { args: { errors: [] } };
