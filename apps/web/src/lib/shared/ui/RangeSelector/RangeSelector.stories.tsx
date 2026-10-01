import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RangeSelector } from "./RangeSelector";

const meta = {
  title: "Shared/RangeSelector",
  component: RangeSelector,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RangeSelector>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <RangeSelector text="Background dim" defaultValue={40} />,
};

export const WithValue: Story = {
  render: () => (
    <RangeSelector
      text="Background dim"
      defaultValue={40}
      isWithValue
      formatValue={(value) => `${value}%`}
    />
  ),
};

export const LabelLeft: Story = {
  render: () => (
    <RangeSelector text="Games" textPosition="left" defaultValue={12} min={1} />
  ),
};

export const Dual: Story = {
  render: () => (
    <RangeSelector
      isDual
      text="Rating"
      defaultValue={[6, 9]}
      min={0}
      max={10}
      isWithValue
    />
  ),
};

export const Green: Story = {
  render: () => (
    <RangeSelector text="Volume" variant="green" defaultValue={75} />
  ),
};

export const Loading: Story = {
  render: () => <RangeSelector text="Background dim" isLoading />,
};

export const Disabled: Story = {
  render: () => (
    <RangeSelector text="Background dim" defaultValue={40} disabled />
  ),
};
