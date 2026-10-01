import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Input } from "./Input";

const ControlledInput = () => {
  const [value, setValue] = useState("Chrono Trigger");

  return (
    <div style={{ display: "grid", gap: "var(--gap-x2)" }}>
      <Input
        value={value}
        placeholder="Search games..."
        onChange={(event) => setValue(event.target.value)}
      />
      <p style={{ color: "var(--color-text-muted)" }}>Value: {value}</p>
    </div>
  );
};

const meta = {
  title: "Shared/Input",
  component: Input,
  args: { placeholder: "Enter name..." },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue:
      "The Legend of Zelda: Breath of the Wild – Expansion Pass: The Champions' Ballad",
  },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password", defaultValue: "secret" },
};

export const WithError: Story = {
  args: {
    defaultValue: "mo",
    error: {
      type: "too_small",
      message: "Username must contain at least 3 characters",
    },
  },
};

export const WithStringError: Story = {
  args: {
    defaultValue: "My list",
    error: "A list with this name already exists",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "moonwalker" },
};

export const Numeric: Story = {
  args: {
    type: "number",
    inputMode: "numeric",
    min: 1,
    max: 99,
    step: 1,
    placeholder: "Page",
    "aria-label": "Go to page",
  },
};

export const Controlled: Story = {
  render: () => <ControlledInput />,
};
