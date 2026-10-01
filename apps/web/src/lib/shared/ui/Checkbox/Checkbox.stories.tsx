import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const CheckboxDemo = () => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Checkbox
        checked={isChecked}
        onChange={(event) => setIsChecked(event.target.checked)}
      />
      Contains spoilers
    </label>
  );
};

const meta = {
  title: "Shared/Checkbox",
  component: Checkbox,
  args: { "aria-label": "Select", checked: false, onChange: () => {} },
  argTypes: {
    colorTheme: { control: "select", options: ["accent", "on", "off"] },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { checked: true } };

export const Included: Story = { args: { checked: true, colorTheme: "on" } };

export const Excluded: Story = { args: { checked: true, colorTheme: "off" } };

export const BorderFromTheme: Story = {
  args: { colorTheme: "on", isBorderFromTheme: true },
};

export const AccentBorder: Story = { args: { isBorderFromTheme: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Interactive: Story = { render: () => <CheckboxDemo /> };

export const Uncontrolled: Story = {
  render: () => (
    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Checkbox defaultChecked />
      Uncontrolled
    </label>
  ),
};
