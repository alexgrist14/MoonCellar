import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";
import { Button, ButtonColor } from "../Button";
import { SvgHeart, SvgListBullet, SvgMoonBackdrop } from "../svg";

const meta = {
  title: "Shared/EmptyState",
  component: EmptyState,
  args: { title: "List is empty" },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    title: "No lists found",
    description: "Try a different search or clear the filters.",
  },
};

export const WithAction: Story = {
  args: {
    title: "No lists yet",
    description: "Collect games around any idea.",
    action: <Button color={ButtonColor.ACCENT}>Create a list</Button>,
  },
};

export const WithInlineLink: Story = {
  args: {
    title: "Nothing found",
    description: (
      <>
        Try a different search or <a href="#">clear the filters</a>.
      </>
    ),
  },
};

export const CustomIcon: Story = {
  args: {
    title: "No favourites yet",
    icon: <SvgHeart size="40" style={{ color: "var(--favorite-color)" }} />,
  },
};

export const WithoutImage: Story = {
  args: {
    title: "No results",
    description: "Nothing matches this query.",
    isWithoutImage: true,
  },
};

export const Compact: Story = {
  args: {
    variant: "compact",
    title: "No notifications",
    description: "New replies and follows show up here.",
  },
};

export const CompactWithoutImage: Story = {
  args: {
    variant: "compact",
    title: "No drafts",
    isWithoutImage: true,
  },
};

export const Inline: Story = {
  args: {
    variant: "inline",
    title:
      "No favourite characters yet. Open a character on any game page and add them to favourites.",
    icon: <SvgHeart size="24" style={{ color: "var(--favorite-color)" }} />,
  },
};

export const InlineWithAction: Story = {
  args: {
    variant: "inline",
    title:
      "No lists yet. Collect games around any idea — “Best maps in games”, “Co-op with friends”.",
    icon: <SvgListBullet size="24" style={{ color: "var(--color-accent)" }} />,
    action: <Button color={ButtonColor.ACCENT}>Create a list</Button>,
  },
};

export const Page: Story = {
  args: {
    variant: "page",
    as: "h1",
    title: "Something went wrong",
    description:
      "The page could not be loaded. Try again in a moment, or head back to the home page.",
    action: (
      <>
        <Button color={ButtonColor.ACCENT}>Try again</Button>
        <a href="#">Back to home</a>
      </>
    ),
  },
};

export const PageWithFigure: Story = {
  args: {
    variant: "page",
    as: "h1",
    eyebrow: "404",
    title: "Oops! Page not found.",
    description:
      "This page drifted off somewhere beyond the dark side of the moon. Head back and pick another route.",
    icon: (
      <SvgMoonBackdrop
        color="secondary"
        style={{
          width: "var(--not-found-backdrop-size)",
          height: "auto",
          maxWidth: "100%",
        }}
      />
    ),
    action: <Button color={ButtonColor.ACCENT}>Back to home</Button>,
  },
};

export const LongText: Story = {
  args: {
    title: "You have not reviewed any games from this platform yet",
    description:
      "Reviews you write on a game page appear here, grouped by platform and sorted by the date you finished the game. Start with something you played recently.",
  },
};

export const Centered: Story = {
  args: { title: "Nothing found", isCentered: true },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          height: 480,
          border: "1px dashed var(--color-border-primary)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
