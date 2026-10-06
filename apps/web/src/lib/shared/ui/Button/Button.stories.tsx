import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SvgClose, SvgComment, SvgThumb } from "../svg";
import { Button, ButtonColor } from "./Button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: { children: "Save" },
  argTypes: {
    color: { control: "select", options: Object.values(ButtonColor) },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accent: Story = { args: { color: ButtonColor.ACCENT } };

export const Danger: Story = {
  args: { color: ButtonColor.RED, children: "Delete" },
};

export const Compact: Story = { args: { compact: true } };

export const Disabled: Story = { args: { disabled: true } };

export const IconOnly: Story = {
  args: { isOnlyIcon: true, children: <SvgClose />, "aria-label": "Close" },
};

export const Ghost: Story = {
  args: {
    color: ButtonColor.GHOST,
    children: [<SvgThumb key="icon" size="16" />, "Helpful"],
  },
};

export const GhostActive: Story = {
  args: {
    color: ButtonColor.GHOST,
    active: true,
    children: [<SvgThumb key="icon" size="16" />, "12"],
  },
};

export const GhostAccentText: Story = {
  args: {
    color: ButtonColor.GHOST,
    compact: true,
    isAccentText: true,
    children: [<SvgComment key="icon" size="16" />, "3 replies"],
  },
};

export const SegmentedActiveColor: Story = {
  args: {
    color: ButtonColor.SEGMENTED,
    active: true,
    style: { "--button-active-color": "var(--game-mastered-color)" } as CSSProperties,
    children: "★ Mastered",
  },
};

export const IconAndLabel: Story = {
  args: {
    color: ButtonColor.ACCENT,
    children: [<SvgThumb key="icon" size="16" />, "Like"],
  },
};

export const Loading: Story = {
  args: { color: ButtonColor.ACCENT, isLoading: true, children: "Sign in" },
};

export const LoadingCompact: Story = {
  args: { isLoading: true, compact: true, children: "Save changes" },
};

export const AsLink: Story = { args: { href: "/games", children: "Games" } };

export const AsExternalLink: Story = {
  args: {
    href: "https://www.igdb.com",
    target: "_blank",
    color: ButtonColor.ACCENT,
    children: "Open in IGDB",
  },
};

export const AsLinkActive: Story = {
  args: { href: "/games", active: true, compact: true, children: "Games" },
};

export const AsLinkIconOnly: Story = {
  args: {
    href: "/",
    isOnlyIcon: true,
    color: ButtonColor.TRANSPARENT,
    tooltip: "Home",
    children: <SvgClose />,
  },
};

export const AsLinkDisabled: Story = {
  args: { href: "/games", disabled: true, children: "Games" },
};
