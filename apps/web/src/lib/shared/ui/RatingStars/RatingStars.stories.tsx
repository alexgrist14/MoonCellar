import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RatingStars } from "./RatingStars";

const meta = {
  title: "Shared/RatingStars",
  component: RatingStars,
  args: { rating: 8 },
  argTypes: {
    rating: { control: { type: "range", min: 0, max: 10, step: 0.5 } },
  },
} satisfies Meta<typeof RatingStars>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fractional: Story = { args: { rating: 6.5 } };

export const Full: Story = { args: { rating: 10 } };

export const Empty: Story = { args: { rating: 0 } };

export const Large: Story = { args: { rating: 7.5, size: "24" } };
