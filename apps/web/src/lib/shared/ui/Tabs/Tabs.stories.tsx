import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs } from "./Tabs";
import { Button, ButtonColor } from "../Button";

const meta = {
  title: "Shared/Tabs",
  component: Tabs,
  args: {
    contents: [
      { tabName: "Overview" },
      { tabName: "Reviews" },
      { tabName: "Discussion" },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounts: Story = {
  args: {
    contents: [
      { tabName: "Followers", count: 128 },
      { tabName: "Following", count: 12 },
    ],
    defaultTabIndex: 1,
  },
};

const dot = (color: string) => (
  <span
    style={{
      width: "var(--padding-x2)",
      height: "var(--padding-x2)",
      borderRadius: "50%",
      background: color,
    }}
  />
);

export const WithPrefix: Story = {
  args: {
    theme: "segmented",
    ariaLabel: "Review status",
    contents: [
      { tabName: "All", count: 14 },
      { tabName: "Completed", count: 4, prefix: dot("var(--color-green)") },
      { tabName: "Mastered", count: 5, prefix: dot("var(--color-yellow)") },
      { tabName: "Dropped", count: 1, prefix: dot("var(--color-red)") },
    ],
  },
};

const SegmentedDemo = () => {
  const options = ["Top", "New"];
  const [sort, setSort] = useState("Top");

  return (
    <div
      style={{ display: "grid", gap: "var(--gap-x3)", justifyItems: "start" }}
    >
      <Tabs
        theme="segmented"
        ariaLabel="Sort comments"
        contents={options.map((option) => ({
          tabName: option,
          onTabClick: () => setSort(option),
        }))}
        defaultTabIndex={options.indexOf(sort)}
        isUseDefaultIndex
      />
      <span>Sorted by: {sort}</span>
    </div>
  );
};

export const Segmented: Story = { render: () => <SegmentedDemo /> };

export const SegmentedWrap: Story = {
  args: {
    theme: "segmented",
    ariaLabel: "Review status",
    isWrap: true,
    contents: [
      { tabName: "All", count: 214 },
      { tabName: "Completed", count: 48, prefix: dot("var(--color-green)") },
      { tabName: "Mastered", count: 35, prefix: dot("var(--color-yellow)") },
      { tabName: "Playing", count: 12, prefix: dot("var(--color-cyan)") },
      { tabName: "Dropped", count: 9, prefix: dot("var(--color-red)") },
      { tabName: "Backlog", count: 110, prefix: dot("var(--color-pink)") },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

const AddonDemo = () => {
  const [isMastered, setIsMastered] = useState(false);

  return (
    <Tabs
      theme="segmented"
      ariaLabel="Category"
      isWrap
      defaultTabIndex={1}
      contents={[
        { tabName: "Playing", prefix: dot("var(--color-blue)") },
        {
          tabName: "Completed",
          prefix: dot("var(--color-green)"),
          addon: (
            <Button
              type="button"
              color={ButtonColor.SEGMENTED}
              active={isMastered}
              aria-pressed={isMastered}
              onClick={() => setIsMastered((current) => !current)}
            >
              {isMastered ? "★" : "☆"} Mastered
            </Button>
          ),
        },
        { tabName: "Dropped", prefix: dot("var(--color-red)") },
      ]}
    />
  );
};

export const WithAddon: Story = { render: () => <AddonDemo /> };

export const WithHiddenTab: Story = {
  args: {
    defaultTabIndex: 2,
    contents: [
      { tabName: "Completed" },
      { tabName: "Dropped" },
      { tabName: "New", isHidden: true },
    ],
  },
};

export const IconOnly: Story = {
  args: {
    theme: "segmented",
    ariaLabel: "Layout",
    contents: [
      { tabName: "▦", ariaLabel: "Grid", tooltip: "Grid" },
      { tabName: "☰", ariaLabel: "List", tooltip: "List" },
    ],
  },
};

export const WithMobileMenu: Story = {
  args: {
    mobileMenuTitle: "Profile",
    contents: [
      { tabName: "Games", count: 342 },
      { tabName: "Lists", count: 7 },
      { tabName: "Reviews", count: 21 },
      { tabName: "Activity" },
    ],
  },
};
