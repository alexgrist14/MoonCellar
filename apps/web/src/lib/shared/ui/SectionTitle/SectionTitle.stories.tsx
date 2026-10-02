import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionTitle } from "./SectionTitle";
import { Button, ButtonColor } from "../Button";

const meta = {
  title: "Shared/SectionTitle",
  component: SectionTitle,
  args: { children: "Upcoming Releases" },
} satisfies Meta<typeof SectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bar: Story = {};

export const Pill: Story = { args: { variant: "pill", children: "Account" } };

export const AsH1: Story = { args: { as: "h1", children: "Games" } };

export const WithCount: Story = { args: { children: "Reviews", count: 37 } };

export const WithZeroCount: Story = { args: { children: "Lists", count: 0 } };

export const WithAction: Story = {
  args: {
    children: "Lists",
    count: 12,
    action: (
      <Button color={ButtonColor.TRANSPARENT} aria-label="All lists">
        All
      </Button>
    ),
  },
};

export const PillWithAction: Story = {
  args: {
    variant: "pill",
    children: "Account",
    action: <Button color={ButtonColor.TRANSPARENT}>Edit</Button>,
  },
};

export const Display: Story = {
  args: { variant: "display", as: "h1", children: "Metroidvania" },
};

export const DisplayWithCount: Story = {
  args: { variant: "display", as: "h1", children: "Metroidvania", count: 248 },
};

export const LongText: Story = {
  args: {
    children:
      "Every Metroidvania released on the Game Boy Advance and Nintendo DS",
  },
};

export const LongTextWithAction: Story = {
  args: {
    children:
      "Every Metroidvania released on the Game Boy Advance and Nintendo DS",
    count: 64,
    action: <Button color={ButtonColor.TRANSPARENT}>Show all</Button>,
  },
};
