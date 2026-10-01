import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spoiler } from "./Spoiler";

const meta = {
  title: "Shared/Spoiler",
  component: Spoiler,
  args: {
    children: (
      <p style={{ maxWidth: 480 }}>
        The final chapter reveals that the narrator has been the antagonist all
        along, and the last boss fight takes place inside the protagonist&apos;s
        memories of the opening village.
      </p>
    ),
  },
} satisfies Meta<typeof Spoiler>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hidden: Story = {};

export const Inactive: Story = { args: { isActive: false } };

export const CustomLabel: Story = { args: { label: "Show ending details" } };
