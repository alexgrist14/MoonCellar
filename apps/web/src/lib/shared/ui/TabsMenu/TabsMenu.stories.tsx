import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { TabsMenu } from "./TabsMenu";

const TABS = [
  { tabName: "Overview" },
  { tabName: "Games", count: 248 },
  { tabName: "Lists", count: 12 },
  { tabName: "Reviews", count: 37 },
  { tabName: "Activity" },
];

const TabsMenuDemo = ({
  isWithCounts,
  hiddenIndex,
}: {
  isWithCounts?: boolean;
  hiddenIndex?: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <TabsMenu
      title="Profile"
      activeIndex={activeIndex}
      tabs={TABS.map((tab, index) => ({
        tabName: tab.tabName,
        count: isWithCounts ? tab.count : undefined,
        isHidden: index === hiddenIndex,
        onTabClick: () => setActiveIndex(index),
      }))}
    />
  );
};

const meta = {
  title: "Shared/TabsMenu",
  component: TabsMenuDemo,
} satisfies Meta<typeof TabsMenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounts: Story = { args: { isWithCounts: true } };

export const Open: Story = {
  args: { isWithCounts: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
  },
};

export const WithHiddenTab: Story = {
  args: { hiddenIndex: 4 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
  },
};
