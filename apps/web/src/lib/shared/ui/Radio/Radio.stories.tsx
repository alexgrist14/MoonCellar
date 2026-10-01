import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Radio } from "./Radio";

const sortOptions = ["Rating", "Release date", "Name", "Date added"];

const meta = {
  title: "Shared/Radio",
  component: Radio,
  args: { name: "story-radio" },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { checked: true, onChange: () => {} } };

export const Disabled: Story = { args: { disabled: true } };

const RadioGroup = () => {
  const [selected, setSelected] = useState(sortOptions[0]);

  return (
    <div style={{ display: "grid", gap: "var(--gap-x2)", maxWidth: 220 }}>
      {sortOptions.map((option) => (
        <label
          key={option}
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          {option}
          <Radio
            name="story-sort"
            value={option}
            checked={selected === option}
            onChange={() => setSelected(option)}
          />
        </label>
      ))}
    </div>
  );
};

export const Group: Story = { render: () => <RadioGroup /> };
