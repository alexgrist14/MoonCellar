import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SpoilerButton } from "./SpoilerButton";

const meta = {
  title: "Shared/SpoilerButton",
  component: SpoilerButton,
  args: {
    children: "Show spoilers",
    onClick: () => {},
  },
} satisfies Meta<typeof SpoilerButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongLabel: Story = {
  args: { children: "Show characters revealed after the second act" },
};

const ToggleDemo = () => {
  const [isShown, setIsShown] = useState(false);

  return (
    <SpoilerButton aria-pressed={isShown} onClick={() => setIsShown(!isShown)}>
      {isShown ? "Hide spoilers" : "Show spoilers"}
    </SpoilerButton>
  );
};

export const Toggle: Story = { render: () => <ToggleDemo /> };
