import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToggleSwitch } from "./ToggleSwitch";

const meta = {
  title: "Shared/ToggleSwitch",
  component: ToggleSwitch,
} satisfies Meta<typeof ToggleSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

const ControlledToggle = () => {
  const [isMastered, setIsMastered] = useState(false);

  return (
    <ToggleSwitch
      label="Mastered?"
      leftContent="No"
      rightContent="Yes"
      checked={isMastered}
      onChange={setIsMastered}
    />
  );
};

export const Default: Story = {};

export const Controlled: Story = { render: () => <ControlledToggle /> };

export const CustomLabels: Story = {
  args: { leftContent: "No", rightContent: "Yes", defaultValue: "right" },
};

export const WithLabel: Story = { args: { label: "Show adult content" } };

export const WithHint: Story = {
  args: {
    label: "Ranked list",
    hint: "Show each game's position, like in a top 10.",
  },
};

export const LabelAtEnd: Story = {
  args: { label: "Only with achievements", labelPosition: "end" },
};

export const Colorless: Story = {
  args: { label: "Music:", isColorless: true },
};

export const Disabled: Story = {
  args: { label: "Show on the game page", isDisabled: true, value: "right" },
};
