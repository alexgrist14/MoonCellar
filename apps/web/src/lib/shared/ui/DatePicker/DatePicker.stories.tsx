import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DatePicker } from "./DatePicker";

const DatePickerDemo = ({ initial }: { initial?: string }) => {
  const [value, setValue] = useState(initial ?? "");

  return (
    <div style={{ maxWidth: "260px" }}>
      <DatePicker
        value={value}
        ariaLabel="Completion date"
        onChange={setValue}
      />
    </div>
  );
};

const meta = {
  title: "Shared/DatePicker",
  component: DatePicker,
  args: { onChange: () => {} },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = { render: () => <DatePickerDemo /> };

export const WithValue: Story = {
  render: () => <DatePickerDemo initial="2026-09-20" />,
};

export const Disabled: Story = {
  args: { value: "2026-09-20", isDisabled: true },
};
