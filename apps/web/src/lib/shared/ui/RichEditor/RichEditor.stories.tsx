import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RichEditor } from "./RichEditor";

const review =
  "<h3>Worth every hour</h3><p>Hollow Knight is a <strong>masterpiece</strong> of atmosphere. The map system feels punishing at first, but it makes every discovery count.</p><ul><li>Tight combat</li><li>Gorgeous hand-drawn art</li><li>Christopher Larkin's soundtrack</li></ul><blockquote><p>No cost too great.</p></blockquote>";

const meta = {
  title: "Shared/RichEditor",
  component: RichEditor,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <ControlledEditor {...args} />,
} satisfies Meta<typeof RichEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledEditor(props: Parameters<typeof RichEditor>[0]) {
  const [value, setValue] = useState(props.value ?? "");

  return <RichEditor {...props} value={value} onChange={setValue} />;
}

export const Empty: Story = { args: { placeholder: "Write a review…" } };

export const WithContent: Story = { args: { value: review } };

export const WithError: Story = {
  args: { error: { message: "Comment is required" } },
};

export const ShortLimit: Story = {
  args: { value: "<p>Short and sweet.</p>", limit: 140 },
};
