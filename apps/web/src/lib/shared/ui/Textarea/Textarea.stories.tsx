import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const LONG_TEXT =
  "A slow-burning metroidvania that rewards patience. The map opens up in every direction after the first few hours, the bosses are tough but fair, and the soundtrack carries the melancholy of the fallen kingdom. ".repeat(
    4
  );

const TextareaDemo = ({ initial = "" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);

  return (
    <div style={{ maxWidth: "480px" }}>
      <Textarea
        value={value}
        rows={3}
        placeholder="What ties these games together?"
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
};

const meta = {
  title: "Shared/Textarea",
  component: Textarea,
  args: { placeholder: "Write a review" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "480px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <TextareaDemo /> };

export const LongText: Story = {
  render: () => <TextareaDemo initial={LONG_TEXT} />,
};

export const WithError: Story = {
  args: {
    defaultValue: "Too short",
    error: { type: "minLength", message: "At least 20 characters" },
  },
};

export const WithoutResizeHandle: Story = {
  args: { resize: false, rows: 2 },
};

export const FixedHeight: Story = {
  args: { isDisableAutoResize: true, rows: 4, defaultValue: LONG_TEXT },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Locked while saving" },
};
