import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Breadcrumbs } from "./Breadcrumbs";

const meta = {
  title: "Shared/Breadcrumbs",
  component: Breadcrumbs,
  args: {
    items: [
      { name: "Home", href: "/" },
      { name: "Games", href: "/games" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoLevels: Story = {};

export const Deep: Story = {
  args: {
    items: [
      { name: "Home", href: "/" },
      { name: "Games", href: "/games" },
      { name: "Platform", href: "/games/platform" },
      { name: "Super Nintendo", href: "/games/platform/snes" },
    ],
  },
};

export const LongNames: Story = {
  args: {
    items: [
      { name: "Home", href: "/" },
      { name: "Lists", href: "/lists" },
      {
        name: "Every JRPG I finished on a handheld between 2004 and 2012",
        href: "/lists/handheld-jrpgs",
      },
    ],
  },
};
